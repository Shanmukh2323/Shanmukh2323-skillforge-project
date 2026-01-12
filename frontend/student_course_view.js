/* ---------- TEMP COURSE DATA ---------- */
const courses = {
    1: {
        title: "Python for Beginners",
        description: "Learn Python from scratch with hands-on practice.",
        assignments: [
            { id: 101, title: "Variables & Data Types" },
            { id: 102, title: "Loops Practice" }
        ]
    },
    2: {
        title: "Java Full Stack",
        description: "Complete Java + Spring Boot learning path.",
        assignments: [
            { id: 201, title: "OOP Concepts" },
            { id: 202, title: "Spring Boot Intro" }
        ]
    }
};

/* ---------- LOAD COURSE ---------- */
const courseId = localStorage.getItem("selectedCourseId");
const course = courses[courseId];

document.getElementById("courseTitle").innerText = course.title;
document.getElementById("courseDescription").innerText = course.description;

const assignmentList = document.getElementById("assignmentList");

course.assignments.forEach(a => {
    assignmentList.innerHTML += `
        <div class="assignment-card">
            <h4>${a.title}</h4>
            <button onclick="openAssignment(${a.id})">Open Assignment</button>
        </div>
    `;
});

function openAssignment(id) {
    localStorage.setItem("selectedAssignmentId", id);
    alert("Next page: Assignment Editor (coming next)");
}

function goBack() {
    window.location.href = "MyCourses.html";
}
