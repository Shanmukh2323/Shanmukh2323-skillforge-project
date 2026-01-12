const token = localStorage.getItem("token");

let barChart = null;
let lineChart = null;
let pieChart = null;

/* ===============================
   LOAD PROGRESS DATA
================================ */
fetch("http://localhost:8080/student/progress", {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    console.log("📊 Progress data:", data);

    /* ---------- STATS ---------- */
    total.innerText = data.stats.submittedAssignments;
    submitted.innerText = data.stats.submittedAssignments;
    average.innerText = data.stats.averageScore;
    best.innerText = data.stats.bestScore;

    /* =================================================
       1️⃣ ASSIGNMENT SCORES (BAR CHART)
    ================================================= */
    const assignmentLabels = data.chartData.map(d => d.title);
    const assignmentScores = data.chartData.map(d => Number(d.score));

    if (barChart) barChart.destroy();

    barChart = new Chart(document.getElementById("scoreChart"), {
        type: "bar",
        data: {
            labels: assignmentLabels,
            datasets: [{
                label: "Assignment Scores",
                data: assignmentScores,
                backgroundColor: "#3b82f6"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    /* =================================================
       2️⃣ PROGRESS OVER TIME (LINE CHART)
    ================================================= */
    const attempts = data.chartData.map((_, i) => `Attempt ${i + 1}`);
    const progressScores = data.chartData.map(d => Number(d.score));

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(document.getElementById("lineChart"), {
        type: "line",
        data: {
            labels: attempts,
            datasets: [{
                label: "Progress Over Time",
                data: progressScores,
                borderColor: "#22c55e",
                backgroundColor: "rgba(34,197,94,0.2)",
                fill: true,
                tension: 0.4,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    /* =================================================
       3️⃣ PASS vs FAIL (PIE CHART)
    ================================================= */
    const passed = Number(data.passFail.passed);
    const failed = Number(data.passFail.failed);

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(document.getElementById("passFailChart"), {
        type: "pie",
        data: {
            labels: ["Passed", "Failed"],
            datasets: [{
                data: [passed, failed],
                backgroundColor: ["#22c55e", "#ef4444"]
            }]
        },
        options: {
            responsive: false
        }
    });
})
.catch(err => console.error("❌ Progress load error:", err));

/* ===============================
   LOAD STUDENT RANK
================================ */
fetch("http://localhost:8080/student/rank", {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
    rank.innerText = data.rank || "N/A";
});
