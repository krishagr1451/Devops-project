"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChevronLeft, BedDouble, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getRoomStatus } from "@/lib/api";

interface Room { room_id: number; room_type: string; capacity: number; price_per_night: number; is_booked: number; }
interface Property { property_id: number; address: string; city: string; }

export default function RoomStatusPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoomStatus(Number(propertyId))
      .then((res) => { setProperty(res.data.property); setRooms(res.data.rooms); })
      .catch(() => { toast.error("Unauthorized"); router.push("/dashboard"); })
      .finally(() => setLoading(false));
  }, [propertyId]);

  const booked = rooms.filter((r) => r.is_booked).length;
  const available = rooms.filter((r) => !r.is_booked).length;

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
        <div className="page-container" style={{ maxWidth: 740 }}>
          <Link href="/dashboard" className="btn-secondary" style={{ marginBottom: 28, display: "inline-flex" }}>
            <ChevronLeft size={15} /> Dashboard
          </Link>

          <h1 className="section-title" style={{ marginBottom: 4 }}>Room Status</h1>
          {property && <p className="section-sub" style={{ marginBottom: 24 }}>{property.address}, {property.city}</p>}

          {/* Summary */}
          {!loading && (
            <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
              <div className="glass" style={{ flex: 1, minWidth: 140, padding: "16px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--success)" }}>{available}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Available</p>
              </div>
              <div className="glass" style={{ flex: 1, minWidth: 140, padding: "16px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--error)" }}>{booked}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Booked</p>
              </div>
              <div className="glass" style={{ flex: 1, minWidth: 140, padding: "16px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>{rooms.length}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Total</p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rooms.map((r, i) => (
                <motion.div
                  key={r.room_id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass"
                  style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}
                >
                  <BedDouble size={18} color={r.is_booked ? "var(--error)" : "var(--success)"} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700 }}>{r.room_type}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {r.capacity} guests · ₹{r.price_per_night}/night
                    </p>
                  </div>
                  {r.is_booked ? (
                    <span className="badge badge-red" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <XCircle size={12} /> Booked
                    </span>
                  ) : (
                    <span className="badge badge-green" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle size={12} /> Available
                    </span>
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
