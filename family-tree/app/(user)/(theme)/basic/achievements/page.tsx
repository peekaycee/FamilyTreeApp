"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./achievements.module.css";
import Image from "next/image";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */
type Achievement = {
  id: string;
  title: string;
  person: string;
  year: number;
  category: string;
  badge: "gold" | "silver" | "bronze";
  image_path: string | null;
  detail: string;
  created_by?: string | null;
  user_id?: string | null;
};

type ToastType = "success" | "error" | "info";

const categories = [
  "All",
  "Academics",
  "Sports",
  "Arts",
  "Community",
  "Entrepreneurship",
];

/* ================= COMPONENT ================= */
export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Achievement, "id">>({
    title: "",
    person: "",
    year: new Date().getFullYear(),
    category: "Academics",
    badge: "bronze",
    image_path: null,
    detail: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");

  /* ================= TOAST ================= */
  const showToast = (msg: string, type: ToastType) => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ================= LOAD FROM SUPABASE ================= */
  useEffect(() => {
    supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setAchievements(data as Achievement[]);
      });
  }, []);

  /* ================= FILTER + SEARCH ================= */
  const filtered = useMemo(
    () =>
      achievements.filter(
        (a) =>
          (filter === "All" || a.category === filter) &&
          `${a.title} ${a.person} ${a.year}`
            .toLowerCase()
            .includes(q.toLowerCase())
      ),
    [achievements, filter, q]
  );

  /* ================= LEADERBOARD ================= */
  const leaderboard = useMemo(() => {
    const counts: Record<string, number> = {};
    achievements.forEach(
      (a) => (counts[a.person] = (counts[a.person] || 0) + 1)
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [achievements]);

  /* ================= IMAGE PREVIEW ================= */
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () =>
      setForm((prev) => ({ ...prev, image_path: reader.result as string }));
    reader.onerror = () => showToast("Unable to preview image.", "error");
    reader.readAsDataURL(file);
  };

  /* ================= IMAGE UPLOAD ================= */
  const uploadImageToSupabase = async () => {
    if (!imageFile) return null;

    const filePath = `${crypto.randomUUID()}-${imageFile.name}`;
    const { error } = await supabase.storage
      .from("achievements")
      .upload(filePath, imageFile, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Image upload error:", error.message);
      throw new Error("Image upload failed");
    }

    const { data } = supabase.storage
      .from("achievements")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.title || !form.person || !form.detail) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showToast("You must be logged in to submit an achievement.", "error");
        return;
      }

      const imageUrl = await uploadImageToSupabase();

      const payload: Omit<Achievement, "id"> & { created_by: string; user_id: string; image_path?: string | null } = {
        title: form.title,
        person: form.person,
        year: form.year,
        category: form.category,
        badge: form.badge,
        image_path: imageUrl ?? form.image_path ?? null,
        detail: form.detail,
        created_by: session.user.id,
        user_id: session.user.id,
      };

      let data, error;
      if (editingId) {
        ({ data, error } = await supabase
          .from("achievements")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from("achievements")
          .insert(payload)
          .select()
          .single());
      }

      if (error) {
        console.error("Supabase insert/update error:", error);
        showToast(error.message, "error");
        return;
      }

      setAchievements((prev) =>
        editingId ? prev.map((a) => (a.id === editingId ? data : a)) : [data, ...prev]
      );

      showToast(editingId ? "Achievement updated." : "Achievement added.", "success");
      resetModal();
    } catch (err) {
      console.error("Submission error:", err);
      showToast("Submission failed.", "error");
    }
  };

  /* ================= RESET MODAL ================= */
  const resetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImageFile(null);
    setForm({
      title: "",
      person: "",
      year: new Date().getFullYear(),
      category: "Academics",
      badge: "bronze",
      image_path: null,
      detail: "",
    });
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    await supabase.from("achievements").delete().eq("id", id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    showToast("Achievement deleted.", "success");
  };

  /* ================= RENDER ================= */
  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={styles.title}>Achievements</h1>
          <p className={styles.lead}>
            Celebrate academic, sporting and life milestones across the family.
          </p>
        </motion.div>
      </section>

      {/* CONTROLS */}
      <section className={styles.controls}>
        <div className={styles.searchWrap}>
          <input
            placeholder="Search achievements"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className={styles.clearBtn} onClick={() => setQ("")}>
              ×
            </button>
          )}
        </div>

        <div className={styles.filterRow}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={filter === c ? styles.active : ""}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section className={styles.grid}>
        <div className={styles.gridLeft}>
          {filtered.map((a) => (
            <motion.article
              key={a.id}
              className={styles.card}
              whileHover={{ scale: 1.01 }}
            >
              <div className={styles.cardLeft}>
                <div className={`${styles.badge} ${styles[a.badge]}`}>
                  <Star size={16} />
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3>{a.title}</h3>
                <p className={styles.muted}>
                  {a.person} • {a.year}
                </p>

                {a.image_path && (
                  <Image
                    className={styles.cardImage}
                    src={a.image_path}
                    alt={a.title}
                    width={150}
                    height={150}
                  />
                )}

                <p>{a.detail}</p>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => {
                      setEditingId(a.id);
                      setForm({ ...a });
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>

                  <button className={styles.deleteBtn} onClick={() => handleDelete(a.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.leader}>
            <h4>Top Achievers</h4>
            <ol>
              {leaderboard.map(([person, count]) => (
                <li key={person}>
                  <strong>{person}</strong>{" "}
                  <span className={styles.muted}>({count})</span>
                </li>
              ))}
            </ol>

            <button className={styles.cta} onClick={() => setShowModal(true)}>
              Submit an Achievement
            </button>
          </div>
        </aside>
      </section>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={resetModal}>
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editingId ? "Edit Achievement" : "Submit Achievement"}</h3>

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <input
              placeholder="Person"
              value={form.person}
              onChange={(e) => setForm({ ...form, person: e.target.value })}
            />

            <input
              type="number"
              placeholder="Year"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories
                .filter((c) => c !== "All")
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>

            <select
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value as Achievement["badge"] })}
            >
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
            />

            {form.image_path && (
              <Image
                className={styles.modalImage}
                src={form.image_path}
                alt="Preview"
                width={100}
                height={100}
              />
            )}

            <textarea
              placeholder="Achievement details"
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
            />

            <div className={styles.modalActions}>
              <button type="button" onClick={resetModal}>
                Cancel
              </button>
              <button type="button" className={styles.cta} onClick={handleSubmit}>
                {editingId ? "Update" : "Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* TOAST */}
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastType]}`}>
          <p>{toastMessage}</p>
        </div>
      )}
    </main>
  );
}
