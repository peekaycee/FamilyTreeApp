"use client";

import { motion } from "framer-motion";
import styles from "./stories.module.css";
import Image from "next/image";
import { Heart, Users, BookOpen } from "lucide-react";

export default function OurStoryPage() {
  return (
    <div className={styles.container}>
      {/* --------------------------- HERO --------------------------- */}
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Our Story</h1>
          <p className={styles.subtitle}>
            The story of the Awolowo family — a journey shaped by heritage,
            resilience, shared values, and the generations that continue to
            carry our name forward with pride.
          </p>
        </div>

        <motion.div
          className={styles.heroImageWrap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <Image
            src="/images/family21.png"
            alt="Awolowo Family Legacy"
            fill
            className={styles.heroImage}
          />
        </motion.div>
      </motion.section>

      {/* --------------------------- SECTION 1 --------------------------- */}
      <section className={styles.section}>
        <motion.div
          className={styles.split}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.2 }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
            className={styles.textBlock}
          >
            <h2 className={styles.heading}>
              The Roots of the Awolowo Family
            </h2>
            <p className={styles.text}>
              This platform exists to document and preserve the story of the
              Awolowo family — our beginnings, our journeys, our challenges,
              and our triumphs. What started as shared memories passed down by
              word of mouth is now carefully recorded so that no chapter of our
              history is ever lost.
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
            className={styles.imageBlock}
          >
            <Image
              src="/images/icon.png"
              alt="Awolowo family heritage"
              fill
              className={styles.sectionImage}
              loading="eager"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* --------------------------- VALUES SECTION --------------------------- */}
      <section className={styles.values}>
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={styles.valuesTitle}
        >
          What Defines Us as a Family
        </motion.h3>

        <div className={styles.valuesGrid}>
          {/* Value 1 */}
          <motion.div
            className={styles.valueCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Heart className={styles.icon} />
            <h4>Love & Togetherness</h4>
            <p>
              At the heart of the Awolowo family is love — expressed through
              unity, mutual respect, shared laughter, and standing together
              through every season of life.
            </p>
          </motion.div>

          {/* Value 2 */}
          <motion.div
            className={styles.valueCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Users className={styles.icon} />
            <h4>Generational Bond</h4>
            <p>
              From elders to the youngest members, our family story is one
              continuous thread. This space ensures that every generation of
              the Awolowos remains connected, informed, and represented.
            </p>
          </motion.div>

          {/* Value 3 */}
          <motion.div
            className={styles.valueCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <BookOpen className={styles.icon} />
            <h4>Preserving Our Legacy</h4>
            <p>
              We are committed to documenting our history with intention —
              preserving stories, photographs, milestones, and memories so
              future generations of the Awolowo family can know exactly where
              they come from.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --------------------------- SECTION 3 --------------------------- */}
      <section className={styles.sectionAlt}>
        <motion.div
          className={styles.splitReverse}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.2 }}
        >
          <motion.div
            className={styles.imageBlock}
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Image
              src="/images/pee2.png"
              alt="Awolowo family generations"
              fill
              className={styles.sectionImage}
            />
          </motion.div>

          <motion.div
            className={styles.textBlock}
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h2 className={styles.heading}>A Story That Continues</h2>
            <p className={styles.text}>
              The Awolowo family story is still being written. This platform
              serves as a living archive — a place where memories are honored,
              loved ones are remembered, and every new chapter adds meaning to
              the legacy we leave behind.
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
