const token = localStorage.getItem("token");

/* ===============================
   📥 LOAD STUDENTS
=============================== */
fetch("http://localhost:8080/admin/students", {
    headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
    }
})
.then(res => {
    if (!res.ok) throw new Error("Failed API");
    return res.json();
})
.then(data => {
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(data)) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">Invalid response</td>
            </tr>
        `;
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">No students found</td>
            </tr>
        `;
        return;
    }

    data.forEach(s => {
    tbody.innerHTML += `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.email}</td>

            <td>
                <span class="badge ${s.is_active ? 'active' : 'inactive'}">
                    ${s.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>

            <td>${s.assignment_submissions}</td>

            <td>
                ${s.assignment_avg_score !== null 
                    ? s.assignment_avg_score + "%" 
                    : "-"}
            </td>

            <td>
                ${s.quiz_avg_score !== null 
                    ? s.quiz_avg_score + "%" 
                    : "-"}
            </td>
        </tr>
    `;
});



})
.catch(err => {
    console.error(err);
    document.getElementById("studentsTableBody").innerHTML = `
        <tr>
            <td colspan="4">Failed to load students</td>
        </tr>
    `;
});



/* ===============================
   🪟 MODAL CONTROL
=============================== */
function openStudentModal() {
    document.getElementById("studentModal").style.display = "flex";
}

function closeStudentModal() {
    document.getElementById("studentModal").style.display = "none";
}

/* ===============================
   ➕ ADD STUDENT
=============================== */
function addStudent() {
    fetch("http://localhost:8080/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: sname.value,
            email: semail.value,
            password: spassword.value,
            role: "student"
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Student added successfully");
        location.reload();
    });
}
