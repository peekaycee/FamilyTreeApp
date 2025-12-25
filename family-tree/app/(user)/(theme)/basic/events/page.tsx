"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "./events.module.css";
import { Calendar, MapPin, Clock, Plus } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  images: string[];
}

function isFuture(dateISO: string) {
  return new Date(dateISO) > new Date();
}

/* ===== ICS CALENDAR UTILS ===== */
function downloadICS(event: EventItem) {
  const start = new Date(event.date).toISOString().replace(/[-:]/g, "").split(".")[0];
  const ics = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
DTSTART:${start}
END:VEVENT
END:VCALENDAR
`.trim();

  const blob = new Blob([ics], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title}.ics`;
  link.click();
}

/* ===== MAIN PAGE ===== */
export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  /* ===== SORTED EVENTS ===== */
  const upcoming = useMemo(
    () =>
      events
        .filter(e => isFuture(e.date))
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [events]
  );

  const past = useMemo(
    () =>
      events
        .filter(e => !isFuture(e.date))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [events]
  );

  const nextEvent = upcoming[0];

  /* ===== COUNTDOWN ===== */
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!nextEvent) return;
    const tick = () => {
      const diff = +new Date(nextEvent.date) - Date.now();
      if (diff <= 0) return setCountdown("Happening now");
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      setCountdown(`${d}d ${h}h ${m}m`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [nextEvent]);

  /* ===== SAVE EVENT ===== */
  const saveEvent = (ev: EventItem) => {
    setEvents(prev => {
      const exists = prev.find(e => e.id === ev.id);
      if (exists) {
        return prev.map(e => (e.id === ev.id ? ev : e));
      }
      return [ev, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <h1>Family Events & Gatherings</h1>
        <p>Plan, remember, and celebrate moments together.</p>

        <div className={styles.actions}>
          <button className={styles.primary} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Create Event
          </button>
          <button className={styles.ghost}>
            <Calendar size={16} /> Import Calendar
          </button>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className={styles.countdown}>
        <small>Next Event</small>
        <h3>{nextEvent?.title ?? "No upcoming events"}</h3>
        {nextEvent && (
          <div className={styles.countdownRow}>
            <Clock size={16} /> <strong>{countdown}</strong>
          </div>
        )}
      </section>

      {/* TABS */}
      <section className={styles.tabs}>
        <div className={styles.tabBtns}>
          <button className={tab === "upcoming" ? styles.active : ""} onClick={() => setTab("upcoming")}>
            Upcoming
          </button>
          <button className={tab === "past" ? styles.active : ""} onClick={() => setTab("past")}>
            Past
          </button>
        </div>

        <div className={styles.grid}>
          {(tab === "upcoming" ? upcoming : past).map(ev => (
            <motion.article key={ev.id} className={styles.eventCard} whileHover={{ y: -4 }}>
              <small>{new Date(ev.date).toLocaleDateString()}</small>
              <h4>{ev.title}</h4>

              <div className={styles.eventFooter}>
                <MapPin size={14} /> {ev.location}
              </div>

              <div className={styles.cardActions}>
                <button onClick={() => setSelected(ev)}>Details</button>
                <button onClick={() => { setEditing(ev); setShowForm(true); }}>
                  Edit
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div className={styles.modalBack} onClick={() => setSelected(null)}>
            <motion.div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h3>{selected.title}</h3>
              <p>{new Date(selected.date).toLocaleString()}</p>
              <p>{selected.description}</p>

              <div className={styles.imageStrip}>
                {selected.images.map((img, i) => (
                  <Image key={i} src={img} alt="Event Image" width={80} height={80} />
                ))}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.primary} onClick={() => downloadICS(selected)}>
                  Add to Calendar
                </button>
                <button className={styles.ghost} onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT FORM */}
      <AnimatePresence>
        {showForm && (
          <EventForm
            initial={editing}
            onSave={saveEvent}
            onClose={() => { setShowForm(false); setEditing(null); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ===== EVENT FORM ===== */
function EventForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EventItem | null;
  onSave: (e: EventItem) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const previews = Array.from(files).map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...previews]);
  };

  return (
    <motion.div className={styles.modalBack}>
      <motion.form className={styles.form} onSubmit={e => {
        e.preventDefault();
        onSave({
          id: initial?.id ?? `e_${Date.now()}`,
          title,
          date,
          location,
          description,
          images,
        });
      }}>
        <h3>{initial ? "Edit Event" : "Create Event"}</h3>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" required />
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />

        <input type="file" multiple accept="image/*" onChange={e => handleImages(e.target.files)} />

        <div className={styles.imageStrip}>
          {images.map((img, i) => (
            <Image key={i} src={img} alt="Event Image" width={80} height={80} />
          ))}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.primary} type="submit">
            Save Event
          </button>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancel
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
