'use client'

import Image from 'next/image'
import styles from './about.module.css'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useState } from 'react'

import HeroImage from '../../public/images/pee2.png'
import Icon from '../../public/images/script-svgrepo-com.svg'

export default function About() {
  const [startCount, setStartCount] = useState(false)
  
  return (
    <main className={styles.aboutPage}>
      {/* Hero Section */}
      <motion.section
        className={styles.heroSection}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h1>About TheFamilyTree</h1>
        <p>Connecting generations through stories, love, and legacy.</p>
      </motion.section>

      {/* Our Story */}
      <motion.section
        className={styles.storySection}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className={styles.storyContainer}>
          <motion.div
            className={styles.storyImage}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src={HeroImage}
              alt="Our Story"
              width={500}
              height={500}
              className={styles.roundedImage}
            />
          </motion.div>

          <div className={styles.storyText}>
            <h2>Our Story</h2>
            <p>
              FamilyTree was founded with one goal — to help families everywhere
              preserve their heritage, strengthen their bonds, and tell their stories
              for generations to come. In a world moving faster than ever, we believe
              that connection starts with remembering where we come from.
            </p>
            <p>
              From grandparents to newborns, every generation deserves to be remembered.
              FamilyTree makes this possible through modern storytelling tools, photo archives,
              and private family networks designed for the digital age.
            </p>

             <motion.div
                className={styles.stats}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                onViewportEnter={() => setStartCount(true)} // triggers count once when visible
              >
                <motion.div whileHover={{ scale: 1.05 }}>
                  <h3>
                    {startCount && <CountUp end={2000} duration={3} suffix="+" />}
                  </h3>
                  <p>Families Connected</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }}>
                  <h3>
                    {startCount && <CountUp end={10000} duration={3} suffix="+" />}
                  </h3>
                  <p>Memories Shared</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }}>
                  <h3>
                    {startCount && <CountUp end={500} duration={3} suffix="+" />}
                  </h3>
                  <p>Communities Built</p>
                </motion.div>
              </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Vision and Mission */}
      <motion.section
        className={styles.visionSection}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <div className={styles.visionContainer}>
          <div className={styles.visionContent}>
            <div className={styles.visionText}>
          <h2>Vision & Mission</h2>
              <h3>Our Vision</h3>
              <p>
                To become the most trusted digital space for families worldwide —
                where memories never fade and every generation feels connected.
              </p>

              <h3>Our Mission</h3>
              <p>
                We’re on a mission to empower families with the tools to document,
                celebrate, and share their legacy through storytelling and technology.
              </p>
            </div>

            <motion.div
              className={styles.visionImage}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              <Image
                src={HeroImage}
                alt="Vision & Mission"
                width={300}
                height={300}
                className={styles.roundedImage}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Core Values */}
      <section className={styles.valuesSection}>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Our Core Values
        </motion.h2>

        <div className={styles.valuesGrid}>
          <motion.div whileHover={{ scale: 1.05 }} className={styles.valueCard}>
            <h3>Connection</h3>
            <p>We bring families closer — across generations and across the globe.</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className={styles.valueCard}>
            <h3>Innovation</h3>
            <p>We combine family history with modern technology to make memories timeless.</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className={styles.valueCard}>
            <h3>Trust</h3>
            <p>Your stories are sacred — we protect them with love, privacy, and care.</p>
          </motion.div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className={styles.teamSection}>
        <h2>Meet Our Team</h2>
        <div className={styles.teamGrid}>
          {[Icon, Icon, Icon].map((img, i) => (
            <motion.div
              key={i}
              className={styles.teamCard}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Image
                src={img}
                alt={`Team member ${i + 1}`}
                width={200}
                height={200}
                className={styles.teamImage}
              />
              <h4>Member {i + 1}</h4>
              <p>Role / Department</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}
