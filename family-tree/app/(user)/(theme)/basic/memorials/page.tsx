/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./memorials.module.css";
import Link from "next/link";
import Image from "next/image";

/* ---------------- Types ---------------- */

type Memorial = {
  id: string;
  name: string;
  born: number;
  died: number;
  tribute: string;
  bio: string;
  picture?: string | null;
};

type CandleMap = Record<string, number>;
type MessageMap = Record<string, string[]>;
type ToastType = "success" | "error" | "info";

/* ---------------- Component ---------------- */

export default function MemorialsPage() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [query, setQuery] = useState("");

  const [candles, setCandles] = useState<CandleMap>({});
  const [messages, setMessages] = useState<MessageMap>({});

  /* Modal state */
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    born: "",
    died: "",
    tribute: "",
    bio: "",
    picture: null as string | null,
  });

  /* Toast state */
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");

  /* ---------------- Toast Helper ---------------- */

  const showToast = (message: string, type: ToastType = "info") => {
    setToastType(type);
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  /* ---------------- Persistence ---------------- */

  useEffect(() => {
    const savedMemorials = localStorage.getItem("ft_memorials");
    const savedCandles = localStorage.getItem("ft_candles");
    const savedMessages = localStorage.getItem("ft_memorial_msgs");

    if (savedMemorials) setMemorials(JSON.parse(savedMemorials));
    if (savedCandles) setCandles(JSON.parse(savedCandles));
    if (savedMessages) setMessages(JSON.parse(savedMessages));
  }, []);

  useEffect(() => {
    localStorage.setItem("ft_memorials", JSON.stringify(memorials));
  }, [memorials]);

  useEffect(() => {
    localStorage.setItem("ft_candles", JSON.stringify(candles));
  }, [candles]);

  useEffect(() => {
    localStorage.setItem("ft_memorial_msgs", JSON.stringify(messages));
  }, [messages]);

  /* Prevent image URL leaks */
  useEffect(() => {
    return () => {
      if (form.picture?.startsWith("blob:")) {
        URL.revokeObjectURL(form.picture);
      }
    };
  }, [form.picture]);

  /* ---------------- Helpers ---------------- */

  const handleImageUpload = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, picture: previewUrl }));
  };

  /* ---------------- Derived ---------------- */

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return memorials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        String(m.born).includes(q) ||
        String(m.died).includes(q)
    );
  }, [query, memorials]);

  /* ---------------- Actions ---------------- */

  const lightCandle = (id: string) => {
    try {
      setCandles((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      showToast("Candle lit successfully.", "success");
    } catch {
      showToast("Failed to light candle.", "error");
    }
  };

  const deleteMemorial = (id: string) => {
    try {
      setMemorials((prev) => prev.filter((m) => m.id !== id));

      setCandles((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setMessages((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      showToast("Memorial deleted successfully.", "success");
    } catch {
      showToast("Failed to delete memorial.", "error");
    }
  };

  const saveMemorial = () => {
    const { name, born, died, tribute, bio, picture } = form;

    if (!name || !born || !died || !tribute || !bio) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    try {
      if (editingId) {
        setMemorials((prev) =>
          prev.map((m) =>
            m.id === editingId
              ? {
                  ...m,
                  name,
                  born: Number(born),
                  died: Number(died),
                  tribute,
                  bio,
                  picture,
                }
              : m
          )
        );
        showToast("Memorial updated successfully.", "success");
      } else {
        setMemorials((prev) => [
          {
            id: crypto.randomUUID(),
            name,
            born: Number(born),
            died: Number(died),
            tribute,
            bio,
            picture,
          },
          ...prev,
        ]);
        showToast("Memorial added successfully.", "success");
      }

      setShowAdd(false);
      setEditingId(null);
    } catch {
      showToast("An error occurred while saving the memorial.", "error");
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: "",
      born: "",
      died: "",
      tribute: "",
      bio: "",
      picture: null,
    });
    setShowAdd(true);
  };

  const openEdit = (m: Memorial) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      born: String(m.born),
      died: String(m.died),
      tribute: m.tribute,
      bio: m.bio,
      picture: m.picture || null,
    });
    setShowAdd(true);
  };

  /* ---------------- Render ---------------- */

  return (
    <main className={styles.page}>
      {/* TOAST */}
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

      {/* SEARCH + ADD */}
      <section className={styles.searchWrap}>
        <div className={styles.searchField}>
          <input
            className={styles.searchInner}
            placeholder="Search by name or year"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setQuery("")}
            >
              ×
            </button>
          )}
        </div>

        <button type="button" className={styles.cta} onClick={openAdd}>
          + Add Memorial
        </button>
      </section>

      {/* GRID */}
      <section className={styles.grid}>
        {filtered.map((m) => (
          <motion.article key={m.id} className={styles.card} whileHover={{ scale: 1.02 }}>
            <div className={styles.cardImage}>
              {m.picture ? (
                <Image src={m.picture} alt={m.name} width={0} height={0} />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <Image
                    src="/images/image-placeholder-removebg-preview (1).png"
                    alt="Image Placeholder"
                    width={500}
                    height={500}
                  />
                </div>
              )}
            </div>

            <div className={styles.cardBody}>
              <h3>{m.name}</h3>
              <p className={styles.muted}>
                {m.born} — {m.died}
              </p>
              <p>{m.tribute}</p>

              <div className={styles.cardActions}>
                <Link href={`/memorials/${m.id}`} prefetch={false} className={styles.cta}>
                  View
                </Link>

                <button className={styles.ghost} onClick={() => openEdit(m)}>
                  Edit
                </button>

                <button className={styles.ghost} onClick={() => deleteMemorial(m.id)}>
                  Delete
                </button>

                <button className={styles.candleBtn} onClick={() => lightCandle(m.id)}>
                  🕯 {candles[m.id] || 0}
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </section>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className={styles.modalBack} onClick={() => setShowAdd(false)}>
            <motion.div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
            >
              <h3>{editingId ? "Edit Memorial" : "Add Memorial"}</h3>

              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                placeholder="Year born"
                type="number"
                value={form.born}
                onChange={(e) => setForm({ ...form, born: e.target.value })}
              />

              <input
                placeholder="Year died"
                type="number"
                value={form.died}
                onChange={(e) => setForm({ ...form, died: e.target.value })}
              />

              <input
                placeholder="Short tribute"
                value={form.tribute}
                onChange={(e) => setForm({ ...form, tribute: e.target.value })}
              />

              <textarea
                placeholder="Full biography"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />

              <label className={styles.upload}>
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleImageUpload(e.target.files[0])
                  }
                />
              </label>

              {form.picture && (
                <Image
                  src={form.picture}
                  className={styles.preview}
                  alt="Preview"
                  width={0}
                  height={0}
                />
              )}

              <div className={styles.modalActions}>
                <button className={styles.ghost} onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button className={styles.cta} onClick={saveMemorial}>
                  {editingId ? "Save Changes" : "Save Memorial"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
