"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./members.module.css";
import { useRouter } from "next/navigation";
import Placeholder from "@/public/images/image-placeholder-removebg-preview.png";


/* ================= TYPES ================= */

interface MemberRow {
  id: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  created_at: string | null;
}

/* ================= MAIN PAGE ================= */

export default function FamilyMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [search, setSearch] = useState("");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const gridRef = useRef<HTMLDivElement | null>(null);


   /* ================= AUTH FETCH ================= */
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, { ...init, credentials: "include" });
    if (res.status === 401) {
      router.replace("/auth/login"); // redirect if auth fails
      throw new Error("Session expired");
    }
    return res;
  };

  /* ================= FETCH MEMBERS ================= */

  const fetchMembers = async () => {
    try {
      const res = await authFetch("/api/members", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      const data: MemberRow[] = await res.json();
      setMembers(data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!gridRef.current) return;

      if (!gridRef.current.contains(e.target as Node)) {
        setFlippedCards({});
      }
    };

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  /* ================= INFINITE SCROLL ================= */

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        setVisibleCount((prev) => prev + 9);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ================= FILTER ================= */

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= REDIRECT ================= */

  const redirectToTreeBuilder = () => {
    router.replace("/basic/family-builder")
  };

  const goToMember = (id: string) => {
    router.push(`/basic/members/${id}`);
  };

  const isTouchDevice = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width:1024px)").matches;
  };

  const handleCardTap = (id: string) => {
    if (!isTouchDevice()) return;

    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  /* ================= RENDER ================= */

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.title}>Family Members</h1>
        <p className={styles.subtitle}>View all members of your family tree.</p>
        <button className={styles.addBtn} onClick={redirectToTreeBuilder}>
          + Add Member
        </button>
      </section>

      <div className={styles.wrapper}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.search}
            />
            {search && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

        </div>

        {/* Members Grid */}
        <div className={styles.grid} ref={gridRef}>
          {filtered.slice(0, visibleCount).map((m, i) => (
            <motion.div
              key={m.id}
              className={styles.card}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className={`${styles.cardInner} ${
                  flippedCards[m.id] ? styles.flipped : ""
                }`}
                onClick={() => handleCardTap(m.id)}
              >
                <div className={styles.cardFront}>
                  {m.avatar_url ? (
                    <Image
                      src={m.avatar_url}
                      alt={m.name}
                      className={styles.avatar}
                      fill
                      sizes="300px"
                      unoptimized
                    />
                  ) : (
                    <div className={styles.placeholder}>
                      <Image src={Placeholder} alt="Placeholder images" />
                    </div>
                  )}
                </div>

                <div className={styles.cardBack}>
                  <h3>{m.name}</h3>
                  <p>{m.role || "—"}</p>

                  {/* Navigation button */}
                  <button
                    type="button"
                    className={styles.profileBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToMember(m.id);
                    }}
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
