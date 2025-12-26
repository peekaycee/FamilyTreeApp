"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";


// please include the functionality to add a tribute here and light up candle too

type Memorial = {
  id: string;
  name: string;
  born: number;
  died: number;
  tribute: string;
  bio: string;
  picture?: string | null;
};

export default function MemorialDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("ft_memorials");
    let found: Memorial | null = null;

    if (raw) {
      const list: Memorial[] = JSON.parse(raw);
      found = list.find((m) => m.id === params.id) || null;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemorial(found);
    setHydrated(true);
  }, [params.id]);

  // 🚫 DO NOT 404 until hydration finishes
  if (!hydrated) return null;

  // ✅ Now it is safe
  if (!memorial) return notFound();

  return (
    <main style={{ padding: "6rem 1.5rem", maxWidth: 900, margin: "0 auto" }}>
      {memorial.picture && (
        <img
          src={memorial.picture}
          alt={memorial.name}
          style={{
            width: "100%",
            maxHeight: 420,
            objectFit: "cover",
            borderRadius: 20,
            marginBottom: 24,
          }}
        />
      )}

      <h1>{memorial.name}</h1>

      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        {memorial.born} — {memorial.died}
      </p>

      <p style={{ fontStyle: "italic", marginBottom: 24 }}>
        {memorial.tribute}
      </p>

      <article style={{ lineHeight: 1.8 }}>
        {memorial.bio}
      </article>
    </main>
  );
}
