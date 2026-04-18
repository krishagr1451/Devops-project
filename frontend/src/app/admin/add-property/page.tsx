"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChevronLeft, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { addProperty } from "@/lib/api";

const fields = [
  { key: "address", label: "Address", placeholder: "123 Main Street" },
  { key: "city", label: "City", placeholder: "Mumbai" },
  { key: "state", label: "State", placeholder: "Maharashtra" },
  { key: "country", label: "Country", placeholder: "India" },
  { key: "image_url", label: "Image URL", placeholder: "https://..." },
  { key: "image_description", label: "Image Description", placeholder: "Front view of the property" },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    address: "", city: "", state: "", country: "", description: "", image_url: "", image_description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addProperty(form);
      toast.success(res.data.message);
      router.push(`/admin/amenities/${res.data.property_id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px", display: "flex", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 580 }}>
          <Link href="/dashboard" className="btn-secondary" style={{ marginBottom: 24, display: "inline-flex" }}>
            <ChevronLeft size={15} /> Back to Dashboard
          </Link>
          <div className="glass" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <PlusCircle size={20} color="var(--accent)" />
              <h1 className="section-title" style={{ marginBottom: 0 }}>Add New Property</h1>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {fields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{label}</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={key !== "image_url" && key !== "image_description"}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Describe the property..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, width: "100%" }}>
                {loading ? <Loader2 size={16} /> : null}
                {loading ? "Adding..." : "Add Property & Continue to Amenities"}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  );
}
