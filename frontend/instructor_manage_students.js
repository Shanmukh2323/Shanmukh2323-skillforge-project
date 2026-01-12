console.log("Manage Students JS Loaded");

const token = localStorage.getItem("token");
const courseId = localStorage.getItem("selectedCourse");

// ---------------- LOAD STUDENTS ----------------
async function loadStudents() {
    try {
        const res = await fetch(
            `http://localhost:8080/instructor/course/${courseId}/students`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const students = await res.json();
        const container = document.getElementById("studentList");
        container.innerHTML = "";

        if (!students.length) {
            container.innerHTML = "<p>No students enrolled yet.</p>";
            return;
        }

        students.forEach(s => {
            container.innerHTML += `
                <div class="student-card">
                    <h3>${s.name}</h3>
                    <p>${s.email}</p>
                    <p><strong>Progress:</strong> ${s.progress || 0}%</p>

                    <div class="student-actions">
                        <button class="remove-btn" onclick="removeStudent(${s.id})">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Error loading students:", err);
    }
}

loadStudents();

// ---------------- ADD STUDENT ----------------
async function addStudent() {
    const name = document.getElementById("studentName").value.trim();
    const email = document.getElementById("studentEmail").value.trim();

    if (!name || !email) {
        alert("Please fill all fields");
        return;
    }

    try {
        const res = await fetch(
            `http://localhost:8080/instructor/course/${courseId}/add-student`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email })
            }
        );

        const data = await res.json();
        alert(data.message);

        closePopup();
        loadStudents();

    } catch (err) {
        console.error("Enroll error:", err);
        alert("Enrollment failed");
    }
}

// ---------------- REMOVE STUDENT ----------------
async function removeStudent(studentId) {
    if (!confirm("Remove student from course?")) return;

    try {
        const res = await fetch(
            `http://localhost:8080/instructor/course/${courseId}/remove-student/${studentId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();
        alert(data.message);
        loadStudents();

    } catch (err) {
        console.error("Remove error:", err);
    }
}

// ---------------- POPUP ----------------
function openAddPopup() {
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// ---------------- LOGOUT ----------------
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
