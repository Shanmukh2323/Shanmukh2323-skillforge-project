const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
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

// ---------------- JWT Middleware ----------------
function auth(req, res, next) {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), "secretKey");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(400).json({ message: "Invalid token" });
    }
}

// ---------------- Register API ----------------
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    const hashed = bcrypt.hashSync(password, 10);

    db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashed],
        (err, result) => {
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

        const token = jwt.sign({ id: user.id }, "secretKey");

        res.json({
            message: "Login Successful",
            token,
            name: user.name
        });
    });
});

// ---------------- Protected Route ----------------
app.get("/me", auth, (req, res) => {
    db.query(
        "SELECT id, name, email FROM users WHERE id = ?", 
        [req.user.id], 
        (err, data) => {
            if (err) return res.json({ error: err });

            res.json(data[0]);
        }
    );
});

// ---------------- Start Server ----------------
app.listen(8080, () => {
    console.log("Server running on port 8080");
});
