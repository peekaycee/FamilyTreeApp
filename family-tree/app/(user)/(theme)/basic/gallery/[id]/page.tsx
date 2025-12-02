"use client";

import { galleryItems } from "../../../../../../lib/gallery-data";
import { motion } from "framer-motion";
import styles from "./gallerydetail.module.css";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GalleryDetail({ params }: { params: { id: string } }) {
  const item = galleryItems.find((x) => x.id === params.id);

  if (!item) return notFound();
  
  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Link href="/basic/gallery" className={styles.backBtn}>
        <ArrowLeft size={20} /> Back to Gallery
      </Link>

      <motion.img
        src={item.image}
        alt={item.title}
        className={styles.mainImage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      />

      <div className={styles.textSection}>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        {item.date && <span className={styles.date}>{item.date}</span>}
      </div>
    </motion.div>
  );
}
function notFound() {
  throw new Error("Function not implemented.");
}

