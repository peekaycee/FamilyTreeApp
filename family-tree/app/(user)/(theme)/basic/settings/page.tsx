"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./settings.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient";
import { useSettings } from "@/app/contexts/SettingsContext";
import Placeholder from "@/public/images/image-placeholder-removebg-preview.png";
import { MoreVertical, X, LayoutDashboard } from "lucide-react";

const supabase = createSupabaseBrowserClient();

type ThemeMode = "light" | "dark" | "system";

export default function Settings() {

  const { state, dispatch } = useSettings();

  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  const [isSaving, setIsSaving] = useState(false);

  const [initialProfile, setInitialProfile] = useState<{ familyName: string; avatar: string | null }>({
    familyName: "",
    avatar: null
  });

  const [initialSettings, setInitialSettings] = useState<{ theme: ThemeMode; accentColor: string }>({
    theme: "system",
    accentColor: "#3b82f6"
  });

  /* =====================
     Detect mobile
  ===================== */

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth <= 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  /* =====================
     Hydrate settings
  ===================== */

  useEffect(() => {

    const fetchSettings = async () => {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("family_name, profile_image_url")
        .eq("id", userId)
        .single();

      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("theme, accent_color")
        .eq("id", userId)
        .single();

      const { data: historyData } = await supabase
        .from("profile_images")
        .select("image_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const validHistory = historyData?.map((img) => img.image_url) || [];
      const fetchedProfileImage = profileData?.profile_image_url || null;

      const storedAvatar = localStorage.getItem("currentAvatar");

      const avatarToUse =
        storedAvatar && validHistory.includes(storedAvatar)
          ? storedAvatar
          : fetchedProfileImage || validHistory[0] || null;

      dispatch({
        type: "SET_SETTINGS",
        payload: {
          familyName: profileData?.family_name || "",
          theme: settingsData?.theme || "system",
          accentColor: settingsData?.accent_color || "#3b82f6"
        }
      });

      dispatch({ type: "SET_CURRENT_AVATAR", payload: avatarToUse });
      dispatch({ type: "SET_IMAGE_HISTORY", payload: validHistory });

      setInitialProfile({
        familyName: profileData?.family_name || "",
        avatar: avatarToUse
      });

      setInitialSettings({
        theme: settingsData?.theme || "system",
        accentColor: settingsData?.accent_color || "#3b82f6"
      });

      if (avatarToUse) localStorage.setItem("currentAvatar", avatarToUse);
      else localStorage.removeItem("currentAvatar");
    };

    fetchSettings();

  }, [dispatch]);

  /* =====================
     Upload avatar
  ===================== */

  const handleImageUpload = async (file: File) => {

    if (!file.type.startsWith("image/"))
      return alert("Invalid image format");

    if (file.size > 2 * 1024 * 1024)
      return alert("Image too large (max 2MB)");

    const reader = new FileReader();

    reader.onloadend = () =>
      dispatch({ type: "SET_CURRENT_AVATAR", payload: reader.result as string });

    reader.readAsDataURL(file);

    try {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("User not authenticated");

      const userId = user.id;

      const fileExt = file.name.split(".").pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from("profile_avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } =
        supabase.storage.from("profile_avatars").getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      await supabase
        .from("profiles")
        .update({ profile_image_url: publicUrl })
        .eq("id", userId);

      await supabase
        .from("profile_images")
        .insert({ user_id: userId, image_url: publicUrl });

      dispatch({ type: "ADD_IMAGE_HISTORY", payload: publicUrl });

      localStorage.setItem("currentAvatar", publicUrl);

    } catch (err) {

      console.error(err);
      alert("Unexpected error uploading image");

    }
  };

  /* =====================
     Switch avatar
  ===================== */

  const switchAvatar = (url: string) => {

    if (url === state.currentAvatar) return;

    dispatch({ type: "SET_CURRENT_AVATAR", payload: url });

    localStorage.setItem("currentAvatar", url);

  };

  /* =====================
     Delete avatar
  ===================== */

  const deleteAvatar = async (url: string) => {

    if (!confirm("Delete this avatar? This cannot be undone.")) return;

    try {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("User not authenticated");

      const userId = user.id;

      const storageBase =
        supabase.storage.from("profile_avatars").getPublicUrl("").data.publicUrl;

      const path = url.replace(storageBase, "").replace(/^\//, "");

      if (path) {

        const { error } =
          await supabase.storage.from("profile_avatars").remove([path]);

        if (error) throw error;

      }

      const { error: dbError } =
        await supabase
          .from("profile_images")
          .delete()
          .eq("user_id", userId)
          .eq("image_url", url);

      if (dbError) throw dbError;

      dispatch({ type: "REMOVE_IMAGE_HISTORY", payload: url });

      if (state.currentAvatar === url) {
        dispatch({ type: "SET_CURRENT_AVATAR", payload: null });
        localStorage.removeItem("currentAvatar");

        await supabase
          .from("profiles")
          .update({ profile_image_url: null })
          .eq("id", userId);
      }

    } catch (err) {

      console.error(err);
      alert("Failed to delete avatar");

    }
  };

  /* =====================
     Save settings
  ===================== */

  const saveSettings = async () => {

    setIsSaving(true);

    try {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("User not authenticated");

      const userId = user.id;

      const profileChanges: any = {};

      if (state.familyName !== initialProfile.familyName)
        profileChanges.family_name = state.familyName;

      if (state.currentAvatar !== initialProfile.avatar)
        profileChanges.profile_image_url = state.currentAvatar;

      const settingsChanges: any = {};

      if (state.theme !== initialSettings.theme)
        settingsChanges.theme = state.theme;

      if (state.accentColor !== initialSettings.accentColor)
        settingsChanges.accent_color = state.accentColor;

      if (Object.keys(profileChanges).length) {

        await supabase
          .from("profiles")
          .upsert({ id: userId, ...profileChanges }, { onConflict: "id" });

        setInitialProfile({
          familyName: state.familyName,
          avatar: state.currentAvatar
        });

      }

      if (Object.keys(settingsChanges).length) {

        await supabase
          .from("user_settings")
          .upsert({ id: userId, ...settingsChanges }, { onConflict: "id" });

        setInitialSettings({
          theme: state.theme,
          accentColor: state.accentColor
        });

      }

      alert("Settings saved successfully!");

    } catch (err) {

      console.error(err);
      alert("Unexpected error saving settings");

    } finally {

      setIsSaving(false);

    }
  };

  /* =====================
     UI
  ===================== */

  return (
    <div className={styles.layout}>

      {!sidebarOpen && (
        <button title="Open Tab" type="button" className={styles.sidebarToggle} onClick={toggleSidebar}>
          <MoreVertical size={20} strokeWidth={2} />
        </button>
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <button title="Close" type="button" className={styles.sidebarToggleClose} onClick={toggleSidebar}>
          <X size={22} />
        </button>
        <div className={styles.dashboard}>
          <Link href="/basic/dashboard">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
        </div>

        <button onClick={() => setActiveTab("profile")}>Profile</button>
        <button onClick={() => setActiveTab("appearance")}>Appearance</button>
        <button onClick={() => setActiveTab("tree")}>Family Tree</button>
        <button onClick={() => setActiveTab("privacy")}>Privacy</button>
        <button onClick={() => setActiveTab("notifications")}>Notifications</button>
        {!sidebarOpen && 
          (<button
            className={styles.sidebarSaveBtn}
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Setting"}
          </button>)
        }
      </aside>

      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.show : ""}`}
        onClick={toggleSidebar}
      />

      <main className={styles.content}>

        <h1>Account Settings</h1>

        {/* PROFILE */}

        {activeTab === "profile" && (
          <section className={styles.section}>

            <h2>Profile Picture</h2>

            <div className={styles.avatarRow}>
                <Image
                  src={state.currentAvatar || Placeholder}
                  alt="Profile avatar"
                  className={styles.avatar}
                  width={300}
                  height={300}
                />
              <label className={styles.uploadBtn}>
                <p>Change Image</p>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleImageUpload(e.target.files[0])
                  }
                />
              </label>

            </div>

            <div className={styles.historyGrid}>

              {state.imageHistory.map((img, i) => (

                <div
                  key={i}
                  className={styles.avatarWrapper}
                  onMouseEnter={() => setHoveredAvatar(img)}
                  onMouseLeave={() => setHoveredAvatar(null)}
                  >

                  <Image
                    src={img}
                    alt={`Avatar history ${i}`}
                    width={80}
                    height={80}
                    style={{ cursor: "pointer", borderRadius: "8px" }}
                    onClick={() => switchAvatar(img)}
                  />

                  {(hoveredAvatar === img || isMobile) && (

                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAvatar(img);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

            </div>
            <div className={styles.familyNameLabel}>
              <label>
                <h2>Family Name</h2>
              </label>
              <input
                className={styles.input}
                placeholder="example: Awolowo"
                value={state.familyName}
                onChange={(e) =>
                  dispatch({
                    type: "SET_SETTINGS",
                    payload: { familyName: e.target.value }
                  })
                }
              />
            </div>
          </section>
        )}

        {/* APPEARANCE */}

        {activeTab === "appearance" && (

          <section className={styles.section}>

            <h2>Appearance</h2>

            <label>Theme</label>

            <select
              className={styles.select}
              value={state.theme}
              onChange={(e) =>
                dispatch({
                  type: "SET_SETTINGS",
                  payload: { theme: e.target.value as ThemeMode }
                })
              }
            >

              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>

            </select>

            <label>Accent Color</label>

            <input
              className={styles.input}
              type="color"
              value={state.accentColor}
              onChange={(e) =>
                dispatch({
                  type: "SET_SETTINGS",
                  payload: { accentColor: e.target.value }
                })
              }
            />
  
          </section>
        )}
        {isMobile && 
          (<button
            className={styles.mobileSidebarSaveBtn}
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Setting"}
          </button>)
        }
      </main>
    </div>
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
//   familyName: string;
//   theme: 'light' | 'dark' | 'system';
//   accentColor: string;
//   profileImageUrl: string;
//   privacy: {
//     visibility: 'family' | 'admin' | 'private';
//   };
// }


// I will need this in the nearest future
// profile_avatars/
//    user-id-1/
//        avatar1.png
//        avatar2.png
//    user-id-2/
//        avatar1.png
