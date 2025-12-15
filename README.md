📚 SkillForge – Full Stack Learning Platform (Milestone 1)

SkillForge is a full-stack learning platform developed as part of Milestone 1 of the SkillForge Internship Program.
This repository includes the frontend (HTML/CSS/JS), backend (Node.js + Express + MySQL), API implementation, project documentation, diagrams, testing results, and deployment instructions.

🚀 Project Overview

SkillForge is an e-learning platform inspired by Udemy, Coursera, and Simplilearn.
Milestone 1 focuses on completing the User Authentication Module, including:

User Registration

User Login

JWT Authentication

Protected User Profile

Frontend UI Pages

Backend API Integration

Postman Testing

Database Setup (MySQL)

Documentation & GitHub Submission

🗂️ Project Folder Structure
skillforge-project/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── node_modules/ (ignored via .gitignore)
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── styles.css
│   ├── auth.js
│   └── images/
│
├── documents/
│   ├── product_backlog.pdf
│   ├── sprint_backlog.pdf
│   ├── requirements_document.pdf
│   ├── use_case_diagram.png
│   ├── architecture_diagram.png
│   └── testing_report.pdf
│
├── screenshots/
│   ├── postman_register.png
│   ├── postman_login.png
│   ├── mysql_users_table.png
│   ├── ui_login.png
│   └── ui_register.png
│
└── README.md

🧰 Tech Stack
Frontend

HTML5

CSS3

JavaScript (Vanilla JS)

Backend

Node.js

Express.js

JWT Authentication

Bcrypt.js (password hashing)

Database

MySQL

Tools & Platforms

VS Code

Postman

Git & GitHub

phpMyAdmin / MySQL Workbench

🔐 API Endpoints (Milestone 1)
➤ Register User

POST /register
Body:
{
  "name": "John",
  "email": "john@example.com",
  "password": "123456"
}

➤ Login User

POST /login
Body:
{
  "email": "john@example.com",
  "password": "123456"
}

Returns:

JWT token

Username

➤ Get Logged-In User

GET /me
Headers:
Authorization: Bearer <token>

🧪 Testing (Postman)

The following tests were performed and included in /screenshots:

✔ Register API Test
✔ Login API Test
✔ Protected Route Test
✔ MySQL Insert Verification
✔ UI Login/Register Test

🛠️ How to Run the Project
1️⃣ Backend Setup
cd backend
npm install
node server.js

Expected output:
MySQL Connected!
Server running on port 8080

2️⃣ Frontend Setup
Open:
frontend/index.html
Right-click → Open With Live Server

3️⃣ Database Setup (MySQL)
CREATE DATABASE skillforge;
USE skillforge;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255)
);

📌 Milestone 1 Deliverables Included:

 Product Backlog

 Sprint Backlog

 Requirements & Analysis

 Architecture Diagram

 Use Case Diagrams

 Folder Structure

 User Authentication Module

 API Implementation (Register, Login, Protected Route)

 Testing (Postman + MySQL)

 GitHub Commit History

 Deployment Instructions

 README.md

 🧑‍💻 Developer

Shanmukh Sahukari
SkillForge Internship Project
Milestone 1 – Authentication Module
