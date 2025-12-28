"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import styles from "./achievements.module.css";
import Image from "next/image";
import { Star } from "lucide-react";

/* ================= TYPES ================= */

type Achievement = {
  id: string;
  title: string;
  person: string;
  year: number;
  category: string;
  badge: "gold" | "silver" | "bronze";
  img: string | null;
  detail: string;
};

type ToastType = "success" | "error" | "info";

/* ================= SAMPLE DATA ================= */

const sample: Achievement[] = [
  {
    id: "a1",
    title: "MBA Graduate",
    person: "Oluchi",
    year: 2020,
    category: "Academics",
    badge: "gold",
    img: null,
    detail: "Completed MBA with distinction.",
  },
  {
    id: "a2",
    title: "National Champion (Athletics)",
    person: "Chima",
    year: 2018,
    category: "Sports",
    badge: "gold",
    img: null,
    detail: "Won national 400m.",
  },
  {
    id: "a3",
    title: "Community Award",
    person: "Ngozi",
    year: 2022,
    category: "Community",
    badge: "silver",
    img: null,
    detail: "Led community empowerment projects.",
  },
];

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
  const [achievements, setAchievements] = useState<Achievement[]>(sample);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Achievement, "id">>({
    title: "",
    person: "",
    year: new Date().getFullYear(),
    category: "Academics",
    badge: "bronze",
    img: null,
    detail: "",
  });

  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");

  /* ================= TOAST ================= */

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");

  const showToast = (msg: string, type: ToastType) => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ================= FILTERING + SEARCH ================= */

  const filtered = useMemo(() => {
    return achievements.filter(
      (a) =>
        (filter === "All" || a.category === filter) &&
        `${a.title} ${a.person} ${a.year}`
          .toLowerCase()
          .includes(q.toLowerCase())
    );
  }, [achievements, filter, q]);

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

  /* ================= IMAGE UPLOAD ================= */

  const handleImageUpload = (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, img: reader.result as string }));
      };
      reader.onerror = () => {
        showToast("Unable to preview selected image.", "error");
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("Image preview failed.", "error");
    }
  };

  /* ================= SUBMIT (CREATE / EDIT) ================= */

  const handleSubmit = () => {
    if (!form.title || !form.person || !form.detail) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (editingId) {
      setAchievements((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...form } : a))
      );
      showToast("Achievement updated.", "success");
    } else {
      setAchievements((prev) => [
        { id: crypto.randomUUID(), ...form },
        ...prev,
      ]);
      showToast("Achievement added.", "success");
    }

    resetModal();
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({
      title: "",
      person: "",
      year: new Date().getFullYear(),
      category: "Academics",
      badge: "bronze",
      img: null,
      detail: "",
    });
  };

  /* ================= DELETE ================= */

  const handleDelete = (id: string) => {
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
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setQ("")}
            >
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

                {a.img && (
                  <Image className={styles.cardImage} src={a.img} alt={a.title} width={150} height={150} />
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

                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(a.id)}
                  >
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

            <button
              className={styles.cta}
              onClick={() => setShowModal(true)}
            >
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
                setForm({
                  ...form,
                  badge: e.target.value as Achievement["badge"],
                })
              }
            >
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files && handleImageUpload(e.target.files[0])
              }
            />

            {form.img && (
              <Image className={styles.modalImage} src={form.img} alt="Preview" width={100} height={100} />
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
