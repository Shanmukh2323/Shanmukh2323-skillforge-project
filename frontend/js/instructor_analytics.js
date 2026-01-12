const token = localStorage.getItem("token");

function viewStudent(studentId) {
    window.location.href = `student_detail.html?student_id=${studentId}`;
}

/* ===============================
   📊 QUIZ ANALYTICS
=============================== */
fetch("http://localhost:8080/instructor/quiz-analytics", {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => {
    if (!res.ok) throw new Error("Failed to load quiz analytics");
    return res.json();
})
.then(data => {
    const tbody = document.getElementById("analyticsBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No quiz data available
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(s => {
        tbody.innerHTML += `
            <tr onclick="viewStudent(${s.student_id})"
                style="cursor:pointer;">
                <td>${s.student_id}</td>
                <td>${s.student_name}</td>
                <td>${s.attempts}</td>
                <td>
                    <span class="score-badge ${s.avg_score >= 70 ? "good" : "bad"}">
                        ${s.avg_score}%
                    </span>
                </td>
                <td>${s.best_score}%</td>
                <td>${s.weak_areas || "None"}</td>
            </tr>
        `;
    });
})
.catch(err => {
    console.error("❌ Quiz analytics error:", err);
    document.getElementById("analyticsBody").innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;color:red;">
                Failed to load quiz analytics
            </td>
        </tr>
    `;
});


/* ===============================
   📘 ASSIGNMENT ANALYTICS
=============================== */
fetch("http://localhost:8080/instructor/assignment-analytics", {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => {
    if (!res.ok) throw new Error("Failed to load assignment analytics");
    return res.json();
})
.then(data => {
    const tbody = document.getElementById("assignmentAnalyticsBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No assignment data available
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(s => {
        tbody.innerHTML += `
            <tr onclick="viewStudent(${s.student_id})"
                style="cursor:pointer;">
                <td>${s.student_id}</td>
                <td>${s.student_name}</td>
                <td>${s.submissions}</td>
                <td>
                    <span class="score-badge ${s.avg_score >= 70 ? "good" : "bad"}">
                        ${s.avg_score}%
                    </span>
                </td>
                <td>${s.best_score}%</td>
            </tr>
        `;
    });
})
.catch(err => {
    console.error("❌ Assignment analytics error:", err);
    document.getElementById("assignmentAnalyticsBody").innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;color:red;">
                Failed to load assignment analytics
            </td>
        </tr>
    `;
});
