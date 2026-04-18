"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hotel, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { login, register } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "", role: "user" });

  // Register state
  const [regData, setRegData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    phone_number: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(loginData.email, loginData.password, loginData.role);
      toast.success(res.data.message);
      refresh();
      if (res.data.role === "admin") router.push("/dashboard");
      else router.push("/user-dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(regData);
      toast.success(res.data.message);
      setTab("login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245,158,11,0.12) 0%, transparent 70%), var(--bg)",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 15% 50%, rgba(245,158,11,0.04) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(59,130,246,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 460, position: "relative" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, var(--accent), #fbbf24)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 32px var(--accent-glow)",
            }}
          >
            <Hotel size={26} color="#09090b" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Stay<span className="gradient-text">NGo</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: "0.9rem" }}>
            Premium hotel booking platform
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: 32 }}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  background: tab === t ? "rgba(245,158,11,0.15)" : "transparent",
                  color: tab === t ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === "login" && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input-field"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Role</label>
                <select
                  className="input-field"
                  value={loginData.role}
                  onChange={(e) => setLoginData({ ...loginData, role: e.target.value })}
                >
                  <option value="user">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, width: "100%" }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </motion.form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleRegister}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
                { label: "Phone Number", key: "phone_number", type: "text", placeholder: "+91 9876543210" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</label>
                  <input
                    className="input-field"
                    type={type}
                    placeholder={placeholder}
                    value={regData[key as keyof typeof regData]}
                    onChange={(e) => setRegData({ ...regData, [key]: e.target.value })}
                    required
                  />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="••••••••"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>Role</label>
                <select
                  className="input-field"
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                >
                  <option value="user">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, width: "100%" }}>
                {loading ? <Loader2 size={16} /> : null}
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
