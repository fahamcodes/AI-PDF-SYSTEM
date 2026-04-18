require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const { initPDF, findBestChunk, vectorDB, saveDB, getBatchEmbeddings } = require("./pdfRag");
const { loadCache, getFromCache, saveToCache } = require("./cache");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,"../public")));

const upload = multer({ dest: path.join(__dirname,"uploads") });

// INIT
(async ()=>{
    await initPDF();
    loadCache();
})();

// CHAT
app.post("/chat", async (req,res)=>{
    const userMessage = req.body.message;
    const normalized = userMessage.toLowerCase().trim();

    try{
        const cached = getFromCache(normalized);

        if(cached){
            return res.json({ reply: cached });
        }

        const context = await findBestChunk(userMessage);

        const prompt = `
You are a smart AI tutor.

- Use context if helpful
- Answer clearly

Context:
${context}

Question:
${userMessage}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages:[{role:"user",content:prompt}]
            },
            {
                headers:{
                    Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`
                }
            }
        );

        const answer = response.data.choices[0].message.content;

        saveToCache(normalized,answer);

        res.json({ reply: answer });

    }catch(err){
        console.log(err.message);
        res.status(500).send("Error");
    }
});

// UPLOAD + SUMMARY + QUESTIONS
app.post("/upload", upload.single("pdf"), async (req,res)=>{
    try{
        const buffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(buffer);

        if(!data.text.trim()){
            return res.json({ success:false, message:"Empty PDF" });
        }

        // chunk
        const chunks = [];
        for(let i=0;i<data.text.length;i+=300){
            chunks.push(data.text.slice(i,i+300));
        }

        // embeddings
        const embeddings = await getBatchEmbeddings(chunks);

        for(let i=0;i<chunks.length;i++){
            vectorDB.push({
                text: chunks[i],
                embedding: embeddings[i],
                source: req.file.originalname
            });
        }

        saveDB();

        // 🔥 AI SUMMARY + QUESTIONS
        const aiRes = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `
Summarize this document in simple language (15-20 lines).

Then generate 5 important questions.

Format:
SUMMARY:
...

QUESTIONS:
- question1
- question2
- question3
- question4
- question5

Document:
${data.text.slice(0,4000)}
`
                }]
            },
            {
                headers:{
                    Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`
                }
            }
        );

        fs.unlinkSync(req.file.path);

        res.json({
            success:true,
            message:"Uploaded & Indexed",
            ai: aiRes.data.choices[0].message.content
        });

    }catch(err){
        console.log(err.message);
        res.status(500).send("Upload Error");
    }
});

app.listen(3000, ()=>{
    console.log("Server running");
});