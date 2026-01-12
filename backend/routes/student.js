const express = require("express");
const router = express.Router();
const vm = require("vm");
const { spawnSync } = require("child_process");

/* ===============================
   GET STUDENT ENROLLED COURSES
================================ */
router.get("/courses", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;

    db.query(
        `
        SELECT 
            courses.id,
            courses.title,
            courses.description,
            courses.category,
            courses.level,
            courses.image,
            IFNULL(enrollments.progress, 0) AS progress
        FROM enrollments
        JOIN courses ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?
        `,
        [studentId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

/* ===============================
   GET COURSE DETAILS (STUDENT)
================================ */
router.get("/course/:courseId", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;
    const { courseId } = req.params;

    db.query(
        `
        SELECT courses.*
        FROM enrollments
        JOIN courses ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ? AND courses.id = ?
        `,
        [studentId, courseId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            if (!rows.length)
                return res.status(403).json({ message: "Not enrolled in this course" });

            res.json(rows[0]);
        }
    );
});

/* ===============================
   GET COURSE ASSIGNMENTS
================================ */
router.get("/course/:courseId/assignments", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;
    const { courseId } = req.params;

    db.query(
        "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?",
        [studentId, courseId],
        (err, enroll) => {
            if (err) return res.status(500).json(err);
            if (!enroll.length)
                return res.status(403).json({ message: "Not enrolled" });

            db.query(
                "SELECT id, title, description, due_date, type FROM assignments WHERE course_id = ?",
                [courseId],
                (err, rows) => {
                    if (err) return res.status(500).json(err);
                    res.json(rows);
                }
            );
        }
    );
});

/* ===============================
   ALL ASSIGNMENTS (SIDEBAR PAGE)
================================ */
router.get("/assignments", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;

    db.query(
        `
        SELECT 
            assignments.id,
            assignments.title,
            assignments.description,
            assignments.due_date,
            assignments.course_id,
            courses.title AS course_title
        FROM enrollments
        JOIN assignments ON enrollments.course_id = assignments.course_id
        JOIN courses ON courses.id = assignments.course_id
        WHERE enrollments.user_id = ?
        `,
        [studentId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

/* ===============================
   COURSE VIDEOS (STUDENT)
================================ */
router.get("/course/:courseId/videos", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;
    const { courseId } = req.params;

    db.query(
        "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?",
        [studentId, courseId],
        (err, enroll) => {
            if (err) return res.status(500).json(err);
            if (!enroll.length)
                return res.status(403).json({ message: "Not enrolled" });

            db.query(
                "SELECT * FROM course_videos WHERE course_id = ? ORDER BY created_at ASC",
                [courseId],
                (err, videos) => {
                    if (err) return res.status(500).json(err);
                    res.json(videos);
                }
            );
        }
    );
});

/* ===============================
   GET ASSIGNMENT DETAILS
================================ */
router.get("/assignment/:id", (req, res) => {
    const db = req.app.get("db");

    db.query(
        "SELECT * FROM assignments WHERE id = ?",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows[0]);
        }
    );
});

/* =====================================================
   ▶ RUN CODE (TEST CASE EXECUTION ENGINE)  🔥
===================================================== */
router.post("/assignment/:id/run", (req, res) => {
    const db = req.app.get("db");
    const { code, language } = req.body;
    const assignmentId = req.params.id;

    db.query(
        "SELECT test_cases FROM assignments WHERE id = ?",
        [assignmentId],
        (err, rows) => {
            if (err || !rows.length)
                return res.status(500).json({ message: "Assignment error" });

            let testCases;
            try {
                testCases = JSON.parse(rows[0].test_cases);
            } catch {
                return res.status(500).json({ message: "Invalid test cases" });
            }

            const results = [];

            for (let tc of testCases) {
                try {
                    let output;

                    /* JS */
                    if (language === "js") {
                        const sandbox = {};
                        vm.createContext(sandbox);
                        vm.runInContext(
                            `${code}\nresult = solve(...${JSON.stringify(tc.input)})`,
                            sandbox,
                            { timeout: 1000 }
                        );
                        output = sandbox.result;
                    }

                    /* PYTHON */
                    if (language === "python") {
                        const py = spawnSync(
                            "python",
                            ["-c", `${code}\nprint(solve(*${JSON.stringify(tc.input)}))`],
                            { timeout: 1000 }
                        );
                        output = py.stdout.toString().trim();
                    }

                    const passed = String(output) === String(tc.output);

                    results.push({
                        input: tc.input,
                        expected: tc.output,
                        output,
                        passed
                    });

                } catch (e) {
                    results.push({
                        input: tc.input,
                        expected: tc.output,
                        output: e.message,
                        passed: false
                    });
                }
            }

            const passed = results.filter(r => r.passed).length;
            const total = results.length;
            const score = Math.round((passed / total) * 100);

            res.json({ results, passed, total, score });
        }
    );
});



/* =====================================================
   SUBMIT ASSIGNMENT (TEMP EVALUATION)
===================================================== */
router.post("/assignment/:id/submit", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;
    const assignmentId = req.params.id;
    const { code, language } = req.body;

    db.query(
        "SELECT test_cases FROM assignments WHERE id = ?",
        [assignmentId],
        (err, rows) => {
            if (err || !rows.length)
                return res.status(500).json({ message: "Assignment error" });

            let testCases;
            try {
                testCases = JSON.parse(rows[0].test_cases);
            } catch {
                return res.status(500).json({ message: "Invalid test cases" });
            }

            let passed = 0;
            const total = testCases.length;

            for (let tc of testCases) {
    try {
        let output;

        /* ---------- JS ---------- */
        if (language === "js") {
            const sandbox = {};
            vm.createContext(sandbox);

            vm.runInContext(
                `${code}\nresult = solve(...${JSON.stringify(tc.input)})`,
                sandbox,
                { timeout: 1000 }
            );

            output = sandbox.result;
        }

        /* ---------- PYTHON ---------- */
        else if (language === "python") {
            const pythonCode = `
${code}

result = solve(*${JSON.stringify(tc.input)})
print(result)
`;

            const py = spawnSync(
                "python",
                ["-c", pythonCode],
                { timeout: 1000 }
            );

            if (py.stderr.toString()) {
                throw new Error(py.stderr.toString());
            }

            output = py.stdout.toString().trim();
        }

        if (String(output) === String(tc.output)) {
            passed++;
        }

    } catch {
        // failed test → ignore
    }
}


            const score = Math.round((passed / total) * 100);

            const feedback =
                score === 100
                    ? "Excellent! All test cases passed."
                    : score >= 50
                    ? "Good attempt. Some test cases failed."
                    : "Needs improvement.";

            db.query(
                `
                INSERT INTO assignment_submissions
                (assignment_id, student_id, submitted_code, score, status)
                VALUES (?, ?, ?, ?, 'evaluated')
                ON DUPLICATE KEY UPDATE
                submitted_code=?, score=?, status='evaluated'
                `,
                [assignmentId, studentId, code, score, code, score],
                () => {
                    res.json({
                        status: "evaluated",
                        score,
                        feedback
                    });
                }
            );
        }
    );
});


