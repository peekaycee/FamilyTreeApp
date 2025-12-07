// app/achievements/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import styles from "./achievements.module.css";
import { Star, Trophy } from "lucide-react";

const sample = [
  { id: "a1", title: "MBA Graduate", person: "Oluchi", year: 2020, category: "Academics", badge: "gold", img: null, detail: "Completed MBA with distinction." },
  { id: "a2", title: "National Champion (Athletics)", person: "Chima", year: 2018, category: "Sports", badge: "gold", img: null, detail: "Won national 400m." },
  { id: "a3", title: "Community Award", person: "Ngozi", year: 2022, category: "Community", badge: "silver", img: null, detail: "Led community empowerment projects." },
];

const categories = ["All", "Academics", "Sports", "Arts", "Community", "Entrepreneurship"];

export default function AchievementsPage() {
  const [achievements] = useState(sample);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => achievements.filter(a => (filter === "All" || a.category === filter) && (a.title + a.person + a.year).toLowerCase().includes(q.toLowerCase())), [achievements, filter, q]);

  const leaderboard = useMemo(() => {
    const counts: Record<string, number> = {};
    achievements.forEach(a => counts[a.person] = (counts[a.person] || 0) + 1);
    return Object.entries(counts).sort((a,b)=> b[1]-a[1]).slice(0,5);
  }, [achievements]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
          <h1 className={styles.title}>Achievements</h1>
          <p className={styles.lead}>Celebrate academic, sporting and life milestones across the family.</p>
        </motion.div>
      </section>

      <section className={styles.controls}>
        <input placeholder="Search achievements" value={q} onChange={(e)=>setQ(e.target.value)} />
        <div className={styles.filterRow}>
          {categories.map(c => <button key={c} className={filter===c?styles.active:''} onClick={() => setFilter(c)}>{c}</button>)}
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.gridLeft}>
          {filtered.map(a => (
            <motion.article className={styles.card} key={a.id} whileHover={{ scale: 1.01 }}>
              <div className={styles.cardLeft}>
                <div className={`${styles.badge} ${styles[a.badge]}`}><Star size={16} /></div>
              </div>
              <div className={styles.cardBody}>
                <h3>{a.title}</h3>
                <p className={styles.muted}>{a.person} • {a.year}</p>
                <p>{a.detail}</p>
              </div>
            </motion.article>
          ))}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.leader}>
            <h4>Top achievers</h4>
            <ol>
              {leaderboard.map(([person, count]) => (
                <li key={person}><strong>{person}</strong> <span className={styles.muted}>({count})</span></li>
              ))}
            </ol>
            <button className={styles.cta}>Submit an Achievement</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
