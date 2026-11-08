"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./legacy.module.css";
import Link from "next/link";
import { CornerDownLeft, Play } from "lucide-react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient";
import { timelineData } from "@/app/constants/Timeline";
import ShareButtons from "@/components/ShareButton";

interface FamilyStory {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface FeaturedFamilyMember {
  id: string;
  name: string;
  title?: string;
  description?: string;
  date_of_birth?: string;
  image_url?: string;
  is_published?: boolean;
  sort_order?: number;
}

interface FamilyTimelineItem {
  id: string;
  year: number | string;
  title: string;
  description?: string;
  is_published?: boolean;
  sort_order?: number;
}

interface FamilySiteContentResponse {
  content?: {
    legacy?: {
      featured_family?: FeaturedFamilyMember | FeaturedFamilyMember[] | null;
      timeline?: FamilyTimelineItem[];
    };
  };
}

const FEATURE_ROTATION_DAYS = 30;
const FAMILY_FOUNDING_YEAR = 1920;
const rotationMs = FEATURE_ROTATION_DAYS * 24 * 60 * 60 * 1000;
const foundingDate = new Date(FAMILY_FOUNDING_YEAR, 0, 1).getTime();

function getFeaturedMember(members: FeaturedFamilyMember[]) {
  if (!members.length) return null;

  if (typeof window === "undefined") {
    return members[0];
  }

  const savedId = localStorage.getItem("featuredMemberId");
  const savedTime = localStorage.getItem("featuredMemberTime");

  if (savedId && savedTime) {
    const elapsed = Date.now() - Number(savedTime);

    if (elapsed < rotationMs) {
      const found = members.find((p) => p.id === savedId);
      if (found) return found;
    }
  }

  const rotationIndex = Math.floor(
    (Date.now() - foundingDate) / rotationMs
  );

  const index = rotationIndex % members.length;

  return members[index];
}

export default function LegacyPage() {
  const supabase = createSupabaseBrowserClient();

  // UI states
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [, setHighlightIndex] = useState(0);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);

  const [featured, setFeatured] = useState<FeaturedFamilyMember | null>(null);
  const [featuredMembers, setFeaturedMembers] = useState<
    FeaturedFamilyMember[]
  >([]);
  const [familyTimeline, setFamilyTimeline] = useState<FamilyTimelineItem[]>([]);

  const [, setHasResolvedInitialContent] =
    useState(false);

  const [daysUntilNext] = useState(() => {
    const elapsed = Date.now() - foundingDate;
    const timeIntoCycle = elapsed % rotationMs;
    const msUntilNext = rotationMs - timeIntoCycle;
    return Math.ceil(msUntilNext / (24 * 60 * 60 * 1000));
  });

  // Dynamic stories from Supabase
  const [stories, setStories] = useState<FamilyStory[]>([]);

  // Fetch Featured Family and Family Timeline CMS content.
  // Display cached content immediately, then refresh from Supabase.
  useEffect(() => {
    let isMounted = true;

    const applyLegacyContent = (result: FamilySiteContentResponse) => {
      // Featured Family reads exclusively from Legacy → Featured Family.
      // Supports either one object or an array of records.
      const featuredFamilyData =
        result.content?.legacy?.featured_family;

      const members = (
        Array.isArray(featuredFamilyData)
          ? featuredFamilyData
          : featuredFamilyData
            ? [featuredFamilyData]
            : []
      )
        .filter((item) => item.is_published === true)
        .sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );

      // Family Timeline reads exclusively from Legacy → Timeline.
      const timeline = (result.content?.legacy?.timeline ?? [])
        .filter((item) => item.is_published === true)
        .sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );

      if (!isMounted) return;

      setFeaturedMembers(members);
      setFamilyTimeline(timeline);
      setFeatured(members.length > 0 ? getFeaturedMember(members) : null);
    };

