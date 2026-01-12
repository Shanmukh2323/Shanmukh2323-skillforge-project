const token = localStorage.getItem("token");

fetch("http://localhost:8080/admin/instructors", {
    headers: { Authorization: "Bearer " + token }
})
.then(res => res.json())
.then(data => {
    const tbody = document.getElementById("instructorTable");
    tbody.innerHTML = "";

    data.forEach(i => {
        tbody.innerHTML += `
            <tr>
                <td>${i.id}</td>
                <td>${i.name}</td>
                <td>${i.email}</td>
                <td>${i.course_count || 0}</td>
            </tr>
        `;
    });
});

function openInstructorModal() {
    instructorModal.style.display = "flex";
}

function closeInstructorModal() {
    instructorModal.style.display = "none";
}

function addInstructor() {
    fetch("http://localhost:8080/admin/add-instructor", {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: iname.value,
            email: iemail.value,
            password: ipassword.value
        })
    })
    .then(res => res.json())
    .then(() => location.reload());
}
