/* eslint-disable react-hooks/set-state-in-effect */
// FamilyMembersPage.tsx (Updated as requested)

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "./members.module.css";

interface MemberRow {
  id: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  created_at: string | null;
}

export default function FamilyMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [search, setSearch] = useState("");

  const redirectToTreeBuilder = () => {
    window.location.href = "/basic/dashboard/family-builder";
  }

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error) setMembers(data || []);
  };

  useEffect(() => {
        const fetchData = async () => {
          await fetchMembers();
        };
        fetchData(); // ✅ call the async function here

        const channel = supabase
          .channel("family-members-realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "family_members" },
            fetchMembers
          )
          .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        setVisibleCount((prev) => prev + 9);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <button className={styles.addBtn} onClick={redirectToTreeBuilder}>
          + Add Member
        </button>
      </div>

      {/* GRID */}
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
              {/* FRONT: Avatar Only */}
              <div className={styles.cardFront}>
                {m.avatar_url ? (
                  <Image
                    src={m.avatar_url}
                    alt={m.name}
                    className={styles.avatar}
                    fill
                    sizes="300px"
                  />
                ) : (
                  <div className={styles.placeholder}>No Image</div>
                )}
              </div>

              {/* BACK: Details */}
              <div className={styles.cardBack}>
                <h3>{m.name}</h3>
                <p>{m.role || "—"}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
