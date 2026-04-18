"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Calendar, CreditCard, ChevronLeft, Loader2, IndianRupee } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { bookRoom } from "@/lib/api";
import api from "@/lib/api";

interface Room { room_id: number; room_type: string; capacity: number; price_per_night: number; }

export default function BookingPage() {
  const { roomId, propertyId } = useParams<{ roomId: string; propertyId: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ check_in_date: "", check_out_date: "", payment_method: "credit_card" });

  useEffect(() => {
    api.get(`/book_room/${roomId}/${propertyId}`)
      .then((res) => setRoom(res.data.room))
      .catch(() => { toast.error("Unauthorized"); router.push("/"); })
      .finally(() => setLoading(false));
  }, [roomId, propertyId]);

  const totalNights = form.check_in_date && form.check_out_date
    ? Math.max(0, (new Date(form.check_out_date).getTime() - new Date(form.check_in_date).getTime()) / 86400000)
    : 0;
  const totalPrice = room ? totalNights * room.price_per_night : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalNights <= 0) { toast.error("Invalid date range"); return; }
    setSubmitting(true);
    try {
      await bookRoom(Number(roomId), Number(propertyId), form);
      toast.success("Booking confirmed!");
      router.push("/user-dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Booking failed";
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={36} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px", display: "flex", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 540 }}>
          <Link href={`/property/${propertyId}`} className="btn-secondary" style={{ marginBottom: 24, display: "inline-flex" }}>
            <ChevronLeft size={15} /> Back
          </Link>

          <div className="glass" style={{ padding: 32 }}>
            <h1 className="section-title" style={{ marginBottom: 6 }}>Book Room</h1>
            {room && (
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28, padding: "12px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.15)" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700 }}>{room.room_type}</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Capacity: {room.capacity} guests</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontWeight: 800, fontSize: "1.1rem", justifyContent: "flex-end" }}>
                    <IndianRupee size={15} />{room.price_per_night}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>per night</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} /> Check-in</span>
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.check_in_date}
                    onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} /> Check-out</span>
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.check_out_date}
                    onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                    min={form.check_in_date || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <CreditCard size={13} /> Payment Method
                </label>
                <select className="input-field" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} required>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {totalNights > 0 && room && (
                <div style={{ padding: "16px", background: "rgba(34,197,94,0.06)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                    <span>{totalNights} night{totalNights > 1 ? "s" : ""} × ₹{room.price_per_night}</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem" }}>
                    <span>Total</span>
                    <span style={{ color: "var(--success)" }}>₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? <Loader2 size={16} /> : null}
                {submitting ? "Confirming..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  );
}
