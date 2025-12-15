//------------------------------------------------------
// INITIALIZATION
//------------------------------------------------------
console.log("Assignments JS Loaded");

const token = localStorage.getItem("token");
const courseId = localStorage.getItem("selectedCourse");

// Ensure course is selected
if (!courseId) {
    alert("No course selected!");
    window.location.href = "instructor_courses.html";
}


//------------------------------------------------------
// FETCH & DISPLAY ASSIGNMENTS
//------------------------------------------------------

async function loadAssignments() {
    try {
        const res = await fetch(`http://localhost:8080/instructor/course/${courseId}/assignments`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const assignments = await res.json();
        console.log("Loaded Assignments:", assignments);

        const container = document.getElementById("assignmentList");
        container.innerHTML = "";

        if (assignments.length === 0) {
            container.innerHTML = "<p>No assignments created yet.</p>";
            return;
        }

        assignments.forEach(a => {
            container.innerHTML += `
                <div class="assignment-card">
                    <h3>${a.title}</h3>
                    <p>${a.description}</p>
                    <p><strong>Due:</strong> ${a.due_date}</p>

                    <div class="assignment-footer">
                        <button class="view-btn">View</button>
                        <button class="delete-btn" onclick="deleteAssignment(${a.id})">Delete</button>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.log("Error loading assignments", err);
    }
}

loadAssignments();


//------------------------------------------------------
// POPUP CONTROL
//------------------------------------------------------

function openAddPopup() {
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}


//------------------------------------------------------
// CREATE NEW ASSIGNMENT
//------------------------------------------------------

async function createAssignment() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const starterCode = document.getElementById("starterCode").value.trim();
    const testCasesRaw = document.getElementById("testCases").value.trim();
    const dueDate = document.getElementById("dueDate").value;

    if (!title || !description || !dueDate) {
        alert("Title, description and due date are required.");
        return;
    }

    // Test cases MUST be valid JSON
    let testCases = null;
    try {
        testCases = JSON.parse(testCasesRaw);
        if (!Array.isArray(testCases)) {
            alert("Test cases must be an array!");
            return;
        }
    } catch (err) {
        alert("Invalid test case JSON format!");
        return;
    }

    try {
        const res = await fetch(`http://localhost:8080/instructor/course/${courseId}/assignments/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                due_date: dueDate,
                type: "coding",
                starter_code: starterCode || "",
                test_cases: JSON.stringify(testCases)
            })
        });

        const data = await res.json();
        alert(data.message || "Assignment created successfully!");

        closePopup();
        loadAssignments();

    } catch (err) {
        console.log("Error creating assignment:", err);
        alert("Server error while creating assignment.");
    }
}


//------------------------------------------------------
// DELETE ASSIGNMENT
//------------------------------------------------------

async function deleteAssignment(id) {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
        const res = await fetch(`http://localhost:8080/instructor/assignment/${id}/delete`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();
        alert(data.message || "Assignment deleted");

        loadAssignments();

    } catch (err) {
        console.log("Error deleting assignment", err);
    }
}


//------------------------------------------------------
// DARK MODE TOGGLE
//------------------------------------------------------

document.getElementById("themeToggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");

    if (current === "dark") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
    }
});


//------------------------------------------------------
// LOGOUT
//------------------------------------------------------

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
