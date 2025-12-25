'use client';

import styles from './homepage.module.css'
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

export default function HomePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const goToStory = () => router.push("/basic/stories");
  const goToTree = () => router.push('/basic/dashboard/family-builder');
  const goToMembers = () => router.push('/basic/members');
  

  // Automatically change testimonial every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonies.length);
    }, 5000);
    return () => clearInterval(interval);
  });

  return (
    <section className={styles.homepage}>
      <section className={styles.hero}>
        <div className={styles.overlay}></div>
        <div className={styles.heroText}>
          <h1>Welcome Home! <br /> The Awolowo Family</h1>
          <p>Celebrating our roots, memories, and enduring legacy.</p>
          <Button tag={'Explore Our Story'} onClick={goToStory}/>
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
        <Image src={Family16} alt="Memory 1" width={200} height={200} />
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
        <Image src={Family19} alt="Memory 2" width={200} height={200} />
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
        <Image src={Family25} alt="Memory 3" width={200} height={200} />
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
        <Image src={Family26} alt="Memory 3" width={200} height={200} />
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
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
             <div className={styles.featureIcon}>🌿</div>
            <h3>Preserve Our Heritage</h3>
            <p>
             Safely store photographs, documents, and stories that define who we are as a family.
            </p>
          </motion.div>
          <motion.div 
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.featureIcon}>👨‍👩‍👧‍👦</div>
            <h3>Connect Generations</h3>
            <p>Visualize relationships, understand lineage, and keep everyone connected.</p>
          </motion.div>
          <motion.div 
                      className={styles.card}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.2 }}
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
        <h1>Our Story, Brought to Life</h1>
        <motion.div 
          className={styles.video}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          viewport={{ once: true }}
        >
          <video muted loop autoPlay>
            <source src="/videos/TFTVid.mp4" type="video/mp4"></source>
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
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <p><span>1.</span> Build The Family Tree</p>
          </motion.div>
          <motion.div 
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <p><span>2.</span> Add Family Members & Stories</p>
          </motion.div>
          <motion.div 
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
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
              animate={{ x: -current * 100 + '%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className={styles.testimonySlider}
              style={{
                display: 'flex',
                width: `${testimonies.length * 100}%`,
              }}
            >
              {testimonies.map((t) => (
                <div
                  key={t.id}
                  className={styles.testimonyItem}
                >
                  <div className={styles.testimonyImage}>
                    <Image src={t.image} alt="testifier" width={200} height={200} />
                  </div>
                  <div className={styles.testifierText}>
                    <p>{t.text}</p>
                    <p>
                      - <em>{t.name}</em>
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED ANCESTORS */}
       <section className={styles.featuredAncestors}>
         <h1>Legacy Spotlight</h1>
         <p>
           Honoring the pillars of the Awolowo family whose courage, wisdom, and
           sacrifices shaped generations.
         </p>

         <div className={styles.ancestorCards}>
           <motion.div 
              className={styles.ancestorCard}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              viewport={{ once: true }}
            >
             <Image src={Family16} alt="Ancestor" width={220} height={220} />
             <h3>Chief Samuel Awolowo</h3>
             <p>
               A visionary leader whose values of unity and discipline continue
               to guide our family today.
             </p>
           </motion.div>

           <motion.div 
              className={styles.ancestorCard}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              viewport={{ once: true }}
            >             <Image src={Family19} alt="Ancestor" width={220} height={220} />
             <h3>Madam Esther Awolowo</h3>
             <p>
               The heart of the family—known for resilience, kindness, and
               unwavering faith.
             </p>
           </motion.div>
         </div>
         <Button tag="View Family Members" onClick={goToMembers} />
       </section>

       {/* CTA */}
       <section className={styles.ctaSection}>
         <h1>Every Name Has a Story</h1>
         <p>
           Help us complete the Awolowo family legacy by adding members,
           memories, and stories that must never be forgotten.
         </p>

         <div className={styles.ctaActions}>
           <Button tag="Add Family Members" onClick={goToTree} />
           <Button tag="Continue Exploring" onClick={goToStory} />
         </div>
       </section>
  </section>
  )
}