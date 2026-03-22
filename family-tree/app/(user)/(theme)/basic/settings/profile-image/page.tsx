"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./profileImageSettings.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient";
import { useSettings } from "@/app/contexts/SettingsContext";
import Placeholder from "@/public/images/image-placeholder-removebg-preview.png"

const supabase = createSupabaseBrowserClient();

type ThemeMode = "light" | "dark" | "system";

export default function ProfileImageSettings() {

  const { state, dispatch, isHydrated } = useSettings();
  
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [isSaving, setIsSaving] = useState(false);
  
  const [initialProfile, setInitialProfile] = useState<{
    familyName: string;
    avatar: string | null;
  }>({
    familyName: "",
    avatar: null,
  });
  
  const [initialSettings, setInitialSettings] = useState<{
    theme: ThemeMode;
    accentColor: string;
  }>({
    theme: "system",
    accentColor: "#3b82f6",
  });
  
  useEffect(() => {
    if (!state.familyName) return; // prevents empty overwrite
    
    setInitialProfile({
      familyName: state.familyName,
      avatar: state.currentAvatar,
    });
    
    setInitialSettings({
      theme: state.theme,
      accentColor: state.accentColor,
    });
  }, [state.accentColor, state.currentAvatar, state.familyName, state.theme]);
  
  
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
  
  if (!isHydrated) return null;
  
  /* =====================
  UI
  ===================== */

  return (
    <div className={styles.layout}>
      {/* <div
        className={`${styles.overlay} ${sidebarOpen ? styles.show : ""}`}
        onClick={toggleSidebar}
      /> */}

      <main className={styles.content}>

        <h1>Profile Picture</h1>

        {/* PROFILE */}
          <section className={styles.section}>
            <div className={styles.avatarRow}>
                <Image
                  src={state.currentAvatar || Placeholder}
                  alt="Profile avatar"
                  className={styles.avatar}
                  width={300}
                  height={300}
                />
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
            <div className={styles.controls}>
               <label className={styles.uploadBtn}>
                Change Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleImageUpload(e.target.files[0])
                  }
                />
              </label>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={saveSettings}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Setting"}
              </button>
            </div>
          </section>
      </main>
    </div>
  );
}


