"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./memorials.module.css";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */
type Memorial = {
  id: string;
  name: string;
  born: number;
  died: number;
  tribute: string;
  bio: string;
  picture: string | null;
  candle_count?: number; // <-- include candle_count
};

type CandleMap = Record<string, number>;
type ToastType = "success" | "error" | "info";

/* ================= COMPONENT ================= */
export default function MemorialsPage() {
  const router = useRouter();

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [candles, setCandles] = useState<CandleMap>({});
  const [query, setQuery] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    born: "",
    died: "",
    tribute: "",
    bio: "",
    picture: null as string | null,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");

  /* ================= TOAST ================= */
  const showToast = (msg: string, type: ToastType = "info") => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ================= AUTH FETCH ================= */
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, { ...init, credentials: "include" });
    if (res.status === 401) {
      router.replace("/auth/login");
      throw new Error("Session expired");
    }
    return res;
  };

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/memorials");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error);

        setMemorials(data ?? []);

        // Initialize candle counts
        const candleMap: CandleMap = {};
        data.forEach((m: any) => {
          candleMap[m.id] = m.candle_count ?? 0;
        });
        setCandles(candleMap);
      } catch (err: any) {
        console.error(err);
        showToast("Failed to load memorials", "error");
      }
    })();
  }, []);

  /* ================= IMAGE ================= */
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () =>
      setForm((p) => ({ ...p, picture: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return form.picture;

    const fd = new FormData();
    fd.append("file", imageFile);

    const res = await authFetch("/api/memorials/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");

    return data.url ?? null;
  };

  /* ================= SAVE ================= */
const saveMemorial = async () => {
  if (!form.name || !form.born || !form.died || !form.tribute || !form.bio) {
    showToast("Please fill all required fields.", "error");
    return;
  }

  try {
    const pictureUrl = await uploadImage();

    const payload: any = {
      name: form.name,
      born: Number(form.born),
      died: Number(form.died),
      tribute: form.tribute,
      bio: form.bio,
      picture: pictureUrl,
    };

    if (editingId) {
      const current = memorials.find((m) => m.id === editingId);
      if (current?.picture) payload.old_picture = current.picture;
    }

    const url = editingId ? `/api/memorials/${editingId}` : "/api/memorials";
    const method = editingId ? "PATCH" : "POST";

    const res = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Always parse JSON safely
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) throw new Error(data?.error || "Save failed");

    // Update memorials state
    setMemorials((prev) =>
      editingId
        ? prev.map((m) => (m.id === editingId ? { ...m, ...data } : m))
        : [data, ...prev]
    );

    showToast(editingId ? "Memorial updated." : "Memorial added.", "success");
    resetModal();
  } catch (err: any) {
    console.error(err);
    showToast(err.message || "Save failed", "error");
  }
};

/* ================= DELETE ================= */
const deleteMemorial = async (id: string) => {
  if (!id) return showToast("Invalid memorial ID", "error");

  try {
    const res = await authFetch(`/api/memorials/${id}`, { method: "DELETE" });

    // Parse JSON safely
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) throw new Error(data?.error || "Delete failed");

    // Remove memorial from state
    setMemorials((prev) => prev.filter((m) => m.id !== id));
    setCandles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    showToast("Memorial deleted.", "success");
  } catch (err: any) {
    console.error(err);
    showToast(err.message || "Delete failed", "error");
  }
};


  /* ================= LIGHT CANDLE ================= */
  const lightCandle = async (id: string) => {
    if (!id) return showToast("Invalid memorial ID", "error");

    const nextCount = (candles[id] || 0) + 1;

    // Optimistic UI
    setCandles((prev) => ({ ...prev, [id]: nextCount }));

    try {
      const res = await authFetch(`/api/memorials/${id}/candles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: nextCount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);

      // Persisted count
      setCandles((prev) => ({ ...prev, [id]: data.count ?? nextCount }));

      showToast("Candle lit successfully", "success");
    } catch (err: any) {
      console.error("Candle update failed:", err);
      setCandles((prev) => ({ ...prev, [id]: prev[id] || 0 }));
      showToast("Failed to light candle", "error");
    }
  };

  /* ================= HELPERS ================= */
  const resetModal = () => {
    setShowAdd(false);
    setEditingId(null);
    setImageFile(null);
    setForm({ name: "", born: "", died: "", tribute: "", bio: "", picture: null });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return memorials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        String(m.born).includes(q) ||
        String(m.died).includes(q)
    );
  }, [query, memorials]);

  /* ================= RENDER ================= */
  return (
    <main className={styles.page}>
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastType]}`}>
          <p>{toastMessage}</p>
        </div>
      )}

      {/* HERO */}
      <section className={styles.hero}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={styles.title}>Memorials — Forever in Our Hearts</h1>
          <p className={styles.lead}>
            Create tributes, leave messages, and light a virtual candle.
          </p>
        </motion.div>
      </section>

      {/* SEARCH */}
      <section className={styles.searchWrap}>
        <input
          placeholder="Search by name or year"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className={styles.cta} onClick={() => setShowAdd(true)}>
          + Add Memorial
        </button>
      </section>

      {/* GRID */}
      <section className={styles.grid}>
        {filtered.map((m) => (
          <motion.article key={m.id} className={styles.card} whileHover={{ scale: 1.02 }}>
            <div className={styles.cardImage}>
              {m.picture ? (
                <Image src={m.picture} alt={m.name} width={500} height={500} />
              ) : (
                <Image
                  src="/images/image-placeholder-removebg-preview (1).png"
                  alt="Placeholder"
                  width={500}
                  height={500}
                />
              )}
            </div>

            <div className={styles.cardBody}>
              <h3>{m.name}</h3>
              <p className={styles.muted}>{m.born} — {m.died}</p>
              <p>{m.tribute}</p>

              <div className={styles.cardActions}>
                <Link href={`/basic/memorials/${m.id}`} className={styles.cta}>
                  View
                </Link>
                <button onClick={() => { setEditingId(m.id); setForm({ ...m, born: String(m.born), died: String(m.died) }); setShowAdd(true); }}>
                  Edit
                </button>
                <button onClick={() => deleteMemorial(m.id)}>Delete</button>
                <button className={styles.candleBtn} onClick={() => lightCandle(m.id)}>
                  🕯 {candles[m.id] ?? 0}
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className={styles.modalBack} onClick={resetModal}>
            <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? "Edit Memorial" : "Add Memorial"}</h3>

              <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input type="number" placeholder="Year born" value={form.born} onChange={(e) => setForm({ ...form, born: e.target.value })} />
              <input type="number" placeholder="Year died" value={form.died} onChange={(e) => setForm({ ...form, died: e.target.value })} />
              <input placeholder="Short tribute" value={form.tribute} onChange={(e) => setForm({ ...form, tribute: e.target.value })} />
              <textarea placeholder="Biography" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

              <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />

              <div className={styles.modalActions}>
                <button onClick={resetModal}>Cancel</button>
                <button className={styles.cta} onClick={saveMemorial}>
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
