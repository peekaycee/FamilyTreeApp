"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./legacy.module.css";
import Link from "next/link";
import HeroPics from '../../../../../public/images/pee2.png';
import Staff1 from '../../../../../public/images/staff1.png';
import Staff2 from '../../../../../public/images/staff2.png';
import Staff3 from '../../../../../public/images/staff3.png';
import { CornerDownLeft, Calendar, User, Play } from "lucide-react";
import Image from "next/image";

/**
 * Dummy sample data — replace with API calls or Supabase queries later.
 */
const timelineData = [
  {
    id: "t1",
    year: 1920,
    title: "Migration to new land",
    excerpt: "The family moved to the city looking for new opportunities.",
    images: [HeroPics],
    details: "A long migration story with letters and photographs.",
  },
  {
    id: "t2",
    year: 1950,
    title: "Founding business",
    excerpt: "Grandfather founded a carpentry business.",
    images: [Staff2],
    details: "The carpentry business created a legacy for generations.",
  },
  {
    id: "t3",
    year: 1988,
    title: "Community leader",
    excerpt: "Became a local community figure and mentor.",
    images: [Staff3],
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

const familyTreeSample = [
  { id: "p1", name: "Grandmother", birth: 1920, children: ["p2", "p3"], img: HeroPics, description: "A pioneer who started the craft business that supported the family for decades." },
  { id: "p2", name: "Father", birth: 1950, children: ["p4"], img: Staff1, description: "Second description." },
  { id: "p3", name: "Aunt", birth: 1953, children: [], img: Staff2, description: "Third description." },
  { id: "p4", name: "You", birth: 1985, children: [], img: Staff3, description: "Fourth description." },
];

export default function LegacyPage() {
  // UI states
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [featured, setFeatured] = useState(familyTreeSample[0]);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);



  // rotate featured ancestor
  useEffect(() => {
    const t = setInterval(() => {
      setHighlightIndex((p) => (p + 1) % timelineData.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const goToFamilyStories = () => {
    window.location.href = "/basic/familyStories";
  }

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
            Preserving the stories, deeds and milestones that built our family.
          </p>
          <div className={styles.heroCTAs}>
            <button className={styles.ctaPrimary}>
              <Play size={16} /> <Link href={"/basic/familyStories"}>Explore Stories</Link>
            </button>
            <button className={styles.ctaGhost}>
              <CornerDownLeft size={14} /> <Link href={"/basic/dashboard/family-builder"}>View Family Tree</Link>
            </button>
          </div>
        </motion.div>
      </section>

      {/* INTERACTIVE FAMILY TREE (simple interactive list + zoom control) */}
      <section className={styles.treeSection}>
        <h2 className={styles.sectionTitle}>Featured Family Tree</h2>
        <div className={styles.treeRow}>
          <div className={styles.treeViewer}>
            <small className={styles.muted}>Click to feature a family member</small>
            <div className={styles.treeList}>
              {familyTreeSample.map((p) => (
                <motion.button
                  key={p.id}
                  className={styles.treeNode}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setFeatured(p)}
                >
                  <div className={styles.nodeAvatar}>
                    <Image
                      src={p.img}
                      alt={p.name}
                      width={48}
                      height={48}
                      className={styles.nodeAvatarImg}
                    />
                  </div>
                  <div className={styles.details}>
                    <strong>{p.name}</strong>
                    <div className={styles.nodeMeta}>{p.birth}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <aside className={styles.treeAside}>
            <h3>Featured Family Member</h3>
          <div className={styles.a}>
            <div className={styles.featureAvatar}>
              <Image
                src={featured.img}
                alt={featured.name}
                width={72}
                height={72}
                priority
                className={styles.featureAvatarImg}
              />
            </div>              
            <div>
                <h4>{featured.name}</h4>
                <p className={styles.muted}>Born {featured.birth}</p>
                <p className={styles.small}>
                  {featured.description}
                </p>
                <button
                  className={styles.ctaSmall}
                  onClick={() => setShowFeaturedModal(true)}
                >
                  Read more
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <AnimatePresence>
        {showFeaturedModal && (
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFeaturedModal(false)}
          >
          <motion.article
            className={styles.detailModal}
            initial={{ scale: 0.96, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
          <button
            className={styles.closeBtn}
            onClick={() => setShowFeaturedModal(false)}
          >
            x
          </button>

          <div className={styles.featureModalHeader}>
            <Image
              src={featured.img}
              alt={featured.name}
              width={96}
              height={96}
              className={styles.featureAvatarImg}
            />
            <div>
              <h3>{featured.name}</h3>
              <p className={styles.muted}>Born {featured.birth}</p>
            </div>
            </div>

            <p className={styles.modalBodyText}>
              {featured.description}
            </p>
          </motion.article>
        </motion.div>
        )}
      </AnimatePresence>
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
                  x
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
                <small className={styles.mute}>By {s.author}</small>
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
          <div className={styles.viewAll}>
            <button onClick={() => goToFamilyStories()}>View all</button>
          </div>
        </AnimatePresence>
      </section>
    </main>
  );
}
