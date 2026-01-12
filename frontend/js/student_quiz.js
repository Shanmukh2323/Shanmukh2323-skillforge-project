const token = localStorage.getItem("token");
let quizData = [];

async function loadQuiz() {
    const res = await fetch("http://localhost:8080/ai/generate-quiz", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
        course: "Python",
        topic: "Loops",
        difficulty: "Beginner",
        seed: Date.now() // 🔥 forces new quiz
    })

    });

    const data = await res.json();
    quizData = data.quiz;

    const container = document.getElementById("quiz");
    container.innerHTML = "";

    quizData.forEach((q, i) => {
        container.innerHTML += `
            <div style="margin-bottom:20px">
                <p><b>${i + 1}. ${q.question}</b></p>
                ${q.options.map(opt => `
                    <label class="option-label">
                        <input
                            type="radio"
                            name="q${i}"
                            value="${opt}"
                            data-question-index="${i}"
                        >
                    ${opt}
                </label>
            `).join("")}

            </div>
        `;
    });
}

async function submitQuiz() {
    if (quizData.length === 0) {
        alert("Quiz not loaded yet!");
        return;
    }

    const answers = quizData.map((_, i) =>
        document.querySelector(`input[name="q${i}"]:checked`)?.value || ""
    );

    const res = await fetch("http://localhost:8080/ai/quiz-feedback", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            questions: quizData,
            studentAnswers: answers
        })
    });

    const data = await res.json();

    const percentageScore = Math.min(100, Math.max(0, data.score));

    document.getElementById("feedback").innerHTML = `
        <h3>Score: ${percentageScore}%</h3>

        <div style="width:100%; background:#e5e7eb; border-radius:10px; margin:10px 0;">
            <div style="
                width:${percentageScore}%;
                background:${percentageScore >= 70 ? "#22c55e" : "#ef4444"};
                padding:8px;
                border-radius:10px;
                color:white;
                text-align:center;
                transition: width 0.6s ease;
            ">
                ${percentageScore}%
            </div>
        </div>

        <p><b>Weak Areas:</b> ${data.weakAreas.join(", ")}</p>
        <p>${data.feedback}</p>
        <p><b>Recommendation:</b> ${data.recommendation}</p>

        <button onclick="loadQuiz()" style="margin-top:20px;">
            🔄 Take New Quiz
        </button>
    `;

    // ✅ CALL HERE (CORRECT PLACE)
    highlightAnswers(quizData, answers);
}


function highlightAnswers(questions, studentAnswers) {
    questions.forEach((q, index) => {
        const correctAnswer = (q.correctAnswer || "")
            .trim()
            .toLowerCase();

        const options = document.querySelectorAll(
            `input[name="q${index}"]`
        );

        options.forEach(input => {
            const label = input.parentElement;
            const value = (input.value || "")
                .trim()
                .toLowerCase();

            input.disabled = true;

            if (value === correctAnswer) {
                label.classList.add("correct");
            }

            if (input.checked && value !== correctAnswer) {
                label.classList.add("wrong");
            }
        });
    });
}

/* 🔥 THIS WAS MISSING */
loadQuiz();
