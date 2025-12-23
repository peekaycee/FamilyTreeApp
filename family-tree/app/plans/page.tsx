'use client';

import styles from './plan.module.css'
import { motion } from 'framer-motion';
import Button from '../../components/Button';
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const goToFamilyHeritagePlan = () => router.push("/familyHeritagePlan");
  const goToFamilyLegacyPlan = () => router.push("/familyLegacyPlan");
  const goToFamilyPremiumPlan = () => router.push("/familyPremiumPlan");

  return (
    <section className={styles.homepage}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1>Our Plans</h1>
      </section>
      {/* PLANS */}
      <section className={styles.plans}>
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
