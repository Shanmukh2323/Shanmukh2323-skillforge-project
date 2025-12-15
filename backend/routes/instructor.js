const express = require("express");
const router = express.Router();

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
            if (err) return res.status(500).json({ error: err });

            db.query(
                `SELECT COUNT(*) AS total
                 FROM enrollments
                 WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = ?)`,
                [instructorId],
                (err, studentData) => {
                    if (err) return res.status(500).json({ error: err });

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
    const instructorId = req.user.id;

    db.query(
        "SELECT * FROM courses WHERE instructor_id = ?",
        [instructorId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            res.json(rows);
        }
    );
});

/* =====================================================
   GET STUDENTS OF A COURSE
===================================================== */
router.get("/course/:courseId/students", (req, res) => {
    const db = req.app.get("db");
    const courseId = req.params.courseId;
    const instructorId = req.user.id;

    // ensure instructor owns the course
    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, instructorId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            if (rows.length === 0)
                return res.status(403).json({ message: "Not your course" });

            db.query(
                `SELECT users.id, users.name, users.email, enrollments.progress
                 FROM enrollments
                 JOIN users ON users.id = enrollments.user_id
                 WHERE enrollments.course_id = ?`,
                [courseId],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err });
                    res.json(result);
                }
            );
        }
    );
});

/* =====================================================
   ADD STUDENT TO COURSE
===================================================== */
router.post("/course/:courseId/add-student", (req, res) => {
    const db = req.app.get("db");
    const courseId = req.params.courseId;
    const { name, email } = req.body;
    const instructorId = req.user.id;

    // verify ownership
    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, instructorId],
        (err, courseRows) => {
            if (err) return res.status(500).json({ error: err });
            if (courseRows.length === 0)
                return res.status(403).json({ message: "Not your course" });

            db.query("SELECT * FROM users WHERE email = ?", [email], (err, users) => {
                if (err) return res.status(500).json({ error: err });

                let studentId;

                if (users.length === 0) {
                    const defaultPass = "student123";

                    db.query(
                        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'student')",
                        [name, email, defaultPass],
                        (err, result) => {
                            if (err) return res.status(500).json({ error: err });

                            studentId = result.insertId;

                            db.query(
                                "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)",
                                [studentId, courseId]
                            );

                            res.json({ message: "Student created and added!" });
                        }
                    );
                } else {
                    studentId = users[0].id;

                    db.query(
                        "INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)",
                        [studentId, courseId]
                    );

                    res.json({ message: "Existing student added to course!" });
                }
            });
        }
    );
});

/* =====================================================
   REMOVE STUDENT FROM COURSE
===================================================== */
router.delete("/course/:courseId/remove-student/:studentId", (req, res) => {
    const db = req.app.get("db");
    const { courseId, studentId } = req.params;
    const instructorId = req.user.id;

    // verify instructor owns course
    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, instructorId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            if (rows.length === 0)
                return res.status(403).json({ message: "Not your course" });

            db.query(
                "DELETE FROM enrollments WHERE user_id = ? AND course_id = ?",
                [studentId, courseId],
                (err) => {
                    if (err) return res.status(500).json({ error: err });
                    res.json({ message: "Student removed successfully" });
                }
            );
        }
    );
});

/* =====================================================
   ASSIGNMENTS (TEXT + CODING)
===================================================== */

/* --- GET Assignments for Course --- */
router.get("/course/:courseId/assignments", (req, res) => {
    const db = req.app.get("db");
    const { courseId } = req.params;
    const instructorId = req.user.id;

    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, instructorId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            if (rows.length === 0)
                return res.status(403).json({ message: "Not your course" });

            db.query(
                "SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC",
                [courseId],
                (err, assignments) => {
                    if (err) return res.status(500).json({ error: err });
                    res.json(assignments);
                }
            );
        }
    );
});

/* --- CREATE Assignment (supports coding fields) --- */
router.post("/course/:courseId/assignments/add", (req, res) => {
    const db = req.app.get("db");
    const instructorId = req.user.id;
    const { courseId } = req.params;

    const {
        title,
        description,
        due_date,
        type = "text",
        starter_code = null,
        test_cases = null
    } = req.body;

    if (!title || !description || !due_date)
        return res.status(400).json({ message: "Missing required fields" });

    db.query(
        "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
        [courseId, instructorId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            if (rows.length === 0)
                return res.status(403).json({ message: "Not your course" });

            db.query(
                `INSERT INTO assignments 
                (course_id, title, description, due_date, type, starter_code, test_cases)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    courseId,
                    title,
                    description,
                    due_date,
                    type,
                    starter_code,
                    test_cases
                ],
                (err) => {
                    if (err) return res.status(500).json({ error: err });
                    res.json({ message: "Assignment created successfully!" });
                }
            );
        }
    );
});

/* --- DELETE Assignment --- */
router.delete("/assignment/:assignmentId/delete", (req, res) => {
    const db = req.app.get("db");
    const { assignmentId } = req.params;
    const instructorId = req.user.id;

    db.query(
        `SELECT assignments.id
         FROM assignments
         JOIN courses ON assignments.course_id = courses.id
         WHERE assignments.id = ? AND courses.instructor_id = ?`,
        [assignmentId, instructorId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            if (rows.length === 0)
                return res.status(403).json({ message: "Not authorized" });

            db.query(
                "DELETE FROM assignments WHERE id = ?",
                [assignmentId],
                (err) => {
                    if (err) return res.status(500).json({ error: err });
                    res.json({ message: "Assignment deleted successfully!" });
                }
            );
        }
    );
});

module.exports = router;
