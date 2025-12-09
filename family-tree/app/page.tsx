'use client';

import styles from './page.module.css'
import Image from 'next/image';
import HeroImage from '../public/images/family15.png';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { testimonies } from './constants/Testimonies';
import Button from '../components/Button';
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const goToFamilyHeritagePlan = () => router.push("/familyHeritagePlan");
  const goToFamilyLegacyPlan = () => router.push("/familyLegacyPlan");
  const goToFamilyPremiumPlan = () => router.push("/familyPremiumPlan");
  const goToRegistration = () => router.push("/auth/register");
  

  // Automatically change testimonial every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonies.length);
    }, 5000);
    return () => clearInterval(interval);
  });

  return (
    <section className={styles.homepage}>
      <motion.section 
        className={styles.hero}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.overlay}></div>
        <div className={styles.heroText}>
          <div className={styles.HeroTextContent}>
            <h1>Preserve Your Legacy, <br/>Share Your Story.</h1>
            <p>A secure, private space to celebrate your family heritage.</p>
            <Button tag={'Start Your Family Tree'} onClick={goToRegistration}/>
          </div>
        </div>
        <div className={styles.heroBgImage}>
          <Image src={HeroImage} alt="Features Image" width={200} height={200} />
        </div>
      </motion.section>
      
      {/* Why Choose Family Tree */}
      <section className={styles.features}>
        <h1>Why Choose The Family Tree</h1>
        <div className={styles.cards}>
          <motion.div 
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.featureIcon}>
              🌿
            </div>
            <h3>Preserve Memories</h3>
            <p>Upload family photos and documents to protect your legacy.</p>
          </motion.div>
          <motion.div 
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.featureIcon}>
               👨‍👩‍👧‍👦
            </div>
            <h3>Connect Generations</h3>
            <p>Explore relationships and build your family tree interactively.</p>
          </motion.div>
          <motion.div 
            className={styles.card}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.featureIcon}>
              🛡️
            </div>
            <h3>Secure Your History</h3>
            <p>Your family&apos;s private archive, encrypted and backed up in the cloud.</p>
          </motion.div>
        </div>
      </section>

      {/* Video Clips */}
      <section className={styles.videoClip}>
        <h1>Visualize Your Family Legacy</h1>
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
        <h1>How It Works</h1>
        <div className={styles.howItWorksCards}>
          <motion.div 
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <p><span>1.</span> Create Your Family Tree</p>
          </motion.div>
          <motion.div 
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <p><span>2.</span> Invite Family Members</p>
          </motion.div>
          <motion.div 
            className={styles.howItWorksCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            viewport={{ once: true }}
          >
            <p><span>3.</span> Preserve and Share Memories</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <h1>Family Stories</h1>
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

    {/* PLANS */}
    <section className={styles.plans}>
      <h1>Our plans</h1>
      <div className={styles.planCards}>
        <motion.div 
          className={styles.plan}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          viewport={{ once: true }}
        >
          <h2>Family Heritage Plan</h2>
          <p>NGN350,000 Setup + NGN100,000/Year</p>
          <ul>
            <li>Private Family Website</li>
            <li>Basic Tree (up to 10 members)</li>
            <li>Photo and Video Gallery</li>
            <li>Event Calenders</li>
            <li>1GB Secured Storage</li>
          </ul>
          <Button tag={'Request Plan'} onClick={goToFamilyHeritagePlan}/>
        </motion.div>
        <motion.div 
          className={styles.plan}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          viewport={{ once: true }}
        >
          <h2>Family Legacy Plan</h2>
          <p>NGN500,000 Setup + NGN150,000/Year</p>
          <ul>
            <li>Private Family Website</li>
            <li>Basic Tree (up to 100 members)</li>
            <li>Photo and Video Gallery</li>
            <li>Event Calenders</li>
            <li>100GB Secured Storage</li>
          </ul>
          <Button tag={'Request Plan'} onClick={goToFamilyLegacyPlan}/>
        </motion.div>
        <motion.div 
          className={styles.plan}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          viewport={{ once: true }}
        >
          <h2>Family Premium Plan</h2>
          <p>NGN700,000 Setup + NGN200,000/Year</p>
          <ul>
            <li>Private Family Website</li>
            <li>Basic Tree (unlimited members)</li>
            <li>Photo and Video Gallery</li>
            <li>Event Calenders</li>
            <li>Unlimited Secured Storage</li>
          </ul>
          <Button tag={'Request Plan'} onClick={goToFamilyPremiumPlan}/>
        </motion.div>
      </div>
    </section>
  </section>
 )
}