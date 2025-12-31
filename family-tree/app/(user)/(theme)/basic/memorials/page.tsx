"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./memorials.module.css";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type Memorial = {
  id: string;
  name: string;
  born: number;
  died: number;
  tribute: string;
  bio: string;
  picture?: string | null;
  user_id?: string;
};

type Candle = {
  memorial_id: string;
  count: number;
};

type Message = {
  memorial_id: string;
  message: string;
};

type CandleMap = Record<string, number>;
type MessageMap = Record<string, string[]>;
type ToastType = "success" | "error" | "info";

export default function MemorialsPage() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [query, setQuery] = useState("");
  const [candles, setCandles] = useState<CandleMap>({});
  const [messages, setMessages] = useState<MessageMap>({});
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    born: "",
    died: "",
    tribute: "",
    bio: "",
    picture: null as File | string | null,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");

  const showToast = (message: string, type: ToastType = "info") => {
    setToastType(type);
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ---------------- Load Memorials, Candles, Messages ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load memorials
        const { data: memData, error: memError } = await supabase
          .from("memorials")
          .select("*")
          .order("created_at", { ascending: false });
        if (memError) throw memError;
        if (memData) setMemorials(memData as Memorial[]);

        // Load candles
        const { data: candleData, error: candleError } = await supabase
          .from("memorial_candles")
          .select("*");
        if (candleError) throw candleError;
        const candleMap: CandleMap = {};
        candleData?.forEach((c: Candle) => {
          candleMap[c.memorial_id] = c.count;
        });
        setCandles(candleMap);

        // Load messages
        const { data: msgData, error: msgError } = await supabase
          .from("memorial_messages")
          .select("*");
        if (msgError) throw msgError;
        const msgMap: MessageMap = {};
        msgData?.forEach((m: Message) => {
          if (!msgMap[m.memorial_id]) msgMap[m.memorial_id] = [];
          msgMap[m.memorial_id].push(m.message);
        });
        setMessages(msgMap);
      } catch (err) {
          console.error("Error fetching data:", err instanceof Error ? err.message : err);
          showToast("Failed to load data", "error");
        }
    };
    fetchData();
  }, []);

  /* ---------------- Helpers ---------------- */
  const handleImageUpload = (file: File) => {
    setForm((prev) => ({ ...prev, picture: file }));
  };

  const uploadImageToSupabase = async (file: File) => {
    const filePath = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage
      .from("memorial-images")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("memorial-images").getPublicUrl(filePath);
    return data.publicUrl!;
  };

  const saveMemorial = async () => {
    const { name, born, died, tribute, bio, picture } = form;
    if (!name || !born || !died || !tribute || !bio) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return showToast("You must be logged in to save memorials", "error");

      let pictureUrl: string | null = null;
      if (picture instanceof File) pictureUrl = await uploadImageToSupabase(picture);
      else if (typeof picture === "string") pictureUrl = picture;

      const payload = {
        name,
        born: Number(born),
        died: Number(died),
        tribute,
        bio,
        picture: pictureUrl,
        user_id: session.user.id,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("memorials")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();
        if (error) return showToast("Failed to update memorial", "error");
        setMemorials((prev) => prev.map((m) => (m.id === editingId ? data : m)));
        showToast("Memorial updated successfully", "success");
      } else {
        const { data, error } = await supabase.from("memorials").insert(payload).select().single();
        if (error) return showToast("Failed to add memorial", "error");
        setMemorials((prev) => [data, ...prev]);
        showToast("Memorial added successfully", "success");
      }

      setShowAdd(false);
      setEditingId(null);
      setForm({ name: "", born: "", died: "", tribute: "", bio: "", picture: null });
    } catch (err) {
      console.error(err);
      showToast("Unexpected error while saving memorial", "error");
    }
  };

  const deleteMemorial = async (id: string) => {
    try {
      const { error } = await supabase.from("memorials").delete().eq("id", id);
      if (error) return showToast("Failed to delete memorial", "error");

      // Delete related candles & messages
      await supabase.from("memorial_candles").delete().eq("memorial_id", id);
      await supabase.from("memorial_messages").delete().eq("memorial_id", id);

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

      showToast("Memorial deleted successfully", "success");
    } catch {
      showToast("Unexpected error deleting memorial", "error");
    }
  };

  const lightCandle = async (id: string) => {
  const nextCount = (candles[id] || 0) + 1;

  // optimistic UI (keep this)
  setCandles((prev) => ({ ...prev, [id]: nextCount }));

  const { error } = await supabase
    .from("memorial_candles")
    .upsert(
      {
        memorial_id: id,
        count: nextCount,
      },
      {
        onConflict: "memorial_id",
      }
    );

  if (error) {
    console.error("Candle update failed:", error.message);

    // rollback UI if DB failed
    setCandles((prev) => ({ ...prev, [id]: prev[id] || 0 }));

    showToast("Failed to light candle", "error");
    return;
  }

  showToast("Candle lit successfully", "success");
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

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", born: "", died: "", tribute: "", bio: "", picture: null });
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
      {toastMessage && <div className={`${styles.toast} ${styles[toastType]}`}><p>{toastMessage}</p></div>}

      <section className={styles.hero}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={styles.title}>Memorials — Forever in Our Hearts</h1>
          <p className={styles.lead}>Create tributes, leave messages, and light a virtual candle.</p>
        </motion.div>
      </section>

      <section className={styles.searchWrap}>
        <div className={styles.searchField}>
          <input className={styles.searchInner} placeholder="Search by name or year" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button type="button" className={styles.clearSearch} onClick={() => setQuery("")}>×</button>}
        </div>
        <button type="button" className={styles.cta} onClick={openAdd}>+ Add Memorial</button>
      </section>

      <section className={styles.grid}>
        {filtered.map((m) => (
          <motion.article key={m.id} className={styles.card} whileHover={{ scale: 1.02 }}>
            <div className={styles.cardImage}>
              {m.picture ? (
                <Image src={typeof m.picture === "string" ? m.picture : URL.createObjectURL(m.picture)} alt={m.name} width={500} height={500} />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <Image src="/images/image-placeholder-removebg-preview (1).png" alt="Image Placeholder" width={500} height={500} />
                </div>
              )}
            </div>

            <div className={styles.cardBody}>
              <h3>{m.name}</h3>
              <p className={styles.muted}>{m.born} — {m.died}</p>
              <p>{m.tribute}</p>
              <div className={styles.cardActions}>
                <Link href={`/memorials/${m.id}`} prefetch={false} className={styles.cta}>View</Link>
                <button className={styles.ghost} onClick={() => openEdit(m)}>Edit</button>
                <button className={styles.ghost} onClick={() => deleteMemorial(m.id)}>Delete</button>
                <button className={styles.candleBtn} onClick={() => lightCandle(m.id)}>🕯 {candles[m.id] || 0}</button>
              </div>
            </div>
          </motion.article>
        ))}
      </section>

      <AnimatePresence>
        {showAdd && (
          <motion.div className={styles.modalBack} onClick={() => setShowAdd(false)}>
            <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}>
              <h3>{editingId ? "Edit Memorial" : "Add Memorial"}</h3>

              <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Year born" type="number" value={form.born} onChange={(e) => setForm({ ...form, born: e.target.value })} />
              <input placeholder="Year died" type="number" value={form.died} onChange={(e) => setForm({ ...form, died: e.target.value })} />
              <input placeholder="Short tribute" value={form.tribute} onChange={(e) => setForm({ ...form, tribute: e.target.value })} />
              <textarea placeholder="Full biography" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

              <label className={styles.upload}>
                Upload photo
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
              </label>

              {form.picture && (
                <Image src={typeof form.picture === "string" ? form.picture : URL.createObjectURL(form.picture)} className={styles.preview} alt="Preview" width={0} height={0} />
              )}

              <div className={styles.modalActions}>
                <button className={styles.ghost} onClick={() => setShowAdd(false)}>Cancel</button>
                <button className={styles.cta} onClick={saveMemorial}>{editingId ? "Save Changes" : "Save Memorial"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
