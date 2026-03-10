"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./legacy.module.css";
import Link from "next/link";
import { CornerDownLeft, Play } from "lucide-react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient";
import { timelineData } from "@/app/constants/Timeline";
import { familyTreeSample } from "@/app/constants/familyTreeSample";

interface FamilyStory {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  content: string;
  image_url?: string;
  created_at: string;
}

const FEATURE_ROTATION_DAYS = 30;
const FAMILY_FOUNDING_YEAR = 1920;
const rotationMs = FEATURE_ROTATION_DAYS * 24 * 60 * 60 * 1000;
const foundingDate = new Date(FAMILY_FOUNDING_YEAR, 0, 1).getTime();

function getFeaturedMember() {
  if (typeof window === "undefined") {
    return familyTreeSample[0];
  }

  const savedId = localStorage.getItem("featuredMemberId");
  const savedTime = localStorage.getItem("featuredMemberTime");

  if (savedId && savedTime) {
    const elapsed = Date.now() - Number(savedTime);

    if (elapsed < rotationMs) {
      const found = familyTreeSample.find((p) => p.id === savedId);
      if (found) return found;
    }
  }

  const rotationIndex = Math.floor((Date.now() - foundingDate) / rotationMs);
  const index = rotationIndex % familyTreeSample.length;

  return familyTreeSample[index];
}

export default function LegacyPage() {
  const supabase = createSupabaseBrowserClient();
  // UI states
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [, setHighlightIndex] = useState(0);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [featured, setFeatured] = useState(familyTreeSample[0]);
  const [daysUntilNext] = useState(() => {
    const elapsed = Date.now() - foundingDate;
    const timeIntoCycle = elapsed % rotationMs;
    const msUntilNext = rotationMs - timeIntoCycle;
    return Math.ceil(msUntilNext / (24 * 60 * 60 * 1000));
  });

  // Dynamic stories from Supabase
  const [stories, setStories] = useState<FamilyStory[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFeatured(getFeaturedMember());
  }, []);


  // rotate featured ancestor
  useEffect(() => {
    const t = setInterval(() => {
      setHighlightIndex((p) => (p + 1) % timelineData.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // Fetch stories from Supabase
useEffect(() => {
  const fetchStories = async () => {
    const { data, error } = await supabase
      .from("family_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setStories(data);
  };
  fetchStories();
}, []);

// Only show latest 2 stories
const latestStories = stories.slice(0, 2);

  // Update featured based on highlightIndex
  const goToFamilyStories = () => {
    window.location.href = "/basic/familyStories";
  };

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
              <CornerDownLeft size={14} /> <Link href={"/basic/family-builder"}>View Family Tree</Link>
            </button>
          </div>
        </motion.div>
      </section>

      {/* FEATURED FAMILY MEMBERS */}
      <section className={styles.treeSection}>
        <h2 className={styles.sectionTitle}>Featured Family</h2>
        <div className={styles.treeRow}>
          <div className={styles.treeViewer}>
            <small className={styles.muted}>Click to feature a family member</small>
            <div className={styles.treeList}>
              {familyTreeSample.map((p) => (
                <motion.button
                  key={p.id}
                  className={styles.treeNode}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => {
                    setFeatured(p);
                    localStorage.setItem("featuredMemberId", p.id);
                    localStorage.setItem("featuredMemberTime", Date.now().toString());
                  }}
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
            <p className={styles.nextFamilySpotlight}>
              Next family spotlight changes in {daysUntilNext} day{daysUntilNext !== 1 ? "s" : ""}            
            </p>
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
                <p className={styles.small}>{featured.description}</p>
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

              <p className={styles.modalBodyText}>{featured.description}</p>
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

      {/* =================== STORIES GRID =================== */}
      <section className={styles.storiesSection}>
  <h2 className={styles.sectionTitle}>Family Stories</h2>
  <div className={styles.storiesGrid}>
    {latestStories.map((s) => (
      <motion.article
        key={s.id}
        className={styles.storyCard}
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ scale: 1.02 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {s.image_url && (
          <div className={styles.storyHero}>
            <Image
              src={s.image_url}
              alt={s.title}
              width={0}
              height={0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              className={styles.storyImage}
            />
          </div>
        )}
        <div className={styles.storyBody}>
          <h3>{s.title}</h3>
          <small className={styles.mute}>By {s.author}</small>
          <p>{s.excerpt}</p>
          <div className={styles.storyActions}>
            <button className={styles.ctaSmall} onClick={() => setSelectedStory(s.id)}>Read</button>
            <button className={styles.ctaGhost}>
              Share<CornerDownLeft size={14} className={styles.sendCaret}/>
            </button>
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
            const s = stories.find((x) => x.id === selectedStory)!;
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
