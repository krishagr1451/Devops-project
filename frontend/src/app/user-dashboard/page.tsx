"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MapPin, Eye, CalendarCheck, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getUserDashboard } from "@/lib/api";

interface Property {
  property_id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  image_url: string;
}

export default function UserDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getUserDashboard()
      .then((res) => {
        setProperties(res.data.properties);
        setName(res.data.name);
      })
      .catch(() => { toast.error("Please log in"); router.push("/"); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
        <div className="page-container">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Building2 size={18} color="var(--accent)" />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Available Properties</p>
              </div>
              <h1 className="section-title">Welcome, {name} 🏨</h1>
              <p className="section-sub">Browse and book from {properties.length} properties</p>
            </div>
            <Link href="/my-bookings" className="btn-secondary">
              <CalendarCheck size={15} />
              My Bookings
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {properties.map((p, i) => (
                <motion.div
                  key={p.property_id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass"
                  style={{ overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s", cursor: "default" }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Image */}
                  <div style={{ height: 180, background: "var(--surface)", overflow: "hidden", position: "relative" }}>
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.address}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <Building2 size={40} color="var(--text-muted)" />
                      </div>
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
                  </div>

                  {/* Content */}
                  <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                      <MapPin size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{p.address}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {p.city}, {p.state}, {p.country}
                        </p>
                      </div>
                    </div>
                    {p.description && (
                      <p style={{
                        color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.5, flex: 1,
                        overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 16
                      }}>
                        {p.description}
                      </p>
                    )}
                    <Link href={`/property/${p.property_id}`} className="btn-primary" style={{ width: "100%" }}>
                      <Eye size={15} /> View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
