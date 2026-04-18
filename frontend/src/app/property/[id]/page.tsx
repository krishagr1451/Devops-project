"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin, Star, BedDouble, Users, IndianRupee, CheckCircle, XCircle,
  ChevronLeft, Send, Loader2
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getPropertyDetails, addReview } from "@/lib/api";

interface Room {
  room_id: number;
  room_type: string;
  capacity: number;
  price_per_night: number;
  availability_status: number;
}

interface Amenity { amenity_id: number; name: string; description: string; }
interface Review { user_name: string; rating: number; comment: string; created_at: string; }

interface Property {
  property_id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  image_url: string;
}

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [loading, setLoading] = useState(true);
  const [reviewState, setReviewState] = useState<Record<number, { rating: number; comment: string }>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  const fetchData = () => {
    getPropertyDetails(Number(id))
      .then((res) => {
        setProperty(res.data.property);
        setAmenities(res.data.amenities);
        setRooms(res.data.rooms);
        setReviews(res.data.room_reviews);
      })
      .catch(() => { toast.error("Unauthorized"); router.push("/"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleReview = async (roomId: number) => {
    const rv = reviewState[roomId];
    if (!rv?.comment) return toast.error("Please write a comment");
    setSubmitting(roomId);
    try {
      await addReview(roomId, { rating: rv.rating ?? 5, comment: rv.comment, property_id: Number(id) });
      toast.success("Review submitted!");
      setReviewState((prev) => ({ ...prev, [roomId]: { rating: 5, comment: "" } }));
      fetchData();
    } catch { toast.error("Failed to submit review"); }
    finally { setSubmitting(null); }
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Loader2 size={36} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    </>
  );

  if (!property) return null;

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px" }}>
        <div className="page-container">
          <Link href="/user-dashboard" className="btn-secondary" style={{ marginBottom: 28, display: "inline-flex" }}>
            <ChevronLeft size={16} /> Back to Properties
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{ overflow: "hidden", marginBottom: 28 }}
          >
            {property.image_url && (
              <div style={{ height: 260, overflow: "hidden", position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={property.image_url} alt="property" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
              </div>
            )}
            <div style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <MapPin size={16} color="var(--accent)" />
                <p style={{ fontWeight: 700, fontSize: "1.3rem" }}>{property.address}</p>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: 12 }}>
                {property.city}, {property.state}, {property.country}
              </p>
              {property.description && (
                <p style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: "0.9rem" }}>{property.description}</p>
              )}
            </div>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>
            {/* Rooms */}
            <div>
              <h2 className="section-title" style={{ marginBottom: 20 }}>Available Rooms</h2>
              {rooms.length === 0 ? (
                <div className="glass" style={{ textAlign: "center", padding: 40 }}>
                  <BedDouble size={40} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--text-secondary)" }}>No rooms listed yet</p>
                </div>
              ) : (
                rooms.map((room, i) => {
                  const roomReviews = reviews[String(room.room_id)] ?? [];
                  const avgRating = roomReviews.length
                    ? (roomReviews.reduce((a, r) => a + r.rating, 0) / roomReviews.length).toFixed(1)
                    : null;
                  const rv = reviewState[room.room_id] ?? { rating: 5, comment: "" };

                  return (
                    <motion.div
                      key={room.room_id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="glass"
                      style={{ marginBottom: 20, padding: 24 }}
                    >
                      {/* Room header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 6 }}>{room.room_type}</h3>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                              <Users size={13} /> {room.capacity} guests
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--accent)", fontSize: "0.85rem", fontWeight: 700 }}>
                              <IndianRupee size={13} /> {room.price_per_night} / night
                            </span>
                            {avgRating && (
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}>
                                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                                <span style={{ color: "var(--text-secondary)" }}>{avgRating} ({roomReviews.length})</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {room.availability_status ? (
                            <>
                              <span className="badge badge-green" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <CheckCircle size={11} /> Available
                              </span>
                              <Link
                                href={`/booking/${room.room_id}/${property.property_id}`}
                                className="btn-primary"
                                style={{ padding: "8px 18px", fontSize: "0.85rem" }}
                              >
                                Book Now
                              </Link>
                            </>
                          ) : (
                            <span className="badge badge-red" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <XCircle size={11} /> Unavailable
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reviews */}
                      {roomReviews.length > 0 && (
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 16 }}>
                          <p style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 10, color: "var(--text-secondary)" }}>
                            Reviews ({roomReviews.length})
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {roomReviews.slice(0, 3).map((rev, ri) => (
                              <div key={ri} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{rev.user_name}</span>
                                  <div style={{ display: "flex", gap: 2 }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={11} color="#fbbf24" fill={s <= rev.rating ? "#fbbf24" : "transparent"} />
                                    ))}
                                  </div>
                                </div>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>{rev.comment}</p>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>{rev.created_at?.slice(0, 10)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Review */}
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: 10, color: "var(--text-secondary)" }}>Add a Review</p>
                        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                          {[1,2,3,4,5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setReviewState((prev) => ({ ...prev, [room.room_id]: { ...rv, rating: s } }))}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                            >
                              <Star size={18} color="#fbbf24" fill={s <= (rv.rating ?? 5) ? "#fbbf24" : "transparent"} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="input-field"
                          rows={2}
                          placeholder="Share your experience..."
                          value={rv.comment}
                          onChange={(e) => setReviewState((prev) => ({ ...prev, [room.room_id]: { ...rv, comment: e.target.value } }))}
                          style={{ resize: "none", marginBottom: 10 }}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => handleReview(room.room_id)}
                          disabled={submitting === room.room_id}
                          style={{ fontSize: "0.85rem", padding: "9px 18px" }}
                        >
                          {submitting === room.room_id ? <Loader2 size={14} /> : <Send size={14} />}
                          Submit Review
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Amenities sidebar */}
            <div style={{ position: "sticky", top: 80 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Amenities</h2>
              <div className="glass" style={{ padding: 20 }}>
                {amenities.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No amenities listed</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {amenities.map((a) => (
                      <div key={a.amenity_id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{a.name}</p>
                          {a.description && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>{a.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
