// app/legacy/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./legacy.module.css";
import { CornerDownLeft, Calendar, User, Play } from "lucide-react";

/**
 * Dummy sample data — replace with API calls or Supabase queries later.
 */
const timelineData = [
  {
    id: "t1",
    year: 1920,
    title: "Migration to new land",
    excerpt: "The family moved to the city looking for new opportunities.",
    images: [],
    details: "A long migration story with letters and photographs.",
  },
  {
    id: "t2",
    year: 1950,
    title: "Founding business",
    excerpt: "Grandfather founded a carpentry business.",
    images: [],
    details: "The carpentry business created a legacy for generations.",
  },
  {
    id: "t3",
    year: 1988,
    title: "Community leader",
    excerpt: "Became a local community figure and mentor.",
    images: [],
    details: "Organised local schools and community projects.",
  },
];

const storiesData = [
  {
    id: "s1",
    title: "The Amazing Voyage",
    author: "A. Family",
    excerpt:
      "A family voyage that shaped the next generation. A story filled with courage.",
    media: [],
    content:
      "Longform story content with images, documents, and audio testimonies.",
  },
  {
    id: "s2",
    title: "From Carpentry to Community",
    author: "B. Family",
    excerpt: "How a humble workshop became a community institution.",
    media: [],
    content: "Detailed content and scanned documents.",
  },
];

const familyTreeSample = [
  { id: "p1", name: "Grandfather", birth: 1920, children: ["p2", "p3"], img: "" },
  { id: "p2", name: "Father", birth: 1950, children: ["p4"], img: "" },
  { id: "p3", name: "Aunt", birth: 1953, children: [], img: "" },
  { id: "p4", name: "You", birth: 1985, children: [], img: "" },
];

export default function LegacyPage() {
  // UI states
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const featured = useMemo(() => familyTreeSample[0], []);

  // rotate featured ancestor
  useEffect(() => {
    const t = setInterval(() => {
      setHighlightIndex((p) => (p + 1) % timelineData.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroInner}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className={styles.heroTitle}>Legacy — Family Heritage</h1>
          <p className={styles.heroLead}>
            Preserve the stories, deeds and milestones that built our family.
          </p>
          <div className={styles.heroCTAs}>
            <button className={styles.ctaPrimary}>
              <Play size={16} /> Explore Stories
            </button>
            <button className={styles.ctaGhost}>
              <CornerDownLeft size={14} /> View Family Tree
            </button>
          </div>
        </motion.div>
      </section>

      {/* INTERACTIVE FAMILY TREE (simple interactive list + zoom control) */}
      <section className={styles.treeSection}>
        <h2 className={styles.sectionTitle}>Interactive Family Tree</h2>
        <div className={styles.treeRow}>
          <div className={styles.treeViewer}>
            <small className={styles.muted}>Click a person to view details</small>
            <div className={styles.treeList}>
              {familyTreeSample.map((p) => (
                <motion.button
                  key={p.id}
                  className={styles.treeNode}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => alert(`${p.name} — born ${p.birth}`)}
                >
                  <div className={styles.nodeAvatar} />
                  <div>
                    <strong>{p.name}</strong>
                    <div className={styles.nodeMeta}>{p.birth}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <aside className={styles.treeAside}>
            <h3>Featured Ancestor</h3>
            <div className={styles.featureCard}>
              <div className={styles.featureAvatar} />
              <div>
                <h4>{featured.name}</h4>
                <p className={styles.muted}>Born {featured.birth}</p>
                <p className={styles.small}>
                  A pioneer who started the craft business that supported the family for decades.
                </p>
                <button className={styles.ctaSmall}>Read more</button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* TIMELINE */}
      <section className={styles.timelineSection}>
        <h2 className={styles.sectionTitle}>Family Timeline</h2>

        <div className={styles.timelineHoriz}>
          {timelineData.map((t) => (
            <motion.div
              key={t.id}
              className={styles.timelineCard}
              onClick={() => setSelectedTimeline(t.id)}
              whileHover={{ y: -6 }}
            >
              <div className={styles.timelineYear}>{t.year}</div>
              <div className={styles.timelineBody}>
                <strong>{t.title}</strong>
                <p className={styles.muted}>{t.excerpt}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedTimeline && (
            <motion.div
              className={styles.modalBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTimeline(null)}
            >
              <motion.article
                className={styles.detailModal}
                initial={{ scale: 0.98, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.98, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={styles.closeBtn}
                  onClick={() => setSelectedTimeline(null)}
                >
                  Close
                </button>
                {(() => {
                  const t = timelineData.find((x) => x.id === selectedTimeline)!;
                  return (
                    <>
                      <h3>{t.title} — {t.year}</h3>
                      <p>{t.details}</p>
                    </>
                  );
                })()}
              </motion.article>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* STORIES GRID */}
      <section className={styles.storiesSection}>
        <h2 className={styles.sectionTitle}>Legacy Stories</h2>
        <div className={styles.storiesGrid}>
          {storiesData.map((s) => (
            <motion.article
              key={s.id}
              className={styles.storyCard}
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ scale: 1.02 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className={styles.storyHero} />
              <div className={styles.storyBody}>
                <h3>{s.title}</h3>
                <small className={styles.muted}>By {s.author}</small>
                <p>{s.excerpt}</p>
                <div className={styles.storyActions}>
                  <button className={styles.ctaSmall} onClick={() => setSelectedStory(s.id)}>Read</button>
                  <button className={styles.ctaGhost}>Share</button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <AnimatePresence>
          {selectedStory && (
            <motion.div
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
                <button className={styles.closeBtn} onClick={() => setSelectedStory(null)}>Close</button>
                {(() => {
                  const s = storiesData.find((x) => x.id === selectedStory)!;
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
      </section>
    </main>
  );
}
