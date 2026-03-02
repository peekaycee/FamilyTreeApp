"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./memorialDetail.module.css";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  message: string;
  created_at: string;
  author: string;
  user_id: string | null;
};

type Memorial = {
  id: string;
  name: string;
  born: number;
  died: number;
  tribute: string;
  bio: string;
  picture: string | null;
  user_id: string;
  candle_count: number;
  memorial_messages: Message[];
};

type ToastType = "success" | "error" | "info";

export default function MemorialDetailClient({
  initialMemorial,
}: {
  initialMemorial: Memorial;
}) {
  const [memorial, setMemorial] = useState<Memorial>(initialMemorial);
  const [newMessage, setNewMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  /* ================= TOAST ================= */
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");
  const showToast = (msg: string, type: ToastType = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemorial({
      ...initialMemorial,
      candle_count: Number(initialMemorial.candle_count ?? 0),
    });
  }, [initialMemorial]);

  useEffect(() => {
    const channel = supabase
      .channel(`memorial-messages-${memorial.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "memorial_messages",
          filter: `memorial_id=eq.${memorial.id}`,
        },
        async () => {
          const refresh = await fetch(`/api/memorials/${memorial.id}`);
          if (refresh.ok) {
            const fresh = await refresh.json();
            setMemorial((prev) => ({
              ...prev,
              memorial_messages: fresh.memorial_messages ?? prev.memorial_messages,
              candle_count: prev.candle_count,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memorial.id]);

  /* ================= CANDLE ================= */
  const lightCandle = async () => {
    setMemorial((prev) => ({
      ...prev,
      candle_count: Number(prev.candle_count ?? 0) + 1,
    }));

    const res = await fetch(`/api/memorials/${memorial.id}/candles`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      setMemorial((prev) => ({
        ...prev,
        candle_count: Number(data.count ?? prev.candle_count),
      }));
      showToast("Candle lit successfully!", "success");
    } else {
      setMemorial((prev) => ({
        ...prev,
        candle_count: Math.max(Number(prev.candle_count ?? 1) - 1, 0),
      }));
      showToast("Failed to light candle", "error");
    }
  };

  /* ================= ADD MESSAGE ================= */
  const addMessage = async () => {
    if (!newMessage.trim() || !authorName.trim()) {
      showToast("Please enter your name and message", "error");
      return;
    }

    const snapshot = memorial.memorial_messages;
    setLoading(true);

    const tempMessage: Message = {
      id: crypto.randomUUID(),
      message: newMessage,
      created_at: new Date().toISOString(),
      author: authorName,
      user_id: null,
    };

    setMemorial((prev) => ({
      ...prev,
      memorial_messages: [...prev.memorial_messages, tempMessage],
    }));

    const res = await fetch(`/api/memorials/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memorial_id: memorial.id,
        message: newMessage,
        author: authorName,
      }),
    });

    if (!res.ok) {
      setMemorial((prev) => ({
        ...prev,
        memorial_messages: snapshot,
      }));
      showToast("Failed to add message", "error");
      setLoading(false);
      return;
    }

    setNewMessage("");
    setAuthorName("");
    setEditingMessageId(null);

    const refresh = await fetch(`/api/memorials/${memorial.id}`);
    if (refresh.ok) {
      const freshMemorial = await refresh.json();
      setMemorial((prev) => ({
        ...prev,
        memorial_messages: freshMemorial.memorial_messages ?? prev.memorial_messages,
        candle_count: prev.candle_count,
      }));
    }

    showToast("Message added successfully!", "success");
    setLoading(false);
  };

  /* ================= DELETE MESSAGE ================= */
  const deleteMessage = async (id: string) => {
    // if (!confirm("Are you sure you want to delete this message?")) return;

    const snapshot = memorial.memorial_messages;

    setMemorial((prev) => ({
      ...prev,
      memorial_messages: prev.memorial_messages.filter((m) => m.id !== id),
    }));

    const res = await fetch(`/api/memorials/messages/${id}`, { method: "DELETE" });

    if (!res.ok) {
      setMemorial((prev) => ({
        ...prev,
        memorial_messages: snapshot,
      }));
      showToast("Failed to delete message", "error");
    } else {
      showToast("Message deleted successfully!", "success");
    }
  };

  /* ================= EDIT MESSAGE ================= */
  const startEditMessage = (id: string, message: string) => {
    setEditingMessageId(id);
    setNewMessage(message);
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId) return;

    const snapshot = memorial.memorial_messages;
    setLoading(true);

    setMemorial((prev) => ({
      ...prev,
      memorial_messages: prev.memorial_messages.map((m) =>
        m.id === editingMessageId ? { ...m, message: newMessage } : m
      ),
    }));

    const res = await fetch(`/api/memorials/messages/${editingMessageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newMessage }),
    });

    if (!res.ok) {
      setMemorial((prev) => ({
        ...prev,
        memorial_messages: snapshot,
      }));
      showToast("Failed to update message", "error");
      setLoading(false);
      return;
    }

    setEditingMessageId(null);
    setNewMessage("");
    showToast("Message updated successfully!", "success");
    setLoading(false);
  };

  /* ================= RENDER ================= */
  return (
    <main className={styles.page}>
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastType]}`}>
          <p>{toastMessage}</p>
        </div>
      )}

      <section className={styles.hero}>
        <div className={styles.heroImage}>
          {memorial.picture && (
            <Image
              src={memorial.picture}
              alt={memorial.name}
              width={400}
              height={400}
            />
          )}
        </div>
        <div className={styles.heroText}>
          <h1>{memorial.name}</h1>
          <p className={styles.muted}>
            {memorial.born} — {memorial.died}
          </p>
          <p>{memorial.tribute}</p>
          <div className={styles.candles}>
            <button className={styles.candleBtn} onClick={lightCandle}>
              🕯 <span>{Number(memorial.candle_count ?? 0)}</span>
            </button>
            <p>Light a candle</p>
          </div>
        </div>
      </section>

      <section className={styles.bio}>
        <h3>Biography</h3>
        <p>{memorial.bio}</p>
      </section>

      <section className={styles.messages}>
        <h3>Messages</h3>

        <div className={styles.newMessage}>
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            disabled={!!editingMessageId}
          />

          <textarea
            placeholder="Write a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); 
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                editingMessageId ? saveEditedMessage() : addMessage();
              }
            }}
          />

          <button
            onClick={editingMessageId ? saveEditedMessage : addMessage}
            disabled={loading}
          >
            {loading ? "Sending..." : editingMessageId ? "Save" : "Send"}
          </button>
        </div>

        {memorial.memorial_messages.length === 0 && <p>No messages yet.</p>}

        <AnimatePresence>
          {memorial.memorial_messages.map((m) => (
            <motion.div
              key={m.id}
              className={styles.message}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <p>{m.message}</p>
              <span>By {m.author}</span><br/>
              <span className={styles.date}>
                {new Date(m.created_at).toLocaleString()}
              </span>
              <div className={styles.actions}>
                <button onClick={() => startEditMessage(m.id, m.message)}>
                  Edit
                </button>
                <button onClick={() => deleteMessage(m.id)}>
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </main>
  );
}
