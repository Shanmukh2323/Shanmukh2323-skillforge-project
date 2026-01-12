const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

console.log("🔥 INSTRUCTOR ROUTES FILE LOADED 🔥");

/* =====================================================
   HEALTH CHECK
===================================================== */
router.post("/ping", (req, res) => {
    res.json({ message: "Instructor router is working" });
});

/* =====================================================
   INSTRUCTOR DASHBOARD
===================================================== */
router.get("/dashboard", (req, res) => {
    const db = req.app.get("db");
    const instructorId = req.user.id;

    db.query(
        "SELECT COUNT(*) AS total FROM courses WHERE instructor_id = ?",
        [instructorId],
        (err, courseData) => {
            if (err) return res.status(500).json(err);

            db.query(
                `SELECT COUNT(*) AS total
                 FROM enrollments
                 WHERE course_id IN (
                    SELECT id FROM courses WHERE instructor_id = ?
                 )`,
                [instructorId],
                (err, studentData) => {
                    if (err) return res.status(500).json(err);

                    res.json({
                        totalCourses: courseData[0].total,
                        totalStudents: studentData[0].total,
                        views: 1230,
                        newEnrollments: 48
                    });
                }
            );
        }
    );
});

/* =====================================================
   GET INSTRUCTOR COURSES
===================================================== */
router.get("/courses", (req, res) => {
    const db = req.app.get("db");

    db.query(
        "SELECT * FROM courses WHERE instructor_id = ?",
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

/* =====================================================
   STUDENTS
===================================================== */
router.get("/course/:courseId/students", (req, res) => {
    const db = req.app.get("db");
    const { courseId } = req.params;

    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            if (!rows.length)
                return res.status(403).json({ message: "Not your course" });

            db.query(
                `SELECT users.id, users.name, users.email, enrollments.progress
                 FROM enrollments
                 JOIN users ON users.id = enrollments.user_id
                 WHERE enrollments.course_id = ?`,
                [courseId],
                (err, result) => {
                    if (err) return res.status(500).json(err);
                    res.json(result);
                }
            );
        }
    );
});

/* =====================================================
   ADD STUDENT
===================================================== */
router.post("/course/:courseId/add-student", (req, res) => {
    const db = req.app.get("db");
    const { courseId } = req.params;
    const { name, email } = req.body;

    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, req.user.id],
        (err, courseRows) => {
            if (err) return res.status(500).json(err);
            if (!courseRows.length)
                return res.status(403).json({ message: "Not your course" });

            db.query(
                "SELECT * FROM users WHERE email = ?",
                [email],
                (err, users) => {
                    if (err) return res.status(500).json(err);

                    if (!users.length) {
                        const hashed = bcrypt.hashSync("student123", 10);

                        db.query(
                            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')",
                            [name, email, hashed],
                            (err, result) => {
                                if (err) return res.status(500).json(err);

                                db.query(
                                    "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)",
                                    [result.insertId, courseId]
                                );

                                res.json({ message: "Student created and added!" });
                            }
                        );
                    } else {
                        db.query(
                            "INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)",
                            [users[0].id, courseId]
                        );
                        res.json({ message: "Existing student added!" });
                    }
                }
            );
        }
    );
});

/* =====================================================
   ASSIGNMENTS
===================================================== */
router.get("/course/:courseId/assignments", (req, res) => {
    const db = req.app.get("db");
    const { courseId } = req.params;

    db.query(
        "SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC",
        [courseId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

router.post("/course/:courseId/assignments/add", (req, res) => {
    const db = req.app.get("db");
    const { courseId } = req.params;
    const { title, description, due_date, type, starter_code, test_cases } = req.body;

    db.query(
        `INSERT INTO assignments
        (course_id, title, description, due_date, type, starter_code, test_cases)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [courseId, title, description, due_date, type, starter_code, test_cases],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Assignment created successfully!" });
        }
    );
});

/* =====================================================
   COURSES
===================================================== */
router.post("/courses/add", (req, res) => {
    const db = req.app.get("db");
    const { title, description, category, level, image } = req.body;

    db.query(
        `INSERT INTO courses
        (title, description, category, level, image, instructor_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            title,
            description,
            category || "General",
            level || "Beginner",
            image || "https://via.placeholder.com/300",
            req.user.id
        ],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Course created successfully!" });
        }
    );
});

/* =====================================================
   VIDEOS (✅ FIXED)
===================================================== */

// GET videos
router.get("/course/:courseId/videos", (req, res) => {
    const db = req.app.get("db");

    db.query(
        "SELECT * FROM course_videos WHERE course_id = ? ORDER BY created_at DESC",
        [req.params.courseId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

// ADD video
router.post("/course/:courseId/videos/add", (req, res) => {
    const db = req.app.get("db");
    const { courseId } = req.params;
    const { title, video_url, duration } = req.body;

    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            if (!rows.length)
                return res.status(403).json({ message: "Not your course" });

            db.query(
                `INSERT INTO course_videos
                (course_id, title, video_url, duration)
                VALUES (?, ?, ?, ?)`,
                [courseId, title, video_url, duration],
                (err) => {
                    if (err) return res.status(500).json(err);
                    res.json({ message: "Video added successfully!" });
                }
            );
        }
    );
});


/* =====================================================
   DELETE ASSIGNMENT ✅ (FIX)
===================================================== */
router.delete("/assignment/:assignmentId/delete", (req, res) => {
    const db = req.app.get("db");
    const { assignmentId } = req.params;
    const instructorId = req.user.id;

    // 1️⃣ Check assignment belongs to instructor
    db.query(
        `SELECT a.id
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         WHERE a.id = ? AND c.instructor_id = ?`,
        [assignmentId, instructorId],
        (err, rows) => {
            if (err) return res.status(500).json(err);

            if (!rows.length) {
                return res.status(403).json({ message: "Not authorized" });
            }

            // 2️⃣ Delete assignment
            db.query(
                "DELETE FROM assignments WHERE id = ?",
                [assignmentId],
                (err) => {
                    if (err) return res.status(500).json(err);
                    res.json({ message: "Assignment deleted successfully!" });
                }
            );
        }
    );
});


module.exports = router;
