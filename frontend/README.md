# 🤖 NeuraChat AI

### Intelligent Document Assistant powered by Retrieval-Augmented Generation (RAG)

NeuraChat AI is a full-stack AI-powered document assistant that enables users to securely upload PDF documents and interact with them using natural language. The application leverages Retrieval-Augmented Generation (RAG) to retrieve relevant context from uploaded documents before generating intelligent, context-aware responses using a Large Language Model (LLM).

Designed with a scalable architecture, NeuraChat AI combines modern web technologies with Generative AI to deliver a secure, responsive, and intuitive document question-answering experience.

---

## ✨ Key Features

- Secure User Authentication using JWT
- User Registration & Login
- PDF Document Upload
- Retrieval-Augmented Generation (RAG)
- AI-powered Question Answering
- User-specific Chat Sessions
- Conversation History
- Document Management
- Responsive User Interface
- RESTful API Architecture
- MongoDB Atlas Integration
- Modern MERN Stack Architecture

---

# 🛠 Technology Stack

## Frontend

- React.js
- JavaScript (ES6+)
- CSS3
- Axios

## Backend

- Node.js
- Express.js

## Database

- MongoDB Atlas
- Mongoose

## Artificial Intelligence

- LangChain
- OpenRouter API
- Ollama Embeddings
- Retrieval-Augmented Generation (RAG)
- Prompt Engineering

## Authentication

- JSON Web Token (JWT)

## Development Tools

- Git
- GitHub
- Postman
- Visual Studio Code

---

# 🏗 System Architecture

```

Frontend (React.js)
│
▼
Express.js REST API
│
├──────────────┐
│ │
▼ ▼
MongoDB Atlas OpenRouter LLM
│
▼
LangChain
│
▼
Ollama Embeddings
│
▼
Context Retrieval (RAG)

```

---

# 📁 Project Structure

```

NeuraChat-AI

├── frontend/
│ ├── src/
│ ├── components/
│ ├── pages/
│ ├── assets/
│ └── utils/
│
├── backend/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── uploads/
│ ├── utils/
│ └── server.js
│
├── README.md
├── LICENSE
└── .gitignore

```

---

# ⚙ Installation


cd NeuraChat-AI
Install backend dependencies

cd backend

npm install

Install frontend dependencies

cd frontend

npm install
🔑 Environment Variables

Create a .env file inside the backend directory.

PORT=5000

MONGODB_URI=your_mongodb_connection_string

OPENROUTER_API_KEY=your_openrouter_api_key

JWT_SECRET=your_secret_key

JWT_EXPIRES_IN=7d
▶ Running the Application

Start Ollama

ollama serve

Download the embedding model

ollama pull nomic-embed-text

Start Backend

cd backend

npm run dev

Start Frontend

cd frontend

npm run dev

Open

http://localhost:5173
🔄 Application Workflow
User Authentication
        │
        ▼
Upload PDF Document
        │
        ▼
Generate Vector Embeddings
        │
        ▼
Store Metadata & Embeddings
        │
        ▼
User submits Question
        │
        ▼
Similarity Search
        │
        ▼
Relevant Context Retrieved
        │
        ▼
LLM Generates Context-aware Response

Engineering Highlights
Modular Backend Architecture
RESTful API Design
Secure JWT Authentication
Document-based Retrieval-Augmented Generation
AI-powered Context Retrieval
User Session Management
Scalable Folder Structure
MongoDB Integration
Responsive Frontend Design
Clean Separation of Frontend & Backend
Modern JavaScript Development Practices
🎯 Learning Outcomes

This project strengthened my practical understanding of:

Full Stack Web Development
Authentication & Authorization
REST API Development
MongoDB Data Modeling
Retrieval-Augmented Generation (RAG)
LangChain Integration
Large Language Model Integration
AI Application Development
Prompt Engineering
Document Processing Pipelines
Software Architecture
State Management
API Integration
🚀 Future Enhancements
Production Cloud Deployment
Cloud-native Embedding Services
Multi-document Knowledge Base
Streaming AI Responses
Advanced Semantic Search
Document Summarization
Chat Export
Role-Based Access Control
Citation Support
Performance Optimization




📄 License

Copyright © 2026 Paras Rathore.

This repository is provided for portfolio and demonstration purposes only.

No part of this source code may be copied, modified, redistributed, or used in personal or commercial projects without prior written permission from the author.





















# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
