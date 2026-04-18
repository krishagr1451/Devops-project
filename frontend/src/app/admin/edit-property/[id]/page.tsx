"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, Loader2, UploadCloud, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getProperty, updateProperty, uploadPropertyImage } from "@/lib/api";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Record<string, string>>({
    address: "", city: "", state: "", country: "", description: "", image_url: "", image_description: ""
  });

  useEffect(() => {
    getProperty(Number(id))
      .then((res) => {
        const p = res.data.property;
        setForm({
          address: p.address ?? "",
          city: p.city ?? "",
          state: p.state ?? "",
          country: p.country ?? "",
          description: p.description ?? "",
          image_url: p.image_url ?? "",
          image_description: p.image_description ?? ""
        });
        if (p.image_url) setImagePreview(p.image_url);
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((f) => ({ ...f, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url;
      // Only upload if a new file was selected
      if (imageFile) {
        image_url = await uploadPropertyImage(imageFile);
      }
      await updateProperty(Number(id), { ...form, image_url });
      toast.success("Property updated!");
      router.push("/dashboard");
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  const textFields = [
    { key: "address", label: "Address", placeholder: "123 Main Street" },
    { key: "city", label: "City", placeholder: "Mumbai" },
    { key: "state", label: "State", placeholder: "Maharashtra" },
    { key: "country", label: "Country", placeholder: "India" },
    { key: "image_description", label: "Image Description", placeholder: "Front view" },
  ];

  if (loading) return (
    <><Navbar /><div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
    </div></>
  );

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

              {/* Image Upload / Preview */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
                  Property Image
                </label>

                <AnimatePresence mode="wait">
                  {imagePreview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 200 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)"
                      }} />
                      <button
                        type="button"
                        onClick={removeImage}
                        style={{
                          position: "absolute", top: 10, right: 10,
                          background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
                          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "#fff"
                        }}
                      >
                        <X size={15} />
                      </button>
                      <div style={{ position: "absolute", bottom: 10, left: 12 }}>
                        <p style={{ color: "#fff", fontSize: "0.78rem", fontWeight: 500 }}>
                          {imageFile ? imageFile.name : "Current image"}
                        </p>
                        <p
                          style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", cursor: "pointer", marginTop: 2 }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Click to replace →
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dropzone"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 12, padding: "36px 24px",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                        cursor: "pointer",
                        background: dragOver ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: "rgba(99,102,241,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <UploadCloud size={24} color="var(--accent)" />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 4 }}>Drop a new image here</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                          or <span style={{ color: "var(--accent)", fontWeight: 600 }}>click to browse</span> · PNG, JPG, WEBP
                        </p>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 14px", marginTop: 4
                      }}>
                        <ImageIcon size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No image set — upload one now</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </div>

              {/* Text Fields */}
              {textFields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{label}</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}

              {/* Description */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button className="btn-primary" type="submit" disabled={saving} style={{ marginTop: 8, width: "100%" }}>
                {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  );
}
