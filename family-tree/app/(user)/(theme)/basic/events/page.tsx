/* eslint-disable react-hooks/set-state-in-effect */
// app/events/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./events.module.css";
import { Calendar, MapPin, Clock } from "lucide-react";

/**
 * Sample data — replace with your API
 */
const sampleEvents = [
  {
    id: "e1",
    title: "Annual Family Reunion",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    location: "Grand Park",
    description: "Picnic, games, and catch-up.",
    image: null,
  },
  {
    id: "e2",
    title: "Aunt Mary's 70th",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    location: "Community Hall",
    description: "Birthday celebration with dinner.",
    image: null,
  },
];

function isFuture(dateISO: string) {
  return new Date(dateISO) > new Date();
}

export default function EventsPage() {
  const [events, setEvents] = useState<typeof sampleEvents>(sampleEvents);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selected, setSelected] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({});
  const nextEvent = useMemo(() => events.filter(e => isFuture(e.date)).sort((a,b)=> +new Date(a.date)-+new Date(b.date))[0], [events]);

  useEffect(()=> {
    // load RSVP from localStorage
    const raw = localStorage.getItem("ft_rsvps");
    if (raw) setRsvps(JSON.parse(raw));
  }, []);

  useEffect(()=> {
    localStorage.setItem("ft_rsvps", JSON.stringify(rsvps));
  }, [rsvps]);

  const toggleRsvp = (id: string) => {
    setRsvps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addEvent = () => {
    const id = `e${Date.now()}`;
    setEvents(prev => [{id, title:"New Event", date: new Date().toISOString(), location: "TBD", description:"", image: null}, ...prev]);
  };

  const upcoming = events.filter(e => isFuture(e.date));
  const past = events.filter(e => !isFuture(e.date));

  // Countdown state
  const [countdown, setCountdown] = useState<string>("");
  useEffect(() => {
    if (!nextEvent) { setCountdown(""); return; }
    const update = () => {
      const diff = +new Date(nextEvent.date) - Date.now();
      if (diff <= 0) { setCountdown("Happening now"); return; }
      const days = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff / (1000*60*60)) % 24);
      const mins = Math.floor((diff / (1000*60)) % 60);
      setCountdown(`${days}d ${hours}h ${mins}m`);
    };
    update();
    const t = setInterval(update, 1000*30);
    return () => clearInterval(t);
  }, [nextEvent]);

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={styles.title}>Events — Gatherings & Reunions</h1>
          <p className={styles.lead}>
            Keep everyone in the loop. RSVP, view details, and add to your calendar.
          </p>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={addEvent}>Create Event</button>
            <button className={styles.ghost}>Import Calendar</button>
          </div>
        </motion.div>
      </section>

      <section className={styles.countdown}>
        <div>
          <small className={styles.muted}>Next event</small>
          <h3>{nextEvent ? nextEvent.title : "No upcoming events"}</h3>
          <div className={styles.countdownRow}>
            <Clock size={18} /> <strong>{countdown}</strong>
          </div>
        </div>
      </section>

      <section className={styles.tabs}>
        <div className={styles.tabBtns}>
          <button className={tab==="upcoming" ? styles.active : ""} onClick={()=>setTab("upcoming")}>Upcoming</button>
          <button className={tab==="past" ? styles.active : ""} onClick={()=>setTab("past")}>Past</button>
        </div>

        <div className={styles.grid}>
          {(tab==="upcoming" ? upcoming : past).map((ev) => (
            <motion.article key={ev.id} className={styles.eventCard} initial={{ opacity: 0, y: 8 }} whileHover={{ scale: 1.01 }}>
              <div className={styles.eventMeta}>
                <div>
                  <small className={styles.muted}>{new Date(ev.date).toLocaleDateString()}</small>
                  <h4>{ev.title}</h4>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.rsvp} onClick={()=>toggleRsvp(ev.id)}>{rsvps[ev.id] ? "Cancel RSVP" : "RSVP"}</button>
                  <button className={styles.details} onClick={()=>setSelected(ev.id)}>Details</button>
                </div>
              </div>
              <div className={styles.eventFooter}>
                <MapPin size={14} /> <span className={styles.muted}>{ev.location}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <motion.div className={styles.modalBack} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setSelected(null)}>
            <motion.div className={styles.modal} initial={{ y: 8, scale: 0.98 }} animate={{ y:0, scale: 1 }} exit={{ y: 8, scale:0.98 }} onClick={(e)=>e.stopPropagation()}>
              <button className={styles.close} onClick={()=>setSelected(null)}>Close</button>
              {(() => {
                const ev = events.find(x => x.id === selected)!;
                return (
                  <>
                    <h3>{ev.title}</h3>
                    <p className={styles.muted}>{new Date(ev.date).toLocaleString()}</p>
                    <p>{ev.description}</p>
                    <div className={styles.modalActions}>
                      <button className={styles.primary} onClick={()=>toggleRsvp(ev.id)}>
                        {rsvps[ev.id] ? "Cancel RSVP" : "RSVP"}
                      </button>
                      <button className={styles.ghost}>Add to Calendar</button>
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
