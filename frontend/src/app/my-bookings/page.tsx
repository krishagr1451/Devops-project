"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CalendarCheck, XCircle, ChevronLeft, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getMyBookings, cancelBooking } from "@/lib/api";

interface Booking {
  booking_id: number;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  room_type: string;
  address: string;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const router = useRouter();

  const fetchBookings = () => {
    getMyBookings()
      .then((res) => setBookings(res.data.bookings))
      .catch(() => { toast.error("Unauthorized"); router.push("/"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await cancelBooking(id);
      toast.success("Booking cancelled");
      fetchBookings();
    } catch { toast.error("Failed to cancel booking"); }
    finally { setCancelling(null); }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
        <div className="page-container">
          <Link href="/user-dashboard" className="btn-secondary" style={{ marginBottom: 28, display: "inline-flex" }}>
            <ChevronLeft size={15} /> Back to Properties
          </Link>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <CalendarCheck size={18} color="var(--accent)" />
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Booking History</p>
            </div>
            <h1 className="section-title">My Bookings</h1>
            <p className="section-sub">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 size={36} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : bookings.length === 0 ? (
            <div className="glass" style={{ textAlign: "center", padding: "80px 40px" }}>
              <CalendarCheck size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", fontWeight: 500 }}>No bookings yet</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 6, marginBottom: 20 }}>Browse properties and book a room</p>
              <Link href="/user-dashboard" className="btn-primary" style={{ display: "inline-flex" }}>Browse Properties</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {bookings.map((b, i) => (
                <motion.div
                  key={b.booking_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass"
                  style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
                >
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>{b.room_type}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <MapPin size={12} color="var(--accent)" />
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{b.address}</p>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        📅 {b.check_in_date} → {b.check_out_date}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--accent)" }}>₹{Number(b.total_price).toFixed(2)}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Total paid</p>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => handleCancel(b.booking_id)}
                    disabled={cancelling === b.booking_id}
                  >
                    {cancelling === b.booking_id ? <Loader2 size={13} /> : <XCircle size={13} />}
                    Cancel
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
