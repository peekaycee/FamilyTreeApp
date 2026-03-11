"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import styles from "./events.module.css";
import { Calendar, MapPin, Clock, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

interface EventItem {
  id?: string;
  title: string;
  date: string;
  location: string;
  description: string;
  images: string[];
  user_id?: string;
}

type ToastType = "success" | "error" | "info";

/* ================= CONSTANTS ================= */

const PLACEHOLDER_IMAGE = "/images/image-placeholder.png";

/* ================= HELPERS ================= */

function isFuture(dateISO: string) {
  return new Date(dateISO) > new Date();
}

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

/* ================= MAIN PAGE ================= */

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importPreview, setImportPreview] = useState<EventItem[] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("info");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);


 /* ================= TOAST ================= */
  const showToast = (msg: string, type: ToastType = "info") => {
    setToastMessage(msg);
    setToastType(type);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  /* ================= AUTH FETCH ================= */
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, { ...init, credentials: "include" });
    if (res.status === 401) {
      if(!toastMessage){
        showToast("Session expired. Please login again.", "error");
      }
      setTimeout(() => router.replace("/auth/login"), 1500);
      throw new Error("Session expired");
    }
    return res;
  };

/* ================= LOAD EVENTS ================= */
const fetchEvents = async () => {
  try {
    const res = await authFetch("/api/events", { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch events");
    const data: EventItem[] = await res.json();
    setEvents(data);
  } catch (err: any) {
    // Only push a toast if it's NOT a session expired error
    if (err.message !== "Session expired") {
      showToast("Failed to load events", "error");
    }
    console.error(err);
  }
};

useEffect(() => {
    fetchEvents();
  }, []);

  /* ================= IMPORT / EXPORT ================= */
  const handleImportCalendar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed: EventItem[] = [];
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

          parsed.push({
            title,
            description,
            location,
            date,
            images: [PLACEHOLDER_IMAGE],
          });
        }); 

        const deduped = parsed.filter(
          (p) => !events.some((e) => e.title === p.title && e.date === p.date)
        );

        if (!deduped.length) {
          showToast("No new events to import", "error");
          return;
        }
        setImportPreview(deduped);
      } catch {
        showToast("Failed to import calendar", "error");
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!importPreview) return;

    try {
      const res = await authFetch("/api/events/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: importPreview }),
      });
      if (!res.ok) throw new Error("Import failed");
      const data: EventItem[] = await res.json();
      await fetchEvents();
      setImportPreview(null);
      showToast(`Imported ${data.length} event(s)`, "success");
    } catch {
      showToast("Failed to import events", "error");
    }
  };

  /* ================= SORTED ================= */

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

  /* ================= SAVE / UPDATE / DELETE ================= */

  const saveEvent = async (ev: Partial<EventItem>, files?: FileList | null) => {
  try {
    // Ensure images is always an array
    let uploadedUrls: string[] = (ev.images ?? []).filter((url) => !url.startsWith("blob:"));


    // 1. Upload new images
    if (files && files.length) {
      const promises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/events/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        return data.url as string;
      });

      const newUrls = await Promise.all(promises);
      uploadedUrls = [...uploadedUrls, ...newUrls];
    }


    // 2. Save event with uploaded image URLs
    const body = { ...ev, images: uploadedUrls };

    // Use POST for new, PATCH for existing
    const method = ev.id ? "PATCH" : "POST";

    const res = await authFetch("/api/events", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    let data;
    try { data = await res.json(); } catch { data = null; }

    if (!res.ok) throw new Error(data?.error || "Failed to save event");

    await fetchEvents();
    setShowForm(false);
    setEditing(null);
    showToast(ev.id ? "Event updated successfully" : "Event created successfully", "success");
  } catch (err: any) {
    console.error("SAVE EVENT ERROR:", err);
    showToast(err.message || "Failed to save event", "error");
  }
};


  const deleteEvent = async (id: string) => {
    try {
      const res = await authFetch(`/api/events?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      await fetchEvents();
        showToast("Event deleted successfully", "success");
    } catch {
      showToast("Failed to delete event", "error");
    }
  };

  /* ================= RENDER ================= */

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <h1>Family Events & Gatherings</h1>
        <p>Plan, remember, and celebrate moments together.</p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Create Event
          </button>

          <button type="button" className={styles.ghost} onClick={() => fileInputRef.current?.click()}>
            <Calendar size={16} /> Import Calendar
          </button>

          <button
            type="button"
            className={styles.ghost}
            onClick={() => {
              try {
                downloadICS(events, "family-events.ics");
                showToast("Events exported successfully", "success");
              } catch {
                showToast("Export failed", "error");
              }
            }}
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
            type="button"
            className={tab === "upcoming" ? styles.active : ""}
            onClick={() => setTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            type="button"
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
                <button type="button" onClick={() => setSelected(ev)}>
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(ev);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => ev.id && deleteEvent(ev.id)}
                >
                  Delete
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* IMPORT PREVIEW */}
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
                  <li key={ev.title}>
                    <strong>{ev.title}</strong> — {new Date(ev.date).toLocaleString()}
                  </li>
                ))}
              </ul>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setImportPreview(null)}
                >
                  Cancel
                </button>
                <button type="button" className={styles.cta} onClick={confirmImport}>
                  Confirm Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILS */}
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
                  <Image key={i} src={img} alt="" width={80} height={80} unoptimized/>
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
                  onClick={() =>
                    downloadICS([selected], `${selected.title}.ics`)
                  }
                >
                  Add to Calendar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM */}
      <AnimatePresence>
        {showForm && (
          <EventForm
            initial={editing}
            onSave={saveEvent}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
            pushToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* TOASTS */}
      {toastMessage && (
        <div className={`${styles.toastWrap} ${styles.toast} ${styles[toastType]}`}>
          <p>{toastMessage}</p>
        </div>
      )}
    </main>
  );
}

/* ================= EVENT FORM ================= */

function EventForm({
  initial,
  onSave,
  onClose,
  pushToast,
}: {
  initial: EventItem | null;
  onSave: (e: Partial<EventItem>, files?: FileList | null) => void;
  onClose: () => void;
  pushToast: (msg: string, type?: ToastType) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [files, setFiles] = useState<FileList | null>(null);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    setFiles(files);
    const previews = Array.from(files).map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...previews]);
  };

  return (
    <motion.div className={styles.modalBack}>
      <motion.form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title || !date || !location || !description) {
            pushToast("Please fill in all required fields.", "error");
            return;
          }
          onSave({ id: initial?.id, title, date, location, description, images }, files);
        }}
      >
        <h3>{initial ? "Edit Event" : "Create Event"}</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event Title" />
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <input type="file" multiple accept="image/*" onChange={(e) => handleImages(e.target.files)} />
        <div className={styles.imageStrip}>
          {images.map((img, i) => <Image key={i} src={img} alt="" width={80} height={80} unoptimized/>)}
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.ghost} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.cta}>Save Event</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
