const token = localStorage.getItem("token");
const assignmentId = localStorage.getItem("selectedAssignment");

// 🔐 Safety checks
if (!token || !assignmentId) {
    alert("No assignment selected");
    window.location.href = "student_assignments.html";
}

/* ============================
   LOAD ASSIGNMENT DETAILS
============================ */
async function loadAssignment() {
    try {
        const res = await fetch(
            `http://localhost:8080/student/assignment/${assignmentId}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!res.ok) throw new Error("Failed to load assignment");

        const a = await res.json();

        document.getElementById("title").innerText = a.title;
        document.getElementById("description").innerText = a.description;
        document.getElementById("codeEditor").value = a.starter_code || "";

        if (a.test_cases) {
            document.getElementById("testCases").innerText =
                JSON.stringify(JSON.parse(a.test_cases), null, 2);
        }

    } catch (err) {
        console.error(err);
        alert("Failed to load assignment");
    }
}

/* ============================
   RUN CODE (NO SAVE)
============================ */
async function runCode() {
    const res = await fetch(
        `http://localhost:8080/student/assignment/${assignmentId}/run`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                code: codeEditor.value,
                language: language.value
            })
        }
    );

    const data = await res.json();
    renderResults(data);
}

async function submitAssignment() {
    const res = await fetch(
        `http://localhost:8080/student/assignment/${assignmentId}/submit`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                code: codeEditor.value,
                language: language.value
            })
        }
    );

    const data = await res.json();

    result.innerHTML = `
        <h4>Status: ${data.status}</h4>
        <p><b>Score:</b> ${data.score}</p>
        <p>${data.feedback}</p>
    `;
}


/* ============================
   SUBMIT ASSIGNMENT (SAVE)
============================ */
async function submitAssignment() {
    const res = await fetch(
        `http://localhost:8080/student/assignment/${assignmentId}/submit`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                code: codeEditor.value,
                language: language.value
            })
        }
    );

    const data = await res.json();

    result.innerHTML = `
        <h4>Status: ${data.status}</h4>
        <p><b>Score:</b> ${data.score}</p>
        <p>${data.feedback}</p>
    `;
}

/* ============================
   RENDER RESULTS (LeetCode-style)
============================ */
function renderResults(data) {
    const resultDiv = document.getElementById("result");

    let html = `
        <h3>📊 Result</h3>
        <p><strong>Score:</strong> ${data.score}% 
        (${data.passed}/${data.total} test cases passed)</p>

        <table border="1" cellpadding="6" width="100%">
            <tr>
                <th>Input</th>
                <th>Expected</th>
                <th>Your Output</th>
                <th>Status</th>
            </tr>
    `;

    data.results.forEach(r => {
        html += `
            <tr>
                <td>${r.input}</td>
                <td>${r.expected}</td>
                <td>${r.output}</td>
                <td style="color:${r.passed ? "green" : "red"}">
                    ${r.passed ? "PASS" : "FAIL"}
                </td>
            </tr>
        `;
    });

    html += "</table>";
    resultDiv.innerHTML = html;
}

/* ============================
   INIT
============================ */
loadAssignment();
