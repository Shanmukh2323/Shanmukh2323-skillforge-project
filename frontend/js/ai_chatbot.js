// ===============================
// 🤖 SkillForge AI Chatbot Logic
// ===============================

function toggleAIChat() {
    const box = document.getElementById("ai-chat-box");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}

async function sendAIMessage() {
    const input = document.getElementById("aiInput");
    const msg = input.value.trim();
    if (!msg) return;

    const messages = document.getElementById("ai-chat-messages");

    // User message
    messages.innerHTML += `
        <div class="ai-user"><b>You:</b> ${escapeHTML(msg)}</div>
    `;

    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    try {
        const res = await fetch("http://localhost:8080/ai/landing-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: msg })
        });

        const data = await res.json();

        // AI reply
        messages.innerHTML += `
            <div class="ai-bot"><b>AI:</b> ${escapeHTML(data.reply)}</div>
        `;
        messages.scrollTop = messages.scrollHeight;

    } catch (err) {
        messages.innerHTML += `
            <div class="ai-bot">AI is unavailable. Please try again later.</div>
        `;
    }
}