    const fetchLegacyContent = async () => {
      let cacheKey: string | null = null;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Each authenticated user has a separate cache.
        cacheKey = session?.user?.id
          ? `ft_legacy_content_${session.user.id}`
          : null;

        // Load cached content immediately.
        if (cacheKey) {
          try {
            const cachedContent = localStorage.getItem(cacheKey);

            if (cachedContent) {
              const parsedContent: FamilySiteContentResponse =
                JSON.parse(cachedContent);

              if (parsedContent.content?.legacy && isMounted) {
                applyLegacyContent(parsedContent);
                setHasResolvedInitialContent(true);
              }
            }
          } catch (cacheError) {
            console.error(
              "Error reading cached legacy content:",
              cacheError
            );
          }
        }

        // Retrieve the latest content from the API.
        const response = await fetch("/api/family-site-content", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();

          console.error("Legacy content API error:", {
            status: response.status,
            statusText: response.statusText,
            response: errorText,
          });

          throw new Error(
            `Failed to fetch family legacy content. Status: ${response.status}`
          );
        }

        const result: FamilySiteContentResponse = await response.json();

        if (!isMounted) return;

        applyLegacyContent(result);

        // Persist the latest successful response.
        if (cacheKey) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (cacheError) {
            console.error(
              "Error saving legacy content to cache:",
              cacheError
            );
          }
        }
      } catch (error) {
        console.error("Error fetching legacy content:", error);
      } finally {
        if (isMounted) {
          setHasResolvedInitialContent(true);
        }
      }
    };

    fetchLegacyContent();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Rotate featured ancestor highlight
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
  }, [supabase]);

  // Only show latest 2 stories
  const latestStories = stories.slice(0, 2);

  const goToFamilyStories = () => {
    window.location.href = "/basic/familyStories";
  };

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

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
            <Link href={"/basic/familyStories"}>
              <button className={styles.ctaPrimary}>
                <Play size={16} /> Explore Stories
              </button>
            </Link>
            <Link href={"/basic/family-builder"}>
              <button className={styles.ctaGhost}>
                <CornerDownLeft size={14} /> View Family Tree
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FEATURED FAMILY MEMBERS */}
      <section className={styles.treeSection}>
        <h2 className={styles.sectionTitle}>Featured Family</h2>

        <div className={styles.treeRow}>
          <div className={styles.treeViewer}>
            <small className={styles.muted}>
              Click to feature a family member
            </small>

            <div className={styles.treeList}>
              {featuredMembers.map((p) => (
                <motion.button
                  key={p.id}
                  className={styles.treeNode}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => {
                    setFeatured(p);
                    localStorage.setItem("featuredMemberId", p.id);
                    localStorage.setItem(
                      "featuredMemberTime",
                      Date.now().toString()
                    );
                  }}
                >
                  <div className={styles.nodeAvatar}>
                    {p.image_url && (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        width={48}
                        height={48}
                        unoptimized
                        className={styles.nodeAvatarImg}
                      />
                    )}
                  </div>

                  <div className={styles.details}>
                    <strong>{p.name}</strong>
                    <div className={styles.nodeMeta}>
                      {p.title}
                      {p.date_of_birth && ` · ${p.date_of_birth}`}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <p className={styles.nextFamilySpotlight}>
              Next family spotlight changes in {daysUntilNext} day
              {daysUntilNext !== 1 ? "s" : ""}
            </p>
          </div>

          {featured && (
            <aside className={styles.treeAside}>
              <h3>Featured Family Member</h3>

              <div className={styles.a}>
                <div className={styles.featureAvatar}>
                  {featured.image_url && (
                    <Image
                      src={featured.image_url}
                      alt={featured.name}
                      width={72}
                      height={72}
                      priority
                      unoptimized
                      className={styles.featureAvatarImg}
                    />
                  )}
                </div>

                <div>
                  <h4>{featured.name}</h4>

                  {featured.title && (
                    <p className={styles.muted}>{featured.title}</p>
                  )}

                  {featured.date_of_birth && (
                    <p className={styles.muted}>
                      Born {featured.date_of_birth}
                    </p>
                  )}

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
          )}
        </div>
      </section>

      <AnimatePresence>
        {showFeaturedModal && featured && (
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
                {featured.image_url && (
                  <Image
                    src={featured.image_url}
                    alt={featured.name}
                    width={96}
                    height={96}
                    unoptimized
                    className={styles.featureAvatarImg}
                  />
                )}

                <div>
                  <h3>{featured.name}</h3>

                  {featured.title && (
                    <p className={styles.muted}>{featured.title}</p>
                  )}

                  {featured.date_of_birth && (
                    <p className={styles.muted}>
                      Born {featured.date_of_birth}
                    </p>
                  )}
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
          {familyTimeline.map((t) => (
            <motion.div
              key={t.id}
              className={styles.timelineCard}
              onClick={() => setSelectedTimeline(t.id)}
              whileHover={{ y: -6 }}
            >
              <div className={styles.timelineYear}>{t.year}</div>

              <div className={styles.timelineBody}>
                <strong>{t.title}</strong>
                <p className={styles.muted}>{t.description}</p>
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
                  const t = familyTimeline.find(
                    (x) => x.id === selectedTimeline
                  );

                  if (!t) return null;

                  return (
                    <>
                      <h3>
                        {t.title} — {t.year}
                      </h3>
                      <p>{t.description}</p>
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
                  <button
                    className={styles.ctaSmall}
                    onClick={() => setSelectedStory(s.id)}
                  >
                    Read
                  </button>

                  <ShareButtons
                    className={styles.ctaGhost}
                    url={`${siteUrl}/family-stories/${s.id}`}
                    title={s.title}
                    text={`Image:
${s.image_url ?? "No image available"}

Title: ${s.title}
Author: ${s.author}

Excerpt: ${s.excerpt}

`}
                  />
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
                <button
                  className={styles.closeBtn}
                  onClick={() => setSelectedStory(null)}
                >
                  x
                </button>

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
