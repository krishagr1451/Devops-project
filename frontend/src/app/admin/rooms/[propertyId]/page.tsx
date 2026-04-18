"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, Loader2, BedDouble } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getRooms, addRoom, deleteRoom, getRoom, updateRoom } from "@/lib/api";

interface Room { room_id: number; room_type: string; capacity: number; price_per_night: number; availability_status: number; }

const emptyForm = { room_type: "", capacity: "", price_per_night: "", availability_status: true };

export default function RoomsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();
  const pid = Number(propertyId);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newForm, setNewForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    getRooms(pid)
      .then((res) => setRooms(res.data.rooms))
      .catch(() => { toast.error("Unauthorized"); router.push("/"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [pid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addRoom(pid, { ...newForm, availability_status: Boolean(newForm.availability_status), property_id: String(pid) });
      toast.success("Room added!");
      setNewForm(emptyForm);
      fetchData();
    } catch { toast.error("Failed to add room"); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this room?")) return;
    try {
      await deleteRoom(id);
      toast.success("Room deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const startEdit = async (r: Room) => {
    setEditId(r.room_id);
    setEditForm({ room_type: r.room_type, capacity: String(r.capacity), price_per_night: String(r.price_per_night), availability_status: Boolean(r.availability_status) });
  };

  const handleEditSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await updateRoom(editId, { ...editForm, availability_status: Boolean(editForm.availability_status), property_id: String(pid) });
      toast.success("Room updated!");
      setEditId(null);
      fetchData();
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
        <div className="page-container" style={{ maxWidth: 800 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn-secondary" style={{ display: "inline-flex" }}>
              <ChevronLeft size={15} /> Dashboard
            </Link>
            <Link href={`/admin/room-status/${pid}`} className="btn-secondary" style={{ display: "inline-flex" }}>
              Room Status →
            </Link>
          </div>

          <h1 className="section-title" style={{ marginBottom: 4 }}>Manage Rooms</h1>
          <p className="section-sub" style={{ marginBottom: 28 }}>Property #{pid}</p>

          {/* Add form */}
          <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
            <p style={{ fontWeight: 700, marginBottom: 16, fontSize: "0.9rem" }}>Add New Room</p>
            <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              <input className="input-field" type="text" placeholder="Room type (e.g. Deluxe)" value={newForm.room_type} onChange={(e) => setNewForm({ ...newForm, room_type: e.target.value })} required />
              <input className="input-field" type="number" placeholder="Capacity" value={newForm.capacity} onChange={(e) => setNewForm({ ...newForm, capacity: e.target.value })} required min={1} />
              <input className="input-field" type="number" placeholder="Price / night (₹)" value={newForm.price_per_night} onChange={(e) => setNewForm({ ...newForm, price_per_night: e.target.value })} required min={0} step="0.01" />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                <input type="checkbox" checked={Boolean(newForm.availability_status)} onChange={(e) => setNewForm({ ...newForm, availability_status: e.target.checked })} />
                Available
              </label>
              <button className="btn-primary" type="submit" disabled={adding} style={{ gridColumn: "1 / -1" }}>
                {adding ? <Loader2 size={15} /> : <Plus size={15} />} Add Room
              </button>
            </form>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass" style={{ textAlign: "center", padding: 40 }}>
              <BedDouble size={40} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-secondary)" }}>No rooms yet. Add one above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rooms.map((r, i) => (
                <motion.div
                  key={r.room_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass"
                  style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
                >
                  {editId === r.room_id ? (
                    <>
                      <input className="input-field" value={editForm.room_type} onChange={(e) => setEditForm({ ...editForm, room_type: e.target.value })} placeholder="Type" style={{ flex: "1 1 140px" }} />
                      <input className="input-field" type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} placeholder="Capacity" style={{ width: 90 }} />
                      <input className="input-field" type="number" value={editForm.price_per_night} onChange={(e) => setEditForm({ ...editForm, price_per_night: e.target.value })} placeholder="Price" style={{ width: 110 }} />
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                        <input type="checkbox" checked={Boolean(editForm.availability_status)} onChange={(e) => setEditForm({ ...editForm, availability_status: e.target.checked })} />
                        Available
                      </label>
                      <button className="btn-primary" onClick={handleEditSave} disabled={saving} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                        {saving ? <Loader2 size={13} /> : <Check size={13} />} Save
                      </button>
                      <button className="btn-secondary" onClick={() => setEditId(null)} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <BedDouble size={16} color="var(--accent)" />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{r.room_type}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {r.capacity} guests · ₹{r.price_per_night}/night
                        </p>
                      </div>
                      <span className={`badge ${r.availability_status ? "badge-green" : "badge-red"}`}>
                        {r.availability_status ? "Available" : "Booked"}
                      </span>
                      <button className="btn-secondary" onClick={() => startEdit(r)} style={{ padding: "7px 13px", fontSize: "0.8rem" }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(r.room_id)}>
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
