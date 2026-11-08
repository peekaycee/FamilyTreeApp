'use client';

import styles from './homepage.module.css';

import Image from 'next/image';

import Family16 from '../../../../../public/images/family16.png';
import Family19 from '../../../../../public/images/family19.png';
import Family25 from '../../../../../public/images/family25.png';
import Family26 from '../../../../../public/images/family26.png';

import { motion } from 'framer-motion';

import { useState, useEffect } from 'react';

import { testimonies } from '../../../../constants/Testimonies';

import Button from '../../../../../components/Button';

import { useRouter } from "next/navigation";

import { useSettings } from "@/app/contexts/SettingsContext";

import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient";

type CMSItem = {
  id?: string;
  title?: string;
  name?: string;
  testimony?: string;
  description?: string;
  body?: string;
  text?: string;
  image_path?: string | null;
  image_url?: string | null;
  image_path_url?: string | null;
  desktop_image_path_url?: string | null;
  mobile_image_url?: string | null;
  mobile_image_path_url?: string | null;
  video_url?: string | null;
  video_path_url?: string | null;
  desktop_images?: {
    id?: string;
    image_path?: string | null;
    image_url?: string | null;
    sort_order?: number;
  }[];
  is_published?: boolean;
};

type HomepageContent = {
  homepage?: {
    hero?: CMSItem;
    family_video?: CMSItem;
    testimonies?: CMSItem[];
    legacy_spot?: CMSItem[];
  };
};

