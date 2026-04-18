"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus, Edit2, Trash2, Eye, BedDouble, Star, LayoutDashboard, Loader2
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getDashboard, deleteProperty } from "@/lib/api";

interface Property {
  property_id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  image_url: string;
}

export default function AdminDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = () => {
    setLoading(true);
    getDashboard()
      .then((res) => {
        setProperties(res.data.properties);
        setName(res.data.name);
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this property and all its rooms/amenities?")) return;
    try {
      await deleteProperty(id);
      toast.success("Property deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete property");
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
        <div className="page-container">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <LayoutDashboard size={20} color="var(--accent)" />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Admin Dashboard</p>
              </div>
              <h1 className="section-title">Welcome back, {name} 👋</h1>
              <p className="section-sub">{properties.length} {properties.length === 1 ? "property" : "properties"} listed</p>
            </div>
            <Link href="/admin/add-property" className="btn-primary">
              <Plus size={16} />
              Add Property
            </Link>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : properties.length === 0 ? (
            <div className="glass" style={{ textAlign: "center", padding: "80px 40px" }}>
              <BedDouble size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", fontWeight: 500 }}>No properties yet</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 6 }}>Add your first property to get started</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {properties.map((p, i) => (
                <motion.div
                  key={p.property_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass"
                  style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
                >
                  {/* Image */}
                  <div style={{ width: 80, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "var(--surface)" }}>
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="property" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
                      {p.address}
                    </p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {p.city}, {p.state}, {p.country}
                    </p>
                    {p.description && (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link href={`/admin/edit-property/${p.property_id}`} className="btn-secondary" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                      <Edit2 size={13} /> Edit
                    </Link>
                    <Link href={`/admin/amenities/${p.property_id}`} className="btn-secondary" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                      <Star size={13} /> Amenities
                    </Link>
                    <Link href={`/admin/rooms/${p.property_id}`} className="btn-secondary" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                      <BedDouble size={13} /> Rooms
                    </Link>
                    <Link href={`/admin/room-status/${p.property_id}`} className="btn-secondary" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                      <Eye size={13} /> Status
                    </Link>
                    <button className="btn-danger" onClick={() => handleDelete(p.property_id)}>
                      <Trash2 size={13} /> Delete
                    </button>
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
