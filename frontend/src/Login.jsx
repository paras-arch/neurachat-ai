import { useState } from "react";
import api from "./api";

function Login({ onLogin, onSwitchToSignup }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            onLogin();
        } catch (err) {
            setError(err.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "100px auto", padding: 20, background: "#1e293b", borderRadius: 12, color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "36px" }}>🤖</span>
                <h1 style={{ margin: 0 }}>NeuraChat AI</h1>
            </div>
            <h2 style={{ textAlign: "center", color: "#94a3b8" }}>Login</h2>
            {error && <p style={{ color: "#f87171", textAlign: "center" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email" placeholder="Email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "none", boxSizing: "border-box" }}
                />
                <input
                    type="password" placeholder="Password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "none", boxSizing: "border-box" }}
                />
                <button
                    type="submit" disabled={loading}
                    style={{ width: "100%", padding: 12, background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
            <p style={{ textAlign: "center", marginTop: 15, color: "#94a3b8" }}>
                Don't have an account?{" "}
                <span onClick={onSwitchToSignup} style={{ color: "#60a5fa", cursor: "pointer" }}>Sign up</span>
            </p>
        </div>
    );
}

export default Login;