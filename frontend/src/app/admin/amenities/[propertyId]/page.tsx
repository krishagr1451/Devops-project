"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getAmenities, addAmenity, deleteAmenity, getAmenity, updateAmenity } from "@/lib/api";

interface Amenity { amenity_id: number; name: string; description: string; }

export default function AmenitiesPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();
  const pid = Number(propertyId);

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newForm, setNewForm] = useState({ amenity_name: "", amenity_description: "" });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ amenity_name: "", amenity_description: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    getAmenities(pid)
      .then((res) => setAmenities(res.data.amenities))
      .catch(() => { toast.error("Unauthorized"); router.push("/"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [pid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addAmenity(pid, newForm.amenity_name, newForm.amenity_description);
      toast.success("Amenity added!");
      setNewForm({ amenity_name: "", amenity_description: "" });
      fetchData();
    } catch { toast.error("Failed to add amenity"); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this amenity?")) return;
    try {
      await deleteAmenity(id);
      toast.success("Amenity deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const startEdit = async (a: Amenity) => {
    setEditId(a.amenity_id);
    setEditForm({ amenity_name: a.name, amenity_description: a.description });
  };

  const handleEditSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateAmenity(editId, editForm.amenity_name, editForm.amenity_description, pid);
      toast.success("Amenity updated!");
      setEditId(null);
      fetchData();
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
        <div className="page-container" style={{ maxWidth: 700 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn-secondary" style={{ display: "inline-flex" }}>
              <ChevronLeft size={15} /> Dashboard
            </Link>
            <Link href={`/admin/rooms/${pid}`} className="btn-secondary" style={{ display: "inline-flex" }}>
              Manage Rooms →
            </Link>
          </div>

          <h1 className="section-title" style={{ marginBottom: 4 }}>Amenities</h1>
          <p className="section-sub" style={{ marginBottom: 28 }}>Property #{pid}</p>

          {/* Add form */}
          <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
            <p style={{ fontWeight: 700, marginBottom: 16, fontSize: "0.9rem" }}>Add New Amenity</p>
            <form onSubmit={handleAdd} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                className="input-field"
                type="text"
                placeholder="Amenity name (e.g. WiFi)"
                value={newForm.amenity_name}
                onChange={(e) => setNewForm({ ...newForm, amenity_name: e.target.value })}
                required
                style={{ flex: "1 1 180px" }}
              />
              <input
                className="input-field"
                type="text"
                placeholder="Description"
                value={newForm.amenity_description}
                onChange={(e) => setNewForm({ ...newForm, amenity_description: e.target.value })}
                style={{ flex: "2 1 240px" }}
              />
              <button className="btn-primary" type="submit" disabled={adding} style={{ flexShrink: 0 }}>
                {adding ? <Loader2 size={15} /> : <Plus size={15} />}
                Add
              </button>
            </form>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : amenities.length === 0 ? (
            <div className="glass" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "var(--text-secondary)" }}>No amenities yet. Add one above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {amenities.map((a, i) => (
                <motion.div
                  key={a.amenity_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass"
                  style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
                >
                  {editId === a.amenity_id ? (
                    <>
                      <input
                        className="input-field"
                        value={editForm.amenity_name}
                        onChange={(e) => setEditForm({ ...editForm, amenity_name: e.target.value })}
                        style={{ flex: "1 1 140px" }}
                      />
                      <input
                        className="input-field"
                        value={editForm.amenity_description}
                        onChange={(e) => setEditForm({ ...editForm, amenity_description: e.target.value })}
                        style={{ flex: "2 1 200px" }}
                      />
                      <button className="btn-primary" onClick={handleEditSave} disabled={saving} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                        {saving ? <Loader2 size={13} /> : <Check size={13} />} Save
                      </button>
                      <button className="btn-secondary" onClick={() => setEditId(null)} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{a.name}</p>
                        {a.description && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{a.description}</p>}
                      </div>
                      <button className="btn-secondary" onClick={() => startEdit(a)} style={{ padding: "7px 13px", fontSize: "0.8rem" }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(a.amenity_id)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