export default function HomePage() {

  const router = useRouter();

  const [current, setCurrent] = useState(0);

  const { state, isHydrated } = useSettings();

  const [cmsContent, setCmsContent] = useState<HomepageContent | null>(null);

  const [isCompactScreen, setIsCompactScreen] = useState(false);

  // Prevent default content from flashing before cached or fetched
  // tenant content has been resolved.
  const [hasResolvedInitialContent, setHasResolvedInitialContent] =
    useState(false);

  const goToStory = () => router.push("/basic/stories");

  const goToTree = () => router.push('/basic/family-builder');

  const goToMembers = () => router.push('/basic/members');

  // Retrieve persistent content for the authenticated tenant.
  // Cached content is displayed first, then refreshed from Supabase.
  useEffect(() => {

    let cancelled = false;

    const fetchHomepageContent = async () => {

      let cacheKey: string | null = null;

      try {

        // Get the authenticated Supabase user.
        const supabase = createSupabaseBrowserClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        // owner_user_id identifies the tenant owner.
        // Therefore, each authenticated tenant gets a separate cache.
        if (session?.user?.id) {

          cacheKey = `ft_homepage_content_${session.user.id}`;

          try {

            const cachedContent = localStorage.getItem(cacheKey);

            if (cachedContent) {

              const parsedContent = JSON.parse(cachedContent);

              if (
                parsedContent &&
                typeof parsedContent === 'object' &&
                parsedContent.homepage
              ) {
                setCmsContent(parsedContent);

                // Cached content is ready to display immediately.
                setHasResolvedInitialContent(true);
              }
            }

          } catch (cacheError) {

            console.error(
              'Unable to read cached homepage content:',
              cacheError
            );

          }
        }

      } catch (authError) {

        console.error(
          'Unable to identify authenticated homepage user:',
          authError
        );

      }

      if (cancelled) return;

      // Always retrieve the latest version from Supabase.
      try {

        const response = await fetch('/api/family-site-content', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Unable to fetch homepage content.');
        }

        const result = await response.json();

        if (cancelled) return;

        if (result.content) {

          // Update the displayed content with the latest backend data.
          setCmsContent(result.content);

          // Persist the latest content for the authenticated tenant.
          if (cacheKey) {

            try {

              localStorage.setItem(
                cacheKey,
                JSON.stringify(result.content)
              );

            } catch (cacheError) {

              console.error(
                'Unable to persist homepage content:',
                cacheError
              );

            }
          }
        }

      } catch (error) {

        console.error('Unable to load homepage content:', error);

      } finally {

        if (!cancelled) {
          // If no cache existed, allow the page to display its
          // original fallback content after the initial fetch.
          setHasResolvedInitialContent(true);
        }

      }
    };

    fetchHomepageContent();

    return () => {
      cancelled = true;
    };

  }, []);

  // Detect tablet and mobile screens for the separate mobile hero image.
  useEffect(() => {

    const mediaQuery = window.matchMedia('(max-width: 900px)');

    const updateScreenSize = () => {
      setIsCompactScreen(mediaQuery.matches);
    };

    updateScreenSize();

    mediaQuery.addEventListener('change', updateScreenSize);

    return () => {
      mediaQuery.removeEventListener('change', updateScreenSize);
    };

  }, []);

  const hero = cmsContent?.homepage?.hero;

  const familyVideo =
    cmsContent?.homepage?.family_video?.is_published === true
      ? cmsContent.homepage.family_video
      : null;

  const videoUrl =
    familyVideo?.video_url ||
    familyVideo?.video_path_url ||
    null;

  const desktopImages = [
    hero?.desktop_images?.[0]?.image_url || hero?.desktop_image_path_url || Family16,
    hero?.desktop_images?.[1]?.image_url || Family19,
    hero?.desktop_images?.[2]?.image_url || Family25,
    hero?.desktop_images?.[3]?.image_url || Family26,
  ];

  const mobileHeroImage =
    hero?.mobile_image_url ||
    hero?.mobile_image_path_url ||
    null;

  const activeTestimonies =
    cmsContent?.homepage?.testimonies?.length
      ? cmsContent.homepage.testimonies
      : testimonies;

  const legacySpots =
    cmsContent?.homepage?.legacy_spot?.length
      ? cmsContent.homepage.legacy_spot
      : [
          {
            id: 'fallback-1',
            name: `Chief Samuel ${state.familyName}`,
            description:
              'A visionary leader whose values of unity and discipline continue to guide our family today.',
            image_url: '',
          },
          {
            id: 'fallback-2',
            name: `Madam Esther ${state.familyName}`,
            description:
              'The heart of the family—known for resilience, kindness, and unwavering faith.',
            image_url: '',
          },
        ];

  // Automatically change testimonial every 5 seconds.
  useEffect(() => {

    if (!activeTestimonies.length) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeTestimonies.length);
    }, 5000);

    return () => clearInterval(interval);

  }, [activeTestimonies.length]);

  const currentTestimony = activeTestimonies.length
    ? current % activeTestimonies.length
    : 0;

  if (!isHydrated || !hasResolvedInitialContent) return null;

  return (

    <section className={styles.homepage}>

      <section
        className={styles.hero}
        style={
          isCompactScreen && mobileHeroImage
            ? { backgroundImage: `url("${mobileHeroImage}")` }
            : undefined
        }
      >

        <div className={styles.overlay}></div>

        <div className={styles.heroText}>

          <h1>
            {hero?.title || (
              <>
                Welcome Home! <br /> The {state.familyName} Family
              </>
            )}
          </h1>

          <p>
            {hero?.description ||
              'Celebrating our roots, memories, and enduring legacy.'}
          </p>

          <Button tag={'Explore Our Story'} onClick={goToStory} />

        </div>

        <div className={styles.heroScatteredContainer}>

          {/* Image 1 */}
          <motion.div
            className={`${styles.heroImage} ${styles.img1}`}
            initial={{ scale: 1, rotate: -10 }}
            animate={{
              scale: [1, 1.18, 1],
              rotate: [-10, -6, -10],
            }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={desktopImages[0]}
              alt="Memory 1"
              width={200}
              height={200}
              unoptimized={typeof desktopImages[0] === 'string'}
            />
          </motion.div>

          {/* Image 2 */}
          <motion.div
            className={`${styles.heroImage} ${styles.img2}`}
            initial={{ scale: 1, rotate: 7 }}
            animate={{
              scale: [1, 1.22, 1],
              rotate: [7, 12, 7],
            }}
            transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={desktopImages[1]}
              alt="Memory 2"
              width={200}
              height={200}
              unoptimized={typeof desktopImages[1] === 'string'}
            />
          </motion.div>

          {/* Image 3 */}
          <motion.div
            className={`${styles.heroImage} ${styles.img3}`}
            initial={{ scale: 1, rotate: -4 }}
            animate={{
              scale: [1, 1.15, 1],
              rotate: [-4, -1, -4],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={desktopImages[2]}
              alt="Memory 3"
              width={200}
              height={200}
              unoptimized={typeof desktopImages[2] === 'string'}
            />
          </motion.div>

          {/* Image 4 */}
          <motion.div
            className={`${styles.heroImage} ${styles.img4}`}
            initial={{ scale: 1, rotate: -4 }}
            animate={{
              scale: [1, 1.15, 1],
              rotate: [-4, -1, -4],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={desktopImages[3]}
              alt="Memory 4"
              width={200}
              height={200}
              unoptimized={typeof desktopImages[3] === 'string'}
            />
          </motion.div>

        </div>

      </section>

      {/* Why Choose Family Tree */}
      <section className={styles.features}>

        <h1>Why This Family Archive Matters</h1>

        <div className={styles.cards}>

          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.featureIcon}>🌿</div>
            <h3>Preserve Our Heritage</h3>
            <p>
              We safely store our photographs, documents, and stories that define who we are as a family.
            </p>
          </motion.div>

          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.featureIcon}>👨‍👩‍👧‍👦</div>
            <h3>Connect Generations</h3>
            <p>We can visualize relationships, understand our lineage, and keep everyone connected.</p>
          </motion.div>

          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.featureIcon}>🛡️</div>
            <h3>Private & Secure</h3>
            <p>Our family history remains private, protected, and accessible only to us.</p>
          </motion.div>

        </div>

      </section>

      {/* Video Clips */}
      <section className={styles.videoClip}>

        <h1>
          {familyVideo?.title || "Our Story, Brought to Life"}
        </h1>

        <motion.div
          className={styles.video}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          viewport={{ once: true }}
        >
          <video
            key={videoUrl || "default-family-video"}
            muted
            loop
            autoPlay
            playsInline
            controls
          >
            <source src={videoUrl || "/videos/TFTVid.mp4"} />
          </video>
        </motion.div>

      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>

        <h1>How Our Family Tree Grows</h1>

        <div className={styles.howItWorksCards}>

          <motion.div
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
            viewport={{ once: true }}
          >
            <p><span>1.</span> Build The Family Tree</p>
          </motion.div>

          <motion.div
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.25 }}
            viewport={{ once: true }}
          >
            <p><span>2.</span> Add Family Members & Stories</p>
          </motion.div>

          <motion.div
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.25 }}
            viewport={{ once: true }}
          >
            <p><span>3.</span> Preserve Memories for Future Generations</p>
          </motion.div>

        </div>

      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>

        <h1>Family Member&apos;s Voices</h1>

        <div className={styles.testimonyContainer}>

          <motion.div
            className={styles.testimony}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >

            <motion.div
              animate={{ x: -currentTestimony * 100 + '%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className={styles.testimonySlider}
              style={{
                display: 'flex',
                width: `${activeTestimonies.length * 100}%`,
              }}
            >

              {activeTestimonies.map((t, index) => {

                const cmsTestimony = t as CMSItem;

                const testimonyImage =
                  cmsTestimony.image_url ||
                  cmsTestimony.image_path_url ||
                  ('image' in t ? t.image : undefined) ||
                  Family16;

                return (

                  <div
                    key={t.id || index}
                    className={styles.testimonyItem}
                  >

                    <div className={styles.testimonyImage}>
                      <Image
                        src={testimonyImage}
                        alt="testifier"
                        width={200}
                        height={200}
                        unoptimized={typeof testimonyImage === 'string'}
                      />
                    </div>

                    <div className={styles.testifierText}>

                      <p>
                        {cmsTestimony.testimony || cmsTestimony.text || cmsTestimony.body}
                      </p>

                      <p>
                        - <em>{cmsTestimony.name || cmsTestimony.title}</em>
                      </p>

                    </div>

                  </div>

                );

              })}

            </motion.div>

          </motion.div>

        </div>

      </section>

      {/* FEATURED ANCESTORS */}
      <section className={styles.featuredAncestors}>

        <h1>Legacy Spotlight</h1>

        <p>
          Honoring the pillars of the {state.familyName} family whose courage, wisdom, and
          sacrifices shaped generations.
        </p>

        <div className={styles.ancestorCards}>

          {legacySpots.map((item, index) => {

            const ancestorImage =
              item.image_url ||
              item.image_path_url ||
              (index === 0 ? Family16 : Family19);

            return (

              <motion.div
                key={item.id || index}
                className={styles.ancestorCard}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
                viewport={{ once: true }}
              >

                <Image
                  src={ancestorImage}
                  alt="Ancestor"
                  width={220}
                  height={220}
                  unoptimized={typeof ancestorImage === 'string'}
                />

                <h3>
                  {item.name || item.title}
                </h3>

                <p>
                  {item.description || item.body}
                </p>

              </motion.div>

            );

          })}

        </div>

        <Button tag="View Family Members" onClick={goToMembers} />

      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>

        <h1>Every Name Has a Story</h1>

        <p>
          Help us complete the {state.familyName} family legacy by adding members,
          memories, and stories that must never be forgotten.
        </p>

        <div className={styles.ctaActions}>

          <Button tag="Add Family Members" onClick={goToTree} />

          <Button tag="Continue Exploring" onClick={goToStory} />

        </div>

      </section>

    </section>

  );

}


