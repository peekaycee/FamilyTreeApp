"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./members.module.css";
import { useRouter } from "next/navigation";

/* ================= TYPES ================= */

interface MemberRow {
  id: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  created_at: string | null;
}

/* ================= CONSTANTS ================= */

const PLACEHOLDER_AVATAR = "/images/avatar-placeholder.png";

/* ================= MAIN PAGE ================= */

export default function FamilyMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [search, setSearch] = useState("");


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
    window.location.href = "/basic/dashboard/family-builder";
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
        <div className={styles.grid}>
          {filtered.slice(0, visibleCount).map((m, i) => (
            <motion.div
              key={m.id}
              className={styles.card}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={styles.cardInner}>
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
                    <div className={styles.placeholder}>No Image</div>
                  )}
                </div>

                <div className={styles.cardBack}>
                  <h3>{m.name}</h3>
                  <p>{m.role || "—"}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