/* ===============================
   📊 STUDENT PROGRESS (FINAL)
================================ */
/* ===============================
   📊 STUDENT PROGRESS (FIXED)
================================ */
router.get("/progress", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;

    const statsQuery = `
        SELECT
            COUNT(*) AS submittedAssignments,
            IFNULL(AVG(score), 0) AS averageScore,
            IFNULL(MAX(score), 0) AS bestScore
        FROM assignment_submissions
        WHERE student_id = ?
    `;

    const chartQuery = `
    SELECT 
        a.title,
        s.score
    FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id
    WHERE s.student_id = ?
    ORDER BY s.id ASC
`;


    const passFailQuery = `
    SELECT
        SUM(CASE WHEN score >= 50 THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) AS failed
    FROM assignment_submissions
    WHERE student_id = ?
`;


    db.query(statsQuery, [studentId], (err, stats) => {
        if (err) return res.status(500).json(err);

        db.query(chartQuery, [studentId], (err, chartRows) => {
            if (err) return res.status(500).json(err);

            db.query(passFailQuery, [studentId], (err, pf) => {
                if (err) return res.status(500).json(err);

                res.json({
                    stats: {
                        submittedAssignments: stats[0].submittedAssignments,
                        averageScore: Math.round(stats[0].averageScore),
                        bestScore: stats[0].bestScore
                    },
                    chartData: chartRows,
                    passFail: {
                        passed: pf[0].passed || 0,
                        failed: pf[0].failed || 0
                    }
                });
            });
        });
    });
});


router.get("/rank", (req, res) => {
    const db = req.app.get("db");
    const studentId = req.user.id;

    const query = `
        SELECT student_id,
               AVG(score) AS avgScore,
               RANK() OVER (ORDER BY AVG(score) DESC) AS rank
        FROM assignment_submissions
        GROUP BY student_id
    `;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json(err);

        const me = rows.find(r => r.student_id === studentId);
        res.json(me || { rank: "N/A" });
    });
});





/* ✅ EXPORT */
module.exports = router;
