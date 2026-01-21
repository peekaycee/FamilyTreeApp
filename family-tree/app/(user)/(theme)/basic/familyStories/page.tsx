"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./familyStories.module.css";
import { CornerDownLeft } from "lucide-react";
import Image from "next/image";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Story = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  user_id: string;
};

export default function FamilyStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH STORIES ================= */
  const fetchStories = async () => {
    const { data, error } = await supabase
      .from("family_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setStories(data as Story[]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStories();
  }, []);

  /* ================= ADD / EDIT STORY ================= */
  const saveStory = async () => {
  if (!title.trim() || !author.trim() || !excerpt.trim() || !content.trim()) {
    alert("All fields are required");
    return;
  }

  setLoading(true);

  let imageFileBase64: string | null = null;

  if (imageFile) {
    imageFileBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  }

  try {
    // Build payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { title, author, excerpt, content };
    if (imageFile) payload.imageFileBase64 = imageFileBase64; // ✅ include only when new image selected

    const res = await fetch(
      editingId ? `/api/family-stories/${editingId}` : "/api/family-stories",
      {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Failed to save story");
      setLoading(false);
      return;
    }

    // Optimistic UI
    setStories((prev) =>
      editingId
        ? prev.map((s) => (s.id === data.id ? data : s))
        : [data, ...prev]
    );

    resetForm();
  } catch (err) {
    alert("Unexpected error while saving story");
    console.error(err);
    setLoading(false);
  }
};

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setExcerpt("");
    setContent("");
    setImageFile(null);
    setShowAddModal(false);
    setLoading(false);
  };

  /* ================= DELETE (Admin) ================= */
  // const deleteStory = async (story: Story) => {
  //   if (!confirm("Are you sure you want to delete this story?")) return;

  //   // Optimistic UI
  //   setStories((prev) => prev.filter((s) => s.id !== story.id));

  //   try {
  //     const res = await fetch(`/api/family-stories/${story.id}`, {
  //       method: "DELETE",
  //       credentials: "include",
  //     });

  //     if (!res.ok) {
  //       alert("Delete failed");
  //       fetchStories();
  //     }
  //   } catch (err) {
  //     alert("Unexpected error while deleting story");
  //     console.error(err);
  //     fetchStories();
  //   }
  // };

  /* ================= EDIT (Admin) ================= */
  // const editStory = (story: Story) => {
  //   setEditingId(story.id);
  //   setTitle(story.title);
  //   setAuthor(story.author);
  //   setExcerpt(story.excerpt);
  //   setContent(story.content);
  //   setImageFile(null);
  //   setShowAddModal(true);
  // };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Legacy Stories</h1>
        <p>Discover the Rich History and Narratives of our Family Legacy.</p>
        <button className={styles.ctaSmall} onClick={() => setShowAddModal(true)}>
          Add Story
        </button>
      </section>

      {/* STORIES GRID */}
      <section className={styles.storiesSection}>
        <h2 className={styles.sectionTitle}>Legacy Stories</h2>

        <div className={styles.storiesGrid}>
          {stories.map((s) => (
            <motion.article 
              key={s.id} 
              className={styles.storyCard}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: "easeOut" }}            
             >
              {s.image_url && (
                <div className={styles.storyHero}>
                  <Image
                    src={s.image_url}
                    alt={s.title}
                    width={400}
                    height={300}
                    className={styles.storyImage}
                  />
                </div>
              )}

              <div className={styles.storyBody}>
                <h3>{s.title}</h3>
                <small className={styles.mute}>By {s.author}</small>
                <p>{s.excerpt}</p>

                <div className={styles.storyActions}>
                  <button onClick={() => setSelectedStory(s.id)}>Read</button>
                  <button>
                    Share <CornerDownLeft size={14} className={styles.sendCaret}/>
                  </button>
                  {/* Admin only */}
                  {/* <button onClick={() => editStory(s)}>Edit</button>
                  <button onClick={() => deleteStory(s)}>Delete</button> */}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className={styles.modalBackdrop}>
            <motion.article className={styles.detailModal}>
              <button onClick={resetForm}>x</button>

              <h3>{editingId ? "Edit Story" : "Add Story"}</h3>

              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
              <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" />
              <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />

              <button onClick={saveStory} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>

      {/* READ STORY MODAL */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            key={selectedStory}
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStory(null)}
          >
            <motion.article
              className={styles.detailModal}
              initial={{ scale: 0.98, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeBtn} onClick={() => setSelectedStory(null)}>x</button>

              {(() => {
                const s = stories.find((x) => x.id === selectedStory);
                if (!s) return null;

                return (
                  <>
                    <h3>{s.title}</h3>
                    <p className={styles.muted}>By {s.author}</p>
                    <p>{s.content}</p>
                  </>
                );
              })()}
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
