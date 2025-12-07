/* eslint-disable react-hooks/set-state-in-effect */
// app/memorials/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./memorials.module.css";
import { Search } from "lucide-react";

/**
 * sample memorials
 */
const sample = [
  { id: "m1", name: "Elder Thomas", born: 1930, died: 2010, tribute: "Beloved community leader", bio: "Full biography...", picture: null },
  { id: "m2", name: "Aunty Rose", born: 1940, died: 2018, tribute: "Kind heart", bio: "Full biography...", picture: null },
];

export default function MemorialsPage() {
  const [memorials, setMemorials] = useState(sample);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [candles, setCandles] = useState<Record<string, number>>({});

  useEffect(() => {
    const raw = localStorage.getItem("ft_candles");
    if (raw) setCandles(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem("ft_candles", JSON.stringify(candles));
  }, [candles]);

  const filtered = memorials.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

  const lightCandle = (id: string) => {
    setCandles(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={styles.title}>Memorials — Forever in our Hearts</h1>
          <p className={styles.lead}>Create tributes, leave messages, and light a virtual candle.</p>
        </motion.div>
      </section>

      <section className={styles.searchWrap}>
        <div className={styles.searchInner}>
          <Search size={18} />
          <input placeholder="Search by name or year" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
      </section>

      <section className={styles.grid}>
        {filtered.map(m => (
          <motion.article key={m.id} className={styles.card} whileHover={{ scale: 1.02 }}>
            <div className={styles.cardHero} />
            <div className={styles.cardBody}>
              <h3>{m.name}</h3>
              <p className={styles.muted}>{m.born} — {m.died}</p>
              <p>{m.tribute}</p>
              <div className={styles.cardActions}>
                <button onClick={()=>setSelected(m.id)} className={styles.cta}>View Tribute</button>
                <button className={styles.candleBtn} onClick={()=>lightCandle(m.id)}>Light a candle ({candles[m.id]||0})</button>
              </div>
            </div>
          </motion.article>
        ))}
      </section>

      <AnimatePresence>
        {selected && (
          <motion.div className={styles.modalBack} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setSelected(null)}>
            <motion.div className={styles.modal} initial={{ y:8, scale:0.98 }} animate={{ y:0, scale:1 }} exit={{ y:8, scale:0.98 }} onClick={(e)=>e.stopPropagation()}>
              <button className={styles.close} onClick={()=>setSelected(null)}>Close</button>
              {(() => {
                const m = memorials.find(x=> x.id === selected)!;
                return (
                  <>
                    <h3>{m.name}</h3>
                    <p className={styles.muted}>{m.born} — {m.died}</p>
                    <p>{m.bio}</p>
                    <div style={{marginTop:12}}>
                      <textarea placeholder="Leave a condolence..." style={{width:"100%",minHeight:80}} />
                      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
                        <button className={styles.ghost} onClick={()=>alert("Saved locally (demo)")}>Post</button>
                        <button className={styles.cta} onClick={()=>{ lightCandle(m.id); alert("Candle lit"); }}>Light Candle</button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
