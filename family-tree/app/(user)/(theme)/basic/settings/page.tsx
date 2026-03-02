"use client";

import { useState, createContext, useContext } from "react";
import Image from "next/image";
import styles from "./settings.module.css";
import Link from "next/link";

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

  // NEW: Sidebar toggle state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
        {/* SIDEBAR TOGGLE BUTTON */}
        <button className={styles.sidebarToggle} onClick={toggleSidebar}>
          {sidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        {/* SIDEBAR */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
          <Link href="/basic/dashboard">← Dashboard</Link>
          <button type="button" onClick={() => setActiveTab("profile")}>Profile</button>
          <button type="button" onClick={() => setActiveTab("appearance")}>Appearance</button>
          <button type="button" onClick={() => setActiveTab("tree")}>Family Tree</button>
          <button type="button" onClick={() => setActiveTab("privacy")}>Privacy</button>
          <button type="button" onClick={() => setActiveTab("notifications")}>Notifications</button>
        </aside>

        {/* OVERLAY FOR MOBILE */}
        <div
          className={`${styles.overlay} ${sidebarOpen ? styles.show : ""}`}
          onClick={toggleSidebar}
        />

        {/* CONTENT */}
        <main className={styles.content}>
          <h1>Account Settings</h1>

          {activeTab === "profile" && (
            <section className={styles.section}>
              <h2>Profile</h2>

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

              <input
                className={styles.input}
                id="Display name"
                placeholder="Display name"
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              />

              <input
                className={styles.input}
                id="Family name"
                placeholder="Family name"
                value={settings.familyName}
                onChange={(e) => setSettings({ ...settings, familyName: e.target.value })}
              />
            </section>
          )}

          {activeTab === "appearance" && (
            <section className={styles.section}>
              <h2>Appearance</h2>

              <select
                className={styles.select}
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value as ThemeMode })}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>

              <input
                className={styles.input}
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
              />
            </section>
          )}

          <button type="button" className={styles.saveBtn}>Save (API later)</button>
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
