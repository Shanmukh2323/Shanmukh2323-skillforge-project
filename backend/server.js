const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Import Instructor Routes
const instructorRoutes = require("./routes/instructor");

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

// ---------------- Register API ----------------
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

// ---------------- Login API ----------------
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

// ---------------- Protected Route (/me) ----------------
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
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

    db.query("SELECT id, name, email FROM users WHERE role='student'", (err, data) => {
        if (err) return res.json({ error: err });
        res.json(data);
    });
});

app.get("/admin/instructors", auth, (req, res) => {
    if (req.user.role !== "admin")
        return res.status(403).json({ message: "Access denied" });

    db.query("SELECT id, name, email FROM users WHERE role='instructor'", (err, data) => {
        if (err) return res.json({ error: err });
        res.json(data);
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

// ---------------- INSTRUCTOR ROUTES ----------------
app.use("/instructor", auth, instructorRoutes);

// ---------------- Start Server ----------------
app.listen(8080, () => {
    console.log("Server running on port 8080");
});
