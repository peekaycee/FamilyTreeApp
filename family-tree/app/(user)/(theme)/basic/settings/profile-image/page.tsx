"use client";

import { useState, createContext, useContext } from "react";
import Image from "next/image";
import styles from "./profileImageSettings.module.css";

/* =====================
   SETTINGS CONTEXT (UI + API READY)
===================== */

type ThemeMode = "light" | "dark" | "system";

type SettingsState = {
  displayName: string;
  familyName: string;
  theme: ThemeMode;
  accentColor: string;
  profileImage: string | null;
};

type SettingsContextType = {
  settings: SettingsState;
  setSettings: (settings: SettingsState) => void;
};

const SettingsContext = createContext<SettingsContextType | null>(null);
export const useSettings = () => useContext(SettingsContext);

/* =====================
   MAIN SETTINGS PAGE
===================== */

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const [settings, setSettings] = useState<SettingsState>({
    displayName: "",
    familyName: "",
    theme: "system",
    accentColor: "#3b82f6",
    profileImage: null,
  });

  const [imageHistory, setImageHistory] = useState<string[]>([]);


  /* IMAGE UPLOAD + VALIDATION */
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return alert("Invalid image format");
    if (file.size > 2 * 1024 * 1024) return alert("Image too large (max 2MB)");

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = reader.result as string;
      setSettings({ ...settings, profileImage: img });
      setImageHistory((prev) => [img, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className={styles.layout}>
        {/* CONTENT */}
        <main className={styles.content}>
          {activeTab === "profile" && (
            <section className={styles.section}>
              <h2>Edit Profile Picture</h2>

              <div className={styles.avatarRow}>
                {settings.profileImage ? (
                  <Image
                    src={settings.profileImage}
                    alt="Profile avatar"
                    className={styles.avatar}
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>No Image</div>
                )}

              </div>

              <div className={styles.historyGrid}>
                {imageHistory.map((img, i) => (
                  <Image
                    key={i}
                    src={img}
                    alt={`Profile image history ${i}`}
                    onClick={() => setSettings({ ...settings, profileImage: img })}
                    width={80}
                    height={80}
                  />
                ))}
              </div>
            </section>
          )}
          <div className={styles.controls}>
            <label className={styles.uploadBtn}>
              Change Image
              <input
                className={styles.input}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
              />
            </label>
            <button type="button" className={styles.saveBtn}>Save (API later)</button>
          </div>
        </main>
      </div>
    </SettingsContext.Provider>
  );
}

/* =====================
   ZUSTAND STORE (OPTIONAL DROP-IN)
===================== */

// import { create } from 'zustand'
// export const useSettingsStore = create((set) => ({
//   settings: {},
//   update: (data) => set({ settings: data })
// }))

/* =====================
   BACKEND DTO / SCHEMA
===================== */

// SettingsDTO
// {
//   userId: string;
//   displayName: string;
//   familyName: string;
//   theme: 'light' | 'dark' | 'system';
//   accentColor: string;
//   profileImageUrl: string;
//   privacy: {
//     visibility: 'family' | 'admin' | 'private';
//   };
// }
