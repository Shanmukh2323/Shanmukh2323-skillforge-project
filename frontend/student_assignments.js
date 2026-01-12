const token = localStorage.getItem("token");

fetch("http://localhost:8080/student/assignments", {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    const list = document.getElementById("assignmentList");
    list.innerHTML = "";

    data.forEach(a => {
        list.innerHTML += `
            <div class="assignment-card">
                <h3>${a.title}</h3>
                <p>Course: ${a.course_title}</p>
                <p>Due: ${a.due_date}</p>
                <button onclick="openAssignment(${a.id})">Open</button>
            </div>
        `;
    });
});

function openAssignment(id) {
    localStorage.setItem("selectedAssignment", id);
    window.location.href = "student_assignment_view.html";
}
