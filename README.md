# 🤖 AI PDF Assistant

An intelligent full-stack web application that allows users to upload PDFs and interact with them using AI.

---

## 🚀 Features

- 📄 Upload PDF files
- 🧠 Extract and parse PDF content
- 🔍 RAG (Retrieval Augmented Generation) system
- 💬 Chat with your PDF
- ⚡ Fast responses using caching
- 📌 Auto-generated summary
- ❓ Auto-generated questions from PDF

---

## 🛠️ Tech Stack

### Frontend:
- HTML
- CSS
- JavaScript

### Backend:
- Node.js
- Express.js

### Libraries & Tools:
- multer (file upload)
- pdf-parse (PDF parsing)
- OpenRouter API (AI + embeddings)

---

## 📁 Project Structure
AI-PDF-System/
│
├── public/ # Frontend files
├── server/
│ ├── uploads/ # Uploaded PDFs (ignored in Git)
│ └── server.js # Backend server
│
├── package.json
├── package-lock.json
├── .env # Environment variables (ignored)
├── .gitignore
└── README.md


---

## ⚙️ Installation & Setup

### 1. Clone the repository
git clone https://github.com/your-username/ai-pdf-assistant.git

cd ai-pdf-assistant


### 2. Install dependencies
npm install


### 3. Create `.env` file

OPENROUTER_API_KEY=your_api_key_here


### 4. Run the server

npm start


### 5. Open in browser

http://localhost:3000


---

## 🔌 API Endpoints

### 📤 Upload PDF

POST /upload


### 💬 Chat with PDF

POST /chat


---

## ⚠️ Important Notes

- `node_modules` is ignored
- `.env` is not uploaded (for security)
- `uploads/` folder is ignored
- Make sure to add your API key before running

---

## 🌐 Deployment

- Backend: Render
- Frontend: Vercel

(Deployment steps coming soon)

---

## 📌 Future Improvements

- User authentication
- Multiple PDF support
- Better UI/UX
- Vector database integration

---

## 👨‍💻 Author

Faham Ahmad Khan

---

## ⭐ If you like this project

Give it a star ⭐ on GitHub!
