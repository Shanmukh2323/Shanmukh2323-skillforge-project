const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const studentId = params.get("student_id");

/* ===============================
   🧠 QUIZ ATTEMPTS
=============================== */
fetch(`http://localhost:8080/instructor/student/${studentId}/quiz-attempts`, {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    const tbody = document.getElementById("quizAttemptsBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center;">
                    No quiz attempts found
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(q => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(q.created_at).toLocaleString()}</td>
                <td>${q.score}%</td>
                <td>${q.weak_areas || "None"}</td>
            </tr>
        `;
    });

    renderQuizScoreChart(data);
    renderWeakAreasChart(data);
});


/* ===============================
   📘 ASSIGNMENT ATTEMPTS
=============================== */
fetch(`http://localhost:8080/instructor/student/${studentId}/assignment-attempts`, {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    const tbody = document.getElementById("assignmentAttemptsBody");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center;">
                    No assignment attempts found
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(a => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(a.created_at).toLocaleString()}</td>
                <td>${a.score}%</td>
                <td>${a.status}</td>
            </tr>
        `;
    });
});


/* ===============================
   📈 QUIZ SCORE TREND CHART
=============================== */
function renderQuizScoreChart(data) {
    const ctx = document.getElementById("quizScoreChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: data
                .map(d => new Date(d.created_at).toLocaleDateString())
                .reverse(),
            datasets: [{
                label: "Quiz Score (%)",
                data: data.map(d => d.score).reverse(),
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.2)",
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 100
                }
            }
        }
    });
}


/* ===============================
   📊 WEAK AREAS BAR CHART
=============================== */
function renderWeakAreasChart(data) {
    const counts = {};

    data.forEach(d => {
        if (!d.weak_areas) return;

        d.weak_areas.split(",").forEach(area => {
            const key = area.trim();
            if (key) counts[key] = (counts[key] || 0) + 1;
        });
    });

    const ctx = document.getElementById("weakAreasChart").getContext("2d");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Weak Area Frequency",
                data: Object.values(counts),
                backgroundColor: "#ef4444"
            }]
        },
        options: {
            responsive: true
        }
    });
}
