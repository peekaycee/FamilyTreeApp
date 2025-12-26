"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "./events.module.css";
import { Calendar, MapPin, Clock, Plus, Download } from "lucide-react";

/* ================= TYPES ================= */

interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  images: string[];
}

/* ================= HELPERS ================= */

function isFuture(dateISO: string) {
  return new Date(dateISO) > new Date();
}

/* ================= ICS EXPORT ================= */

function buildICS(events: EventItem[]) {
  const body = events
    .map((event) => {
      const start = new Date(event.date)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0];

      return `
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
DTSTART:${start}
END:VEVENT`;
    })
    .join("");

  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Family Events//EN
${body}
END:VCALENDAR
`.trim();
}

function downloadICS(events: EventItem[], filename = "events.ics") {
  const blob = new Blob([buildICS(events)], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/* ================= ICS IMPORT ================= */

function parseICS(text: string): EventItem[] {
  const events: EventItem[] = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);

  blocks.forEach((block, i) => {
    const get = (key: string) =>
      block.match(new RegExp(`${key}[:;](.*)`))?.[1]?.trim() ?? "";

    const title = get("SUMMARY");
    const description = get("DESCRIPTION");
    const location = get("LOCATION");
    const rawDate = get("DTSTART");

    if (!title || !rawDate) return;

    const clean = rawDate.replace("Z", "");
    const date = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(
      6,
      8
    )}T${clean.slice(9, 11)}:${clean.slice(11, 13)}`;

    events.push({
      id: `ics_${Date.now()}_${i}`,
      title,
      description,
      location,
      date,
      images: [],
    });
  });

  return events;
}

/* ================= MAIN PAGE ================= */

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importPreview, setImportPreview] = useState<EventItem[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ================= IMPORT HANDLER ================= */

  const handleImportCalendar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseICS(reader.result as string);

      const deduped = parsed.filter(
        (p) => !events.some((e) => e.title === p.title && e.date === p.date)
      );

      if (deduped.length) setImportPreview(deduped);
    };
    reader.readAsText(file);
  };

  /* ================= SORTED EVENTS ================= */

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => isFuture(e.date))
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [events]
  );

  const past = useMemo(
    () =>
      events
        .filter((e) => !isFuture(e.date))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [events]
  );

  const nextEvent = upcoming[0];

  /* ================= COUNTDOWN ================= */

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

  /* ================= SAVE EVENT ================= */

  const saveEvent = (ev: EventItem) => {
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === ev.id);
      return exists ? prev.map((e) => (e.id === ev.id ? ev : e)) : [ev, ...prev];
    });

    setShowForm(false);
    setEditing(null);
  };

  /* ================= RENDER ================= */

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

          <button
            className={styles.ghost}
            onClick={() => fileInputRef.current?.click()}
          >
            <Calendar size={16} /> Import Calendar
          </button>

          <button
            className={styles.ghost}
            onClick={() => downloadICS(events, "family-events.ics")}
          >
            <Download size={16} /> Export All
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".ics"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportCalendar(file);
              e.currentTarget.value = "";
            }}
          />
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
          <button
            className={tab === "upcoming" ? styles.active : ""}
            onClick={() => setTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={tab === "past" ? styles.active : ""}
            onClick={() => setTab("past")}
          >
            Past
          </button>
        </div>

        <div className={styles.grid}>
          {(tab === "upcoming" ? upcoming : past).map((ev) => (
            <motion.article
              key={ev.id}
              className={styles.eventCard}
              whileHover={{ y: -4 }}
            >
              <small>{new Date(ev.date).toLocaleDateString()}</small>
              <h4>{ev.title}</h4>

              <div className={styles.eventFooter}>
                <MapPin size={14} /> {ev.location}
              </div>

              <div className={styles.cardActions}>
                <button onClick={() => setSelected(ev)}>Details</button>
                <button
                  onClick={() => {
                    setEditing(ev);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* IMPORT PREVIEW MODAL */}
      <AnimatePresence>
        {importPreview && (
          <motion.div
            className={styles.modalBack}
            onClick={() => setImportPreview(null)}
          >
            <motion.div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Import {importPreview.length} Event(s)?</h3>

              <ul>
                {importPreview.map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.title}</strong> —{" "}
                    {new Date(ev.date).toLocaleString()}
                  </li>
                ))}
              </ul>

              <div className={styles.modalActions}>
                <button
                  className={styles.ghost}
                  onClick={() => setImportPreview(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.cta}
                  onClick={() => {
                    setEvents((prev) => [...importPreview, ...prev]);
                    setImportPreview(null);
                  }}
                >
                  Confirm Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className={styles.modalBack}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{selected.title}</h3>
              <p>{new Date(selected.date).toLocaleString()}</p>
              <p>{selected.description}</p>

              <div className={styles.imageStrip}>
                {selected.images.map((img, i) => (
                  <Image key={i} src={img} alt="" width={80} height={80} />
                ))}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={() => downloadICS([selected], `${selected.title}.ics`)}
                >
                  Add to Calendar
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
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ================= EVENT FORM ================= */

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
    const previews = Array.from(files).map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...previews]);
  };

  return (
    <motion.div className={styles.modalBack}>
      <motion.form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: initial?.id ?? `e_${Date.now()}`,
            title,
            date,
            location,
            description,
            images,
          });
        }}
      >
        <h3>{initial ? "Edit Event" : "Create Event"}</h3>

        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input value={location} onChange={(e) => setLocation(e.target.value)} />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input type="file" multiple accept="image/*" onChange={(e) => handleImages(e.target.files)} />

        <div className={styles.imageStrip}>
          {images.map((img, i) => (
            <Image key={i} src={img} alt="" width={80} height={80} />
          ))}
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.cta} type="submit">
            Save Event
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
