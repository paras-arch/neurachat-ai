import "./App.css";
import { useState, useRef, useEffect } from "react";
import api from "./api";
import Login from "./Login";
import Signup from "./Signup";
import ReactMarkdown from "react-markdown";

function App() {

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [errorBanner, setErrorBanner] = useState("");
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsVerifying(false);
        return;
      }
      try {
        await api.get("/auth/me");
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setIsVerifying(false);
      }
    };
    verifyToken();
  }, []);

  const createConversation = async (selectedPdfs) => {
    try {
      const response = await api.post("/conversation", { selectedPdfs: selectedPdfs || [] });
      const newId = response.data.conversationId;
      setConversationId(newId);
      localStorage.setItem("activeConversationId", newId);
      return newId;
    } catch (error) {
      console.error(error);
      setErrorBanner("Failed to create conversation.");
    }
  };

  const updateConversationPdfs = async (updatedPdfs) => {
    if (!conversationId) return;
    try {
      await api.patch(`/conversation/${conversationId}`, { selectedPdfs: updatedPdfs });
    } catch (error) { console.error(error); }
  };

  const loadConversationMessages = async (convId) => {
    try {
      const response = await api.get(`/conversation/${convId}/messages`);
      if (response.data.success) setMessages(response.data.messages);
    } catch (error) { console.error(error); }
  };

  const fetchPdfs = async () => {
    try {
      const response = await api.get("/pdf");
      setPdfList(response.data.pdfs);
    } catch (error) { console.error(error); }
  };

  const deletePdf = async (pdfName) => {
    try {
      await api.delete(`/pdf/${encodeURIComponent(pdfName)}`);
      await fetchPdfs();
      setSelectedPdfs((prev) => prev.filter((p) => p !== pdfName));
    } catch (error) { console.error(error); }
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get("/conversation");
      if (response.data.success) setConversations(response.data.conversations);
    } catch (error) { console.error(error); }
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const init = async () => {
      await fetchPdfs();
      await fetchConversations();
      const savedId = localStorage.getItem("activeConversationId");
      if (savedId) {
        setConversationId(savedId);
        await loadConversationMessages(savedId);
      } else {
        const newId = await createConversation([]);
        if (newId) await loadConversationMessages(newId);
      }
    };
    init();
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (errorBanner) {
      const t = setTimeout(() => setErrorBanner(""), 5000);
      return () => clearTimeout(t);
    }
  }, [errorBanner]);

  const startNewChat = async () => {
    setMessages([]);
    setSelectedPdfs([]);
    setErrorBanner("");
    localStorage.removeItem("activeConversationId");
    const newId = await createConversation([]);
    if (newId) await fetchConversations();
  };

  const switchConversation = async (conv) => {
    setConversationId(conv._id);
    localStorage.setItem("activeConversationId", conv._id);
    setSelectedPdfs(conv.selectedPdfs || []);
    setErrorBanner("");
    await loadConversationMessages(conv._id);
    await fetchConversations();
  };

  const startRename = (conv) => {
    setEditingConvId(conv._id);
    setEditTitle(conv.title || "New Chat");
  };

  const saveRename = async () => {
    if (!editingConvId || !editTitle.trim()) { setEditingConvId(null); return; }
    try {
      await api.patch(`/conversation/${editingConvId}/title`, { title: editTitle.trim() });
      setEditingConvId(null);
      await fetchConversations();
    } catch (error) { console.error(error); setEditingConvId(null); }
  };

  const clearCurrentChat = async () => {
    if (!conversationId) return;
    try {
      await api.delete(`/conversation/${conversationId}/messages`);
      setMessages([]);
    } catch (error) { console.error(error); }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await api.delete(`/conversation/${convId}`);
      if (conversationId === convId) {
        setConversationId(null);
        setMessages([]);
        localStorage.removeItem("activeConversationId");
      }
      await fetchConversations();
    } catch (error) { console.error(error); }
  };

  const uploadPdf = async () => {
    const formData = new FormData();
    setLoading(true);
    formData.append("pdf", selectedFile);
    const response = await api.post("/pdf/upload", formData);
    await fetchPdfs();
    const uploadedPdf = response.data.file.originalname;
    const updated = [...selectedPdfs, uploadedPdf];
    setSelectedPdfs(updated);
    await updateConversationPdfs(updated);
    setSelectedFile(null);
    setMessages((prev) => [...prev, { role: "ai", text: "✅ PDF uploaded successfully. You can now ask your question." }]);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    const userMessage = { role: "user", text: message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setLoading(true);
    setErrorBanner("");
    if (selectedFile) { await uploadPdf(); return; }
    setMessages((prev) => [...prev, userMessage]);
    try {
      const response = await api.post("/chat", { message, selectedPdfs, conversationId });
      const aiMessage = { role: "ai", text: response.data.reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
      setMessage("");
      await fetchConversations();
    } catch (error) {
      setLoading(false);
      const backendError = error.response?.data?.error;
      setErrorBanner(backendError || "Something went wrong. Please try again.");
      setMessages((prev) => [...prev, { role: "ai", text: backendError || "Something went wrong." }]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeConversationId");
    setIsAuthenticated(false);
    setMessages([]);
    setConversationId(null);
    setConversations([]);
    setPdfList([]);
  };

  if (isVerifying) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f172a", color: "white" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLogin) return <Login onLogin={() => setIsAuthenticated(true)} onSwitchToSignup={() => setShowLogin(false)} />;
    return <Signup onLogin={() => setIsAuthenticated(true)} onSwitchToLogin={() => setShowLogin(true)} />;
  }

  return (
    <div className="app-layout">
      <div className="sidebar">
        <button onClick={startNewChat} style={{ width: "100%", background: "#2563eb", color: "white", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", marginBottom: "15px", fontWeight: "bold" }}>
          + New Chat
        </button>
        <button onClick={handleLogout} style={{ width: "100%", background: "#dc2626", color: "white", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", marginBottom: "15px", fontWeight: "bold" }}>
          Logout
        </button>
        <h3 style={{ color: "#555", fontSize: "14px" }}>Conversations</h3>
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <p style={{ color: "#999", fontSize: "13px" }}>No chats yet.</p>
          ) : (
            conversations.map((conv) => (
              <div key={conv._id} onClick={() => switchConversation(conv)}
                className={conv._id === conversationId ? "conversation-item active" : "conversation-item"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {conv._id === editingConvId ? (
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={saveRename}
                        onKeyDown={(e) => { if (e.key === "Enter") saveRename(); }}
                        style={{ width: "100%", padding: "4px", borderRadius: "4px", border: "1px solid #2563eb", background: "#1e293b", color: "white", fontSize: "14px", boxSizing: "border-box" }}
                        autoFocus onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <div className="conv-title" onDoubleClick={(e) => { e.stopPropagation(); startRename(conv); }}>
                        {conv.title || "New Chat"}
                      </div>
                    )}
                    <div className="conv-meta">{(conv.selectedPdfs || []).length} PDF(s)</div>
                  </div>
                  <button onClick={(e) => handleDeleteConversation(e, conv._id)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", padding: "2px 4px", marginLeft: "4px", flexShrink: 0 }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="chat-title">🤖 NeuraChat AI</h1>
            <p className="chat-subtitle">Your Intelligent AI Assistant</p>
          </div>
          <button onClick={clearCurrentChat} style={{ background: "#dc2626", color: "white", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer" }}>Clear Chat</button>
        </div>

        {errorBanner && <div className="error-banner">⚠️ {errorBanner}</div>}

        <div style={{ border: "1px solid #ddd", padding: "12px", borderRadius: "10px", marginBottom: "15px", background: "#f9f9f9" }}>
          <h3>📄 Uploaded Documents</h3>
          {pdfList.length === 0 ? (<p>No PDF uploaded yet.</p>) : (
            pdfList.map((pdf, index) => (
              <div key={index}>
                <label>
                  <input type="checkbox" checked={selectedPdfs.includes(pdf)}
                    onChange={async (e) => {
                      let updatedPdfs;
                      if (e.target.checked) { updatedPdfs = [...selectedPdfs, pdf]; }
                      else { updatedPdfs = selectedPdfs.filter((item) => item !== pdf); }
                      setSelectedPdfs(updatedPdfs);
                      await updateConversationPdfs(updatedPdfs);
                    }} />{" "}{pdf}
                </label>
                <button onClick={() => deletePdf(pdf)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px" }}>✕</button>
              </div>
            ))
          )}
        </div>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-box">
              <h2>🤖 Welcome to NeuraChat AI</h2>
              <p>Ask me about your uploaded documents, or just chat.</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={msg.role === "user" ? "user-message" : "ai-message"}>
              <div className={msg.role === "user" ? "user-bubble" : "ai-bubble"}>
                <strong>{msg.role === "user" ? "👤 You" : "🤖 NeuraChat"}</strong><br />
                <ReactMarkdown>{msg.text}</ReactMarkdown><br />
                <small className="timestamp">{msg.time}</small>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        {loading && <div className="typing">NeuraChat is typing...</div>}

        <div className="input-container">
          <input type="file" accept=".pdf" style={{ display: "none" }} id="pdf-upload"
            onChange={(e) => { setSelectedFile(e.target.files[0]); }} />
          <button onClick={() => { document.getElementById("pdf-upload").click(); }}>📎</button>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask NeuraChat anything..." onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }} />
          <button onClick={sendMessage}>Send</button>
        </div>
        <div className="footer">Powered by OpenRouter + MongoDB Atlas</div>
      </div>
    </div>
  );
}

export default App;