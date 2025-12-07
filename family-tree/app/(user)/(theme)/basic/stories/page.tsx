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
            A journey through generations — preserving memories, honoring heritage, 
            and celebrating the beautiful connections that make each family unique.
          </p>
        </div>

        <motion.div
          className={styles.heroImageWrap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <Image
            src="/images/pee2.png"
            alt="Family Legacy"
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
              Every Family Has a Story Worth Telling
            </h2>
            <p className={styles.text}>
              The Family Tree was born from a simple belief — that memories 
              fade, but stories live forever when preserved with intention.  
              Our mission is to help families document their legacy, 
              celebrate their roots, and keep generations connected.
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
              alt="Family"
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
          What We Stand For
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
            <h4>Love & Connection</h4>
            <p>
              We cherish the bonds that make every family unique — the laughter, 
              the challenges, and the moments that shape who we are.
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
            <h4>Generational Unity</h4>
            <p>
              Our platform helps bridge the gap between the past, present, and future, 
              giving every generation a voice and a place in the story.
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
            <h4>Legacy Preservation</h4>
            <p>
              We believe in documenting memories the right way — thoughtfully, 
              beautifully, and in a format that future generations can truly treasure.
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
              alt="Family generations"
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
            <h2 className={styles.heading}>A Legacy That Lives On</h2>
            <p className={styles.text}>
              The Family Tree is more than a digital archive — it is a place 
              where stories are honored, loved ones are remembered, and 
              generations stay connected no matter how far apart they may be.
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
