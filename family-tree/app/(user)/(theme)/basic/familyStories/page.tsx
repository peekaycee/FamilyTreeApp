"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./familyStories.module.css";
import Staff2 from '../../../../../public/images/staff2.png';
import Staff3 from '../../../../../public/images/staff3.png';
import { CornerDownLeft } from "lucide-react";
import Image from "next/image";

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
    image: Staff2,
  },
  {
    id: "s2",
    title: "From Carpentry to Community",
    author: "B. Family",
    excerpt: "How a humble workshop became a community institution.",
    media: [],
    content: "Detailed content and scanned documents.",
    image: Staff3,
  },
];

export default function LegacyPage() {
  // UI states
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  return (
    <main className={styles.page}>
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
             <div className={styles.storyHero}>
              <Image
                src={s.image}
                alt={s.title}
                width={0}
                height={0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={s.id === storiesData[0].id}
                className={styles.storyImage}
              />
            </div>
              <div className={styles.storyBody}>
                <h3>{s.title}</h3>
                <small className={styles.muted}>By {s.author}</small>
                <p>{s.excerpt}</p>
                <div className={styles.storyActions}>
                  <button className={styles.ctaSmall} onClick={() => setSelectedStory(s.id)}>Read</button>
                  <button className={styles.ctaGhost}>Share<CornerDownLeft size={14} className={styles.sendCaret}/></button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

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
