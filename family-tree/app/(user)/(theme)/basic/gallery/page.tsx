"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./gallery.module.css";
import { galleryItems } from "../../../../../lib/gallery-data";

export default function GalleryPage() {
  const ITEMS_PER_LOAD = 12;

  
  // Pagination state (empty at mount)
  const [visibleItems, setVisibleItems] = useState<any[]>([]);

  // Load initial slice on mount
  useEffect(() => {
    setVisibleItems(galleryItems.slice(0, ITEMS_PER_LOAD));
  }, []);


  // Lightbox state
  const [lightbox, setLightbox] = useState<{ image: string; title: string } | null>(null);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleItems]);

  const loadMore = () => {
    if (visibleItems.length >= galleryItems.length) return;
    const nextItems = galleryItems.slice(0, visibleItems.length + ITEMS_PER_LOAD);
    setVisibleItems(nextItems);
  };

  return (
    <div className={styles.container}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.title}
      >
        Gallery
      </motion.h1>

      {/* Masonry grid */}
      <div className={styles.masonryGrid}>
        {visibleItems.map((item) => (
          <motion.div
            key={item.id}
            className={styles.card}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {/* Shimmer lazy-load wrapper */}
            <div className={styles.shimmerWrapper}>
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className={styles.image}
                onClick={() =>
                  setLightbox({ image: item.image, title: item.title })
                }
              />
            </div>

            {/* Clicking image leads to detail page */}
            <Link href={`/basic/gallery/${item.id}`} className={styles.linkOverlay} />
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <motion.div
          className={styles.lightboxOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightbox(null)}
        >
          <motion.img
            src={lightbox.image}
            alt={lightbox.title}
            className={styles.lightboxImage}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
          />
        </motion.div>
      )}
    </div>
  );
}
