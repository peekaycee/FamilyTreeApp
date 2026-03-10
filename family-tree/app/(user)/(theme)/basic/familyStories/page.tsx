"use client";

import { useState, useEffect, useRef, useCallback  } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./familyStories.module.css";
import { CornerDownLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient";

type Story = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  user_id: string;
};

type ToastType = "success" | "error" | "info";

export default function FamilyStoriesPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, type: ToastType = "info") => {
    setToastMessage(msg);
    setToastType(type);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Session Check
    useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      showToast("Session expired. Please login again.", "error");

      setTimeout(() => {
        router.replace("/auth/login");
      }, 1500);
    }
  };

  checkSession();
}, [router, supabase]);
  
    /* ================= AUTH FETCH ================= */
    const authFetch = useCallback(
      async (input: RequestInfo, init?: RequestInit) => {
        const res = await fetch(input, { ...init, credentials: "include" });

        if (res.status === 401) {
          if (!toastMessage) {
            showToast("Session expired. Please login again.", "error");
          }

          setTimeout(() => {
            router.replace("/auth/login");
          }, 1500);

          throw new Error("Session expired");
        }

        return res;
      },
      [router, toastMessage]
    );

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
    showToast("All fields are required", "error");
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
      showToast(data.error ?? "Failed to save story", "error");
      setLoading(false);
      return;
    }

    // Optimistic UI
    setStories((prev) =>
      editingId
        ? prev.map((s) => (s.id === data.id ? data : s))
        : [data, ...prev]
    );
    showToast(editingId ? "Story updated successfully" : "Story added successfully", "success");
    resetForm();
  } catch (err) {
    showToast("Unexpected error while saving story", "error");
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
  const deleteStory = async (story: Story) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    // Optimistic UI
    setStories((prev) => prev.filter((s) => s.id !== story.id));

    try {
      const res = await fetch(`/api/family-stories/${story.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        showToast("Delete failed", "error");
        fetchStories();
      } else {
        showToast("Story deleted successfully", "success");
      }
    } catch (err) {
      showToast("Unexpected error while deleting story", "error");
      console.error(err);
      fetchStories();
    }
  };

  /* ================= EDIT (Admin) ================= */
  const editStory = (story: Story) => {
    setEditingId(story.id);
    setTitle(story.title);
    setAuthor(story.author);
    setExcerpt(story.excerpt);
    setContent(story.content);
    setImageFile(null);
    setShowAddModal(true);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Family Stories</h1>
        <p>Discover the Rich History and Narratives of our Family Legacy.</p>
        <button className={styles.ctaGhost} onClick={() => setShowAddModal(true)}>
          Add Story
        </button>
      </section>

      {/* STORIES GRID */}
      <section className={styles.storiesSection}>
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
                  <div className={styles.readDeleteBtns}>
                    <button onClick={() => setSelectedStory(s.id)}>Read</button>
                    {/* Admin only */}
                    {/* <button onClick={() => editStory(s)}>Edit</button> */}
                    <button onClick={() => deleteStory(s)}>Delete</button>
                  </div>
                  <button className={styles.shareButton}>
                    Share <CornerDownLeft size={14} className={styles.sendCaret}/>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.article 
              className={styles.detailModal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
             

              <h3>{editingId ? "Edit Story" : "Add Story"}</h3>

              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
              <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" />
              <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              <div className={styles.clearButton}>
                <button className={styles.closeBtn} onClick={resetForm}>Clear</button>
                <button onClick={saveStory} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>

      {/* READ STORY MODAL */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            key={selectedStory}
            className={styles.modalBackdrop1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStory(null)}
          >
            <motion.article
              className={styles.detailModal1}
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
      {toastMessage && (
        <div className={`${styles.toastWrap} ${styles.toast} ${styles[toastType]}`}>
          <p>{toastMessage}</p>
        </div>
      )}
    </main>
  );
}
