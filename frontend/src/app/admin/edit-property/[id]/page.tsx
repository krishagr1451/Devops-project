"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getProperty, updateProperty } from "@/lib/api";

const fields = [
  { key: "address", label: "Address", placeholder: "123 Main Street" },
  { key: "city", label: "City", placeholder: "Mumbai" },
  { key: "state", label: "State", placeholder: "Maharashtra" },
  { key: "country", label: "Country", placeholder: "India" },
  { key: "image_url", label: "Image URL", placeholder: "https://..." },
  { key: "image_description", label: "Image Description", placeholder: "Front view" },
];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    address: "", city: "", state: "", country: "", description: "", image_url: "", image_description: ""
  });

  useEffect(() => {
    getProperty(Number(id))
      .then((res) => {
        const p = res.data.property;
        setForm({ address: p.address, city: p.city, state: p.state, country: p.country, description: p.description ?? "", image_url: p.image_url ?? "", image_description: p.image_description ?? "" });
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProperty(Number(id), form);
      toast.success("Property updated!");
      router.push("/dashboard");
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <><Navbar /><div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} /></div></>;

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", padding: "40px 24px", display: "flex", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 580 }}>
          <Link href="/dashboard" className="btn-secondary" style={{ marginBottom: 24, display: "inline-flex" }}>
            <ChevronLeft size={15} /> Back
          </Link>
          <div className="glass" style={{ padding: 32 }}>
            <h1 className="section-title" style={{ marginBottom: 24 }}>Edit Property</h1>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {fields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{label}</label>
                  <input className="input-field" type="text" placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Description</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
              </div>
              <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 8, width: "100%" }}>
                {saving ? <Loader2 size={16} /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  );
}
