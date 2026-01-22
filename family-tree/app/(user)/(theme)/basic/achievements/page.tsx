"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import styles from "./achievements.module.css";
import Image from "next/image";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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

  /* ================= AUTH FETCH ================= */
  const authFetch = useCallback(async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, { ...init, credentials: "include" });
    if (res.status === 401) {
      router.replace("/auth/login");
      throw new Error("Session expired");
    }
    return res;
  }, [router]);

  /* ================= LOAD ================= */
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/achievements", { method: "GET" });
        let data;
        try { data = await res.json(); } catch { data = []; }

        if (!res.ok) throw new Error(data?.error || "Failed to load achievements");
        setAchievements(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Load error:", err);
        showToast(err.message || "Failed to load achievements", "error");
        setAchievements([]);
      }
    })();
  }, [authFetch]);

  /* ================= FILTER ================= */
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
    achievements.forEach((a) => (counts[a.person] = (counts[a.person] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [achievements]);

  /* ================= IMAGE ================= */
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    if (form.image_path?.startsWith("blob:")) {
      URL.revokeObjectURL(form.image_path);
    }

    const reader = new FileReader();
    reader.onload = () =>
      setForm((p) => ({ ...p, image_path: reader.result as string }));
    reader.readAsDataURL(file);
  };

  /* ================= SERVER IMAGE UPLOAD ================= */
  const uploadImageToSupabase = async () => {
  if (!imageFile) return form.image_path; // keep existing

  const fd = new FormData();
  fd.append("file", imageFile);

  const res = await fetch("/api/achievements/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) throw new Error(data?.error || "Upload failed");

  return data.url ?? form.image_path ?? null;
};

  /* ================= SUBMIT (CREATE / UPDATE) ================= */
  const handleSubmit = async () => {
  if (!form.title || !form.person || !form.detail) {
    showToast("Please fill all required fields.", "error");
    return;
  }

  try {
    // Upload new image if selected
    const imageUrl = await uploadImageToSupabase();

    // Prepare payload
    const payload: any = {
      ...form,
      image_path: imageUrl ?? form.image_path ?? null,
    };

    // Only include old_image_path when updating
    if (editingId) {
      const current = achievements.find(a => a.id === editingId);
      if (current?.image_path) {
        payload.old_image_path = current.image_path;
      }
    }

    // Determine API method & URL
    const url = editingId ? `/api/achievements/${editingId}` : "/api/achievements";
    const method = editingId ? "PATCH" : "POST";

    const res = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: any;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) throw new Error(data?.error || "Submission failed");

    setAchievements(prev =>
      editingId
        ? prev.map(a => (a.id === editingId ? data : a))
        : [data, ...prev]
    );

    showToast(editingId ? "Achievement updated." : "Achievement added.", "success");
    resetModal();
  } catch (err: any) {
    console.error("Submit error:", err);
    showToast(err.message || "Submission failed.", "error");
  }
};



  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
  if (!id) {
    showToast("Missing achievement ID.", "error");
    return;
  }

  try {
    const res = await authFetch(`/api/achievements/${id}`, { method: "DELETE" });

    let data: any;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok || data?.error) throw new Error(data?.error || "Delete failed");

    setAchievements(prev => prev.filter(a => a.id !== id));
    showToast("Achievement deleted.", "success");
  } catch (err: any) {
    console.error("Delete error:", err);
    showToast(err.message || "Delete failed.", "error");
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
            <motion.article key={a.id} className={styles.card} whileHover={{ scale: 1.01 }}>
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
              {categories.filter((c) => c !== "All").map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={form.badge}
              onChange={(e) =>
                setForm({ ...form, badge: e.target.value as Achievement["badge"] })
              }
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
