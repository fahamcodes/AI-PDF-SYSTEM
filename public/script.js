
const chatBox = document.getElementById("chatBox");

// THEME TOGGLE
const toggleBtn = document.getElementById("themeToggle");

if(toggleBtn){
    toggleBtn.onclick = () => {
        document.body.classList.toggle("light");

        const mode = document.body.classList.contains("light") ? "light" : "dark";
        localStorage.setItem("theme", mode);
    };
}

// LOAD SAVED THEME
window.onload = () => {
    const saved = localStorage.getItem("theme");
    if(saved === "light"){
        document.body.classList.add("light");
    }
};

// ================= ENTER SEND
document.getElementById("msg").addEventListener("keypress", function(e){
    if(e.key === "Enter"){
        send();
    }
});

// ================= ADD MESSAGE =================
function addMessage(text, type, clickable=false){
    const div = document.createElement("div");
    div.classList.add("message", type);

    div.innerHTML = text.replace(/\n/g,"<br>");

    if(clickable){
        div.classList.add("clickable");
        div.onclick = () => sendQuestion(text);
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    return div; // 🔥 IMPORTANT for typing effect
}

// ================= TYPING EFFECT =================
async function typeText(element, text){
    element.innerHTML = "";

    for(let i=0; i<text.length; i++){
        element.innerHTML += text[i];
        await new Promise(res => setTimeout(res, 8));
    }
}

// ================= UPLOAD =================
async function uploadPDF(){
    const file = document.getElementById("file").files[0];

    const formData = new FormData();
    formData.append("pdf", file);

    document.getElementById("uploadStatus").innerText = "Uploading...";

    const res = await fetch("/upload", {
        method:"POST",
        body:formData
    });

    const data = await res.json();

    document.getElementById("uploadStatus").innerText = data.message;

    if(data.ai){
        handleAIResponse(data.ai);
    }
}

// ================= HANDLE AI SUMMARY =================
function handleAIResponse(text){

    const parts = text.split("QUESTIONS:");

    const summary = parts[0].replace("SUMMARY:","").trim();
    const questions = parts[1] ? parts[1].split("\n") : [];

    addMessage("📄 Summary:\n\n" + summary, "bot");

    questions.forEach(q=>{
        if(q.trim().length < 5) return;

        const cleanQ = q.replace("-", "").trim();
        addMessage("❓ " + cleanQ, "bot", true);
    });
}

// ================= SEND NORMAL =================
async function send(){
    const input = document.getElementById("msg");
    const msg = input.value;

    if(!msg) return;

    addMessage(msg, "user");
    input.value = "";

    // 🔥 typing indicator
    const typingDiv = addMessage("AI is typing...", "bot");
    typingDiv.classList.add("typing");

    try{
        const res = await fetch("/chat", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ message: msg })
        });

        const data = await res.json();

        typingDiv.classList.remove("typing");

        // 🔥 typing animation
        await typeText(typingDiv, data.reply);

    }catch(err){
        typingDiv.innerText = "Error...";
    }
}

// ================= CLICK QUESTION =================
async function sendQuestion(q){
    addMessage(q, "user");

    const typingDiv = addMessage("AI is typing...", "bot");
    typingDiv.classList.add("typing");

    try{
        const res = await fetch("/chat", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ message: q })
        });

        const data = await res.json();

        typingDiv.classList.remove("typing");

        await typeText(typingDiv, data.reply);

    }catch(err){
        typingDiv.innerText = "Error...";
    }
}