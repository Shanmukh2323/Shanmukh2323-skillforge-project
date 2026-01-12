const token = localStorage.getItem("token");
const courseId = localStorage.getItem("selectedCourse");

// 🔐 Safety check
if (!token) {
    alert("Please login again");
    window.location.href = "login.html";
}

if (!courseId) {
    alert("No course selected");
    window.location.href = "instructor_courses.html";
}

/* =========================
   POPUP CONTROLS
========================= */
function openAddPopup() {
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

/* =========================
   LOAD ASSIGNMENTS
========================= */
async function loadAssignments() {
    const res = await fetch(
        `http://localhost:8080/instructor/course/${courseId}/assignments`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await res.json();
    const list = document.getElementById("assignmentList");
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = "<p>No assignments created yet.</p>";
        return;
    }

    data.forEach(a => {
        list.innerHTML += `
            <div class="assignment-card">
                <h3>${a.title}</h3>
                <p>${a.description}</p>

                <div class="assignment-footer">
                    <span>Due: ${a.due_date?.split("T")[0]}</span>
                    <button class="delete-btn" onclick="deleteAssignment(${a.id})">Delete</button>
                </div>
            </div>
        `;
    });
}

/* =========================
   CREATE ASSIGNMENT ✅
========================= */
async function createAssignment() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const starterCode = document.getElementById("starterCode").value;
    const testCasesRaw = document.getElementById("testCases").value;
    const dueDate = document.getElementById("dueDate").value;

    if (!title || !description || !dueDate) {
        alert("Title, description and due date are required");
        return;
    }

    let testCases = null;
    if (testCasesRaw) {
        try {
            testCases = JSON.stringify(JSON.parse(testCasesRaw)); // ✅ FIX
        } catch (err) {
            alert("Test cases must be valid JSON");
            return;
        }
    }

    const res = await fetch(
        `http://localhost:8080/instructor/course/${courseId}/assignments/add`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                due_date: dueDate,
                type: "coding",
                starter_code: starterCode,
                test_cases: testCases   // ✅ STRING
            })
        }
    );

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Failed to create assignment");
        return;
    }

    alert(data.message || "Assignment created successfully!");
    closePopup();
    loadAssignments();
}


/* =========================
   DELETE ASSIGNMENT
========================= */
async function deleteAssignment(id) {
    const confirmDelete = confirm("Are you sure you want to delete this assignment?");

    if (!confirmDelete) {
        return; // user clicked Cancel
    }

    const res = await fetch(
        `http://localhost:8080/instructor/assignment/${id}/delete`,
        {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        }
    );

    const data = await res.json();
    alert(data.message);

    // 🔥 IMPORTANT: Reload assignments
    loadAssignments();
}


/* =========================
   INIT
========================= */
loadAssignments();
