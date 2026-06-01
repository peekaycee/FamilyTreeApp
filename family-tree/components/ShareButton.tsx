"use client";

import { CornerDownLeft } from "lucide-react";
import styles from '../components/components.module.css'
type ShareButtonsProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
};

export default function ShareButtons({
  title,
  text,
  url,
  className,
}: ShareButtonsProps) {
  const shareData = {
    title,
    text,
    url,
  };
  
  // const encodedUrl = encodeURIComponent(shareData.url);
  // const encodedText = encodeURIComponent(
  //   `${shareData.text} ${shareData.url}`
  // );

  // Native Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log("Share cancelled");
      }
    } else {
      alert("Native sharing is not supported on this device.");
    }
  };

  return (
    <>
      {/* Native Share */}
      <button
        onClick={handleNativeShare}
        className={className}
        type="button"
      >
        Share<CornerDownLeft size={14} className={styles.sendCaret}/>
      </button>
    </> 
  );
}