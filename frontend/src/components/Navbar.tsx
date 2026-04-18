"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Hotel, User, Shield } from "lucide-react";
import { logout } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, refresh } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    refresh();
    toast.success("Logged out successfully");
    router.push("/");
  };

  if (!user?.logged_in) return null;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(9,9,11,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        className="page-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <Link
          href={user.role === "admin" ? "/dashboard" : "/user-dashboard"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Hotel size={18} color="#09090b" strokeWidth={2.5} />
          </div>
          <span
            style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}
          >
            Stay<span className="gradient-text">NGo</span>
          </span>
        </Link>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.role === "admin" ? (
              <Shield size={14} color="var(--accent)" />
            ) : (
              <User size={14} color="var(--text-secondary)" />
            )}
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {user.name}
            </span>
            <span className={`badge ${user.role === "admin" ? "badge-amber" : "badge-blue"}`}>
              {user.role}
            </span>
          </div>

          <button className="btn-secondary" onClick={handleLogout} style={{ padding: "8px 14px" }}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
