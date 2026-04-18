const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const path = require('path');

let vectorDB = [];
const dbPath = path.join(__dirname, "db.json");

// 1. Read PDFs
async function readAllPDFs(){
    const folder = path.join(__dirname, "pdfs");

    // ⚠️ FIX: folder exists check
    if(!fs.existsSync(folder)){
        console.log("❌ pdfs folder not found");
        return [];
    }

    const files = fs.readdirSync(folder);

    let docs = [];

    for(let file of files){
        try{
            const buffer = fs.readFileSync(path.join(folder, file));
            const data = await pdfParse(buffer);

            if(!data.text || data.text.trim() === ""){
                console.log("⚠️ Empty PDF skipped:", file);
                continue;
            }

            docs.push({
                text: data.text,
                source: file
            });

            console.log("✅ Loaded:", file);

        }catch(err){
            console.log("❌ Error reading:", file);
        }
    }

    return docs;
}

// 2. Chunking
function chunkText(text, size=300){
    let arr = [];

    for(let i=0;i<text.length;i+=size){
        arr.push(text.slice(i,i+size));
    }

    return arr;
}

// 3. Single Embedding
async function getEmbedding(text){
    const res = await axios.post(
        "https://openrouter.ai/api/v1/embeddings",
        {
            model: "text-embedding-ada-002",
            input: text
        },
        {
            headers:{
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    return res.data.data[0].embedding;
}

// 4. Batch Embedding
async function getBatchEmbeddings(texts){
    const res = await axios.post(
        "https://openrouter.ai/api/v1/embeddings",
        {
            model: "text-embedding-ada-002",
            input: texts
        },
        {
            headers:{
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    // ⚠️ IMPORTANT FIX
    return res.data.data.map(obj => obj.embedding);
}

// 5. Save DB
function saveDB(){
    fs.writeFileSync(dbPath, JSON.stringify(vectorDB,null,2));
    console.log("💾 DB saved");
}

// 6. Load DB
function loadDB(){
    try{
        if(fs.existsSync(dbPath)){
            const data = fs.readFileSync(dbPath,"utf-8");

            if(!data || data.trim()===""){
                console.log("⚠️ Empty DB");
                return false;
            }

            vectorDB = JSON.parse(data);
            console.log("⚡ DB Loaded:", vectorDB.length);
            return true;
        }
    }catch(err){
        console.log("❌ DB Corrupted, rebuilding...");
        return false;
    }
    return false;
}

// 7. Init
async function initPDF(){
    if(loadDB()) return;

    const docs = await readAllPDFs();

    if(docs.length === 0){
        console.log("⚠️ No PDFs found");
        return;
    }

    console.log("🚀 Creating embeddings...");

    for(let doc of docs){
        const chunks = chunkText(doc.text);

        const embeddings = await getBatchEmbeddings(chunks);

        for(let i=0;i<chunks.length;i++){
            vectorDB.push({
                text: chunks[i],
                embedding: embeddings[i],
                source: doc.source
            });
        }
    }

    saveDB();
    console.log("✅ Vector DB Ready:", vectorDB.length);
}

// 8. Cosine Similarity
function cosineSimilarity(a,b){
    let dot=0, magA=0, magB=0;

    for(let i=0;i<a.length;i++){
        dot+=a[i]*b[i];
        magA+=a[i]*a[i];
        magB+=b[i]*b[i];
    }

    return dot/(Math.sqrt(magA)*Math.sqrt(magB));
}

// 9. Find Best Chunk
async function findBestChunk(query){
    const queryEmbedding = await getEmbedding(query);

    let results = [];

    for(let item of vectorDB){
        const score = cosineSimilarity(queryEmbedding,item.embedding);

        results.push({
            text: item.text,
            score,
            source: item.source
        });
    }

    // FILTER
    const THRESHOLD = 0.75;
    results = results.filter(r => r.score > THRESHOLD);

    if(results.length === 0){
        return "";
    }

    // SORT
    results.sort((a,b)=>b.score-a.score);

    const TOP_K = 2;
    const top = results.slice(0, TOP_K);

    let final = "";

    for(let item of top){
        final += `📄 ${item.source}\n${item.text}\n\n`;
    }

    return final;
}

module.exports = {
    initPDF,
    findBestChunk,
    getEmbedding,
    getBatchEmbeddings,
    vectorDB,
    saveDB
};