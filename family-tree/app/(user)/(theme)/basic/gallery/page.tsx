// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import Image from "next/image";
// import Link from "next/link";
// import styles from "./gallery.module.css";
// import { supabase } from "../../../../../lib/supabaseClient";

// // ---------------------------
// // TYPES
// // ---------------------------
// interface BucketItem {
//   id: number;
//   title: string;
//   image: string;
// }

// interface SupabaseFile {
//   name: string;
//   id?: string;
//   updated_at?: string;
//   created_at?: string;
//   last_accessed_at?: string;
//   metadata?: Record<string, unknown>;
// }

// export default function GalleryPage() {
//   const ITEMS_PER_LOAD = 12;

//   const [bucketImages, setBucketImages] = useState<BucketItem[]>([]);
//   const [visibleItems, setVisibleItems] = useState<BucketItem[]>([]);
//   const [lightbox, setLightbox] = useState<BucketItem | null>(null);

//   // ---------------------------
//   // FETCH IMAGES (Recursive)
//   // ---------------------------
//   useEffect(() => {
//     const fetchImages = async () => {
//       const { data: folders, error } = await supabase.storage
//         .from("avatars")
//         .list("", { limit: 200 });

//       if (error || !folders) {
//         console.error("Supabase fetch error:", error);
//         return;
//       }

//       const allFiles: BucketItem[] = [];

//       for (const folder of folders as SupabaseFile[]) {
//         if (!folder.name || folder.name === ".emptyFolderPlaceholder") continue;

//         const path = folder.name;

//         const { data: folderFiles, error: folderErr } = await supabase.storage
//           .from("avatars")
//           .list(path, { limit: 200 });

//         if (folderErr || !folderFiles) continue;

//         folderFiles.forEach((file) => {
//           const filePath = `${path}/${file.name}`;

//           const { data: urlData } = supabase.storage
//             .from("avatars")
//             .getPublicUrl(filePath);

//           if (urlData.publicUrl) {
//             allFiles.push({
//               id: allFiles.length + 1,
//               title: file.name,
//               image: urlData.publicUrl,
//             });
//           }
//         });
//       }

//       setBucketImages(allFiles);
//       setVisibleItems(allFiles.slice(0, ITEMS_PER_LOAD));
//     };

//     fetchImages();
//   }, []);

//   // ---------------------------
//   // INFINITE SCROLL
//   // ---------------------------
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const loadMore = () => {
//     if (visibleItems.length >= bucketImages.length) return;

//     const nextItems = bucketImages.slice(
//       0,
//       visibleItems.length + ITEMS_PER_LOAD
//     );

//     setVisibleItems(nextItems);
//   };

//   useEffect(() => {
//     const handleScroll = () => {
//       if (
//         window.innerHeight + window.scrollY >=
//         document.body.offsetHeight - 300
//       ) {
//         loadMore();
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [visibleItems, bucketImages, loadMore]);

//   // ---------------------------
//   // RENDER
//   // ---------------------------
//   return (
//     <div className={styles.container}>
//       <div className={styles.hero}>
//         <motion.h1
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className={styles.title}
//         >
//           Gallery
//         </motion.h1>
//       </div>

//       <div className={styles.masonryGrid}>
//         {visibleItems.map((item, idx) => (
//           <motion.div
//             key={item.id}
//             className={styles.card}
//             initial={{ opacity: 0, y: 30 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.4 }}
//           >
//             <div
//               className={styles.shimmerWrapper}
//               onClick={() => setLightbox(item)}
//             >
//               <Image
//                 src={item.image}
//                 alt={item.title}
//                 width={400}
//                 height={300}
//                 style={{ width: "100%", height: "auto" }}
//                 loading={idx < ITEMS_PER_LOAD ? "eager" : "lazy"} // eager for first batch (above the fold)
//                 placeholder="blur"
//                 blurDataURL="/placeholder.png" // optional: small placeholder
//               />
//             </div>

//             <Link
//               href={`/basic/gallery/${item.id}`}
//               className={styles.linkOverlay}
//             />
//           </motion.div>
//         ))}
//       </div>

//       {lightbox && (
//         <motion.div
//           className={styles.lightboxOverlay}
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           onClick={() => setLightbox(null)}
//         >
//           <div className={styles.lightboxWrapper}>
//             <Image
//               src={lightbox.image}
//               alt={lightbox.title}
//               width={1200}
//               height={800}
//               style={{ objectFit: "contain" }}
//               loading="eager" // always eager for lightbox
//             />
//           </div>
//         </motion.div>
//       )}
//     </div>
//   );
// }
