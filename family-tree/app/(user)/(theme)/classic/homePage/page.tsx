'use client';

import styles from './homepage.module.css'
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { testimonies } from '../../../../constants/Testimonies';
import Button from '../../../../../components/Button';
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const goToFamilyHeritagePlan = () => router.push("/familyHeritagePlan");
  const goToFamilyLegacyPlan = () => router.push("/familyLegacyPlan");
  const goToFamilyPremiumPlan = () => router.push("/familyPremiumPlan");
  const goToDashboard = () => router.push("/dashboard");
  

  // Automatically change testimonial every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonies.length]);

  return (
    <section className={styles.homepage}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Preserve Your Legacy, Share Your Story. (Users)</h1>
          <p>A secure, private space to celebrate your family heritage.</p>
          <p>Classic Theme</p>
          <Button tag={'Start Your Family Tree'} onClick={goToDashboard}/>
        </div>
        <div className={styles.heroBgImage}>
        </div>
      </section>
      
      {/* Why Choose Family Tree */}
      <section className={styles.features}>
        <h1>Why Choose Family Tree</h1>
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.featureIcon}>
              {/* <Image src={Icon} alt="Features Image" width={40} height={40} /> */}
            </div>
            <h3>Preserve Memories</h3>
            <p>Upload family photos and documents to protect your legacy.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.featureIcon}>
              {/* <Image src={Icon} alt="Features Image" width={40} height={40} /> */}
            </div>
            <h3>Connect Generations</h3>
            <p>Explore relationships and build your family tree interactively.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.featureIcon}>
              {/* <Image src={Icon} alt="Features Image" width={40} height={40} /> */}
            </div>
            <h3>Secure Your History</h3>
            <p>Your family&apos;s private archive, encrypted and backed up in the cloud.</p>
          </div>
        </div>
      </section>

      {/* Video Clips */}
      <section className={styles.videoClip}>
        <h1>Visualize Your Family Legacy</h1>
        <div className={styles.video}>
          <video muted loop autoPlay>
            <source src="/videos/Hema-vid.mp4" type="video/mp4"></source>
          </video>
        </div>
      </section>
      
      {/* How It Works */}
      <section className={styles.howItWorks}>
        <h1>How It Works</h1>
        <div className={styles.howItWorksCards}>
          <div className={styles.howItWorksCard}>
            <p><span>1.</span> Create Your Family Tree</p>
          </div>
          <div className={styles.howItWorksCard}>
            <p><span>2.</span> Invite Family Members</p>
          </div>
          <div className={styles.howItWorksCard}>
            <p><span>3.</span> Preserve and Share Memories</p>
          </div>
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
                  style={{ width: '100%', flexShrink: 0 }}
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
        <div className={styles.plan}>
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
        </div>
        <div className={styles.plan}>
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
        </div>
        <div className={styles.plan}>
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
        </div>
      </div>
    </section>
  </section>
  )
}
