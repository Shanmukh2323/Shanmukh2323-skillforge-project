const Groq = require("groq-sdk");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});




const app = express();
app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => {
    res.send("BACKEND WORKING");
});

// ---------------- MySQL Connection ----------------
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "2323",
    database: "skillforge"
});

db.connect((err) => {
    if (err) throw err;
    console.log("MySQL Connected!");
});

// Make DB accessible inside routes
app.set("db", db);

// ---------------- JWT Middleware ----------------
function auth(req, res, next) {
    const header = req.header("Authorization") || "";
    const token = header.replace(/^Bearer\s*/i, "").trim();

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, "secretKey");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// ---------------- ROUTES IMPORT ----------------
const studentRoutes = require("./routes/student");
const instructorRoutes = require("./routes/instructor");

app.use("/student", auth, studentRoutes);
app.use("/instructor", auth, instructorRoutes);

// ---------------- AUTH ROUTES ----------------
app.post("/register", (req, res) => {
    const { name, email, password, role } = req.body;
    const hashed = bcrypt.hashSync(password, 10);

    db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashed, role || "student"],
        (err) => {
            if (err) return res.json({ error: err });
            res.json({ message: "User Registered Successfully!" });
        }
    );
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, data) => {
        if (err) return res.json({ error: err });
        if (data.length === 0) return res.json({ message: "User not found" });

        const user = data[0];

        if (!bcrypt.compareSync(password, user.password))
            return res.json({ message: "Incorrect Password" });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            "secretKey"
        );

        res.json({
            message: "Login Successful",
            token,
            name: user.name,
            role: user.role
        });
    });
});

// ---------------- USER PROFILE ----------------
app.get("/me", auth, (req, res) => {
    db.query(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [req.user.id],
        (err, data) => {
            if (err) return res.json({ error: err });
            res.json(data[0]);
        }
    );
});

// ---------------- ADMIN ROUTES ----------------
app.get("/admin/users", auth, (req, res) => {
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

    db.query("SELECT id, name, email, role FROM users", (err, data) => {
        if (err) return res.json({ error: err });
        res.json(data);
    });
});

app.get("/admin/students", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }

    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.is_active,

            COUNT(DISTINCT a.id) AS assignment_submissions,
            ROUND(AVG(a.score)) AS assignment_avg_score,

            ROUND(AVG(q.score)) AS quiz_avg_score

        FROM users u

        LEFT JOIN assignment_submissions a 
            ON a.student_id = u.id AND a.status = 'evaluated'

        LEFT JOIN quiz_attempts q 
            ON q.student_id = u.id

        WHERE u.role = 'student'

        GROUP BY u.id, u.name, u.email, u.is_active
        ORDER BY u.id DESC
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("❌ Admin students error:", err);
            return res.status(500).json(err);
        }
        res.json(rows);
    });
});





app.get("/admin/instructors", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }

    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(c.id) AS course_count
        FROM users u
        LEFT JOIN courses c ON c.instructor_id = u.id
        WHERE u.role = 'instructor'
        GROUP BY u.id, u.name, u.email
        ORDER BY u.id;
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("Instructor fetch error:", err);
            return res.status(500).json(err);
        }
        res.json(rows);
    });
});





app.get("/admin/courses", auth, (req, res) => {
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

    db.query("SELECT * FROM courses", (err, data) => {
        if (err) return res.json({ error: err });
        res.json(data);
    });
});

app.post("/admin/add-course", auth, (req, res) => {
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

    const { title, description, instructor_id, category, level, image } = req.body;

    db.query(
        "INSERT INTO courses (title, description, instructor_id, category, level, image) VALUES (?, ?, ?, ?, ?, ?)",
        [title, description, instructor_id, category, level, image],
        (err) => {
            if (err) return res.json({ error: err });
            res.json({ message: "Course Added Successfully!" });
        }
    );
});

app.delete("/admin/delete-course/:id", auth, (req, res) => {
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

    db.query("DELETE FROM courses WHERE id=?", [req.params.id], (err) => {
        if (err) return res.json({ error: err });
        res.json({ message: "Course Deleted Successfully" });
    });
});

// ===============================
// 🤖 AI CHATBOT (LANDING PAGE)
// ===============================
app.post("/ai/landing-chat", async (req, res) => {
    try {
        const { message } = req.body;

        const chat = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `
You are SkillForge AI Assistant.

You can answer ONLY about:
- SkillForge platform
- Courses
- Learning paths
- Assignments
- Quizzes
- AI features of SkillForge

If the question is unrelated, reply:
"I can help only with SkillForge learning."
                    `
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.3
        });

        res.json({
            reply: chat.choices[0].message.content
        });

    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({
            reply: "AI is currently unavailable. Please try again later."
        });
    }
});


// ===============================
// 🧠 AI QUIZ GENERATION (FIXED)
// ===============================
app.post("/ai/generate-quiz", auth, async (req, res) => {
    try {
        const { course, topic, difficulty, seed } = req.body;

        const prompt = `
Generate ONLY valid JSON.
DO NOT add explanations.
DO NOT add markdown.
DO NOT add text outside JSON.

You are an AI quiz generator for SkillForge.

Course: ${course}
Topic: ${topic}
Difficulty: ${difficulty}

Random Seed: ${seed}
Generate DIFFERENT questions every time. Do NOT repeat previous questions.

Return EXACT JSON in this format:

[
  {
  question: "What is the purpose of the 'for' loop in Python?",
  options: [
    "To create a list of numbers",
    "To repeat a block of code",
    "To sort a list of items",
    "To calculate the sum of a list"
  ],
  correctAnswer: "To repeat a block of code",
  concept: "Loops"
}

]
        `;


        const chat = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You ONLY return JSON. No text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7

        });

        const raw = chat.choices[0].message.content.trim();

        // 🛡️ EXTRA SAFETY: Extract JSON only
        const jsonStart = raw.indexOf("[");
        const jsonEnd = raw.lastIndexOf("]") + 1;
        const jsonString = raw.slice(jsonStart, jsonEnd);

        const quiz = JSON.parse(jsonString);

        res.json({ quiz });

    } catch (err) {
        console.error("Quiz AI Error:", err);
        res.status(500).json({
            message: "Quiz generation failed"
        });
    }
});



// ===============================
// 📊 AI QUIZ FEEDBACK (CORRECT FINAL VERSION)
// ===============================
app.post("/ai/quiz-feedback", auth, async (req, res) => {
    try {
        const db = req.app.get("db");
        const { questions, studentAnswers } = req.body;

        // ===============================
        // ✅ QUIZ GRADING (DETERMINISTIC)
        // ===============================
        let correct = 0;
let weakAreas = new Set();

questions.forEach((q, index) => {
    const studentAnswer = (studentAnswers[index] || "")
        .trim()
        .toLowerCase();

    const correctAnswer = (q.correctAnswer || "")
        .trim()
        .toLowerCase();

    if (studentAnswer === correctAnswer) {
        correct++;
    } else {
        weakAreas.add(q.concept || "General");
    }
});

const percentageScore = Math.round(
    (correct / questions.length) * 100
);


        // ===============================
        // 🤖 AI FEEDBACK (TEXT ONLY)
        // ===============================
        const prompt = `
You are an AI tutor for SkillForge.

Student score: ${percentageScore}%
Weak areas: ${[...weakAreas].join(", ") || "None"}

Give:
1. Short feedback (2 lines)
2. Clear study recommendation
`;

        const chat = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You give helpful feedback only." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3
        });

        const aiText = chat.choices[0].message.content.trim();

        // Split feedback and recommendation safely
        const [feedbackText, recommendationText] =
            aiText.split("\n").filter(Boolean);

        // ===============================
        // 💾 SAVE RESULT TO DB
        // ===============================
        db.query(
            "INSERT INTO quiz_attempts (student_id, score, weak_areas) VALUES (?, ?, ?)",
            [
                req.user.id,
                percentageScore,
                [...weakAreas].join(", ")
            ],
            (err) => {
                if (err) console.error("❌ DB INSERT ERROR:", err);
            }
        );

        // ===============================
        // ✅ SEND RESPONSE
        // ===============================
        res.json({
            score: percentageScore,
            weakAreas: [...weakAreas],
            feedback: feedbackText || "Good effort.",
            recommendation: recommendationText || "Keep practicing."
        });

    } catch (err) {
        console.error("❌ Quiz Feedback Error:", err);
        res.status(500).json({ message: "Feedback generation failed" });
    }
});



// ===============================
// 📜 QUIZ HISTORY
// ===============================
app.get("/student/quiz-history", auth, (req, res) => {
    const db = req.app.get("db");

    db.query(
        `SELECT score, weak_areas, created_at
         FROM quiz_attempts
         WHERE student_id = ?
         ORDER BY created_at DESC`,
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});


// ===============================
// 📊 INSTRUCTOR QUIZ ANALYTICS
// ===============================
app.get("/instructor/quiz-analytics", auth, (req, res) => {
    const db = req.app.get("db");

    // Only instructors allowed
    if (req.user.role !== "instructor") {
        return res.status(403).json({ message: "Access denied" });
    }

    const query = `
        SELECT 
            u.id AS student_id,
            u.name AS student_name,
            COUNT(q.id) AS attempts,
            ROUND(AVG(q.score)) AS avg_score,
            MAX(q.score) AS best_score,
            GROUP_CONCAT(DISTINCT q.weak_areas) AS weak_areas
        FROM quiz_attempts q
        JOIN users u ON q.student_id = u.id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name
        ORDER BY avg_score DESC
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("❌ Analytics Error:", err);
            return res.status(500).json({ message: "Analytics failed" });
        }
        res.json(rows);
    });
});


// ===============================
// 📘 INSTRUCTOR ASSIGNMENT ANALYTICS (FIXED)
// ===============================
app.get("/instructor/assignment-analytics", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "instructor") {
        return res.status(403).json({ message: "Access denied" });
    }

    const query = `
    SELECT
        u.id AS student_id,
        u.name AS student_name,
        COUNT(s.id) AS submissions,
        ROUND(AVG(s.score), 1) AS avg_score,
        MAX(s.score) AS best_score
    FROM assignment_submissions s
    JOIN users u ON u.id = s.student_id
    WHERE s.status = 'evaluated'
    GROUP BY u.id, u.name
    ORDER BY avg_score DESC
`;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("❌ Assignment analytics error:", err);
            return res.status(500).json(err);
        }
        res.json(rows);
    });
});


// ===============================
// 📘 STUDENT QUIZ ATTEMPTS (INSTRUCTOR)
// ===============================
app.get("/instructor/student/:id/quiz-attempts", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "instructor") {
        return res.status(403).json({ message: "Access denied" });
    }

    db.query(
        `SELECT score, weak_areas, created_at
         FROM quiz_attempts
         WHERE student_id = ?
         ORDER BY created_at DESC`,
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});


// ===============================
// 📘 STUDENT ASSIGNMENT ATTEMPTS (INSTRUCTOR)
// ===============================
app.get("/instructor/student/:id/assignment-attempts", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "instructor") {
        return res.status(403).json({ message: "Access denied" });
    }

    db.query(
        `SELECT score, status, created_at
         FROM assignment_submissions
         WHERE student_id = ?
         ORDER BY created_at DESC`,
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});


// ===============================
// 👑 ADMIN DASHBOARD STATS
// ===============================
app.get("/admin/dashboard-stats", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }

    const query = `
        SELECT
            (SELECT COUNT(*) FROM users WHERE role='student') AS students,
            (SELECT COUNT(*) FROM users WHERE role='instructor') AS instructors,
            (SELECT COUNT(*) FROM courses) AS courses
    `;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows[0]);
    });
});


// ===============================
// 👨‍🏫 ADD INSTRUCTOR (ADMIN)
// ===============================
app.post("/admin/add-instructor", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }

    const { name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
        "SELECT id FROM users WHERE email = ?",
        [email],
        (err, rows) => {
            if (rows.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }

            db.query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'instructor')",
                [name, email, hashedPassword],
                () => res.json({ message: "Instructor added successfully" })
            );
        }
    );
});


// ===============================
// 🎓 ADMIN STUDENT LIST + STATS
// ===============================
app.get("/admin/students-detailed", auth, (req, res) => {
    const db = req.app.get("db");

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }

    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(DISTINCT q.id) AS quizzes_taken,
            COUNT(DISTINCT a.id) AS assignments_submitted
        FROM users u
        LEFT JOIN quiz_attempts q ON q.student_id = u.id
        LEFT JOIN assignment_submissions a ON a.student_id = u.id
        WHERE u.role = 'student'
        GROUP BY u.id, u.name, u.email
        ORDER BY u.id DESC
    `;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});



// ---------------- STUDENT & INSTRUCTOR ROUTES ----------------
// ---------------- START SERVER ----------------
app.listen(8080, () => {
    console.log("Server running on port 8080");
});
