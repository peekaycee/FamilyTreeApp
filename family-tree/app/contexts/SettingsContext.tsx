"use client";

import { createContext, useContext, useReducer, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient";

const supabase = createSupabaseBrowserClient();

export type ThemeMode = "light" | "dark" | "system";

export type SettingsState = {
  displayName: string;
  familyName: string;
  theme: ThemeMode;
  accentColor: string;
  profileImage: string | null;
  currentAvatar: string | null;
  imageHistory: string[];
};

type SettingsAction =
  | { type: "SET_SETTINGS"; payload: Partial<SettingsState> }
  | { type: "SET_CURRENT_AVATAR"; payload: string | null }
  | { type: "SET_IMAGE_HISTORY"; payload: string[] }
  | { type: "ADD_IMAGE_HISTORY"; payload: string }
  | { type: "REMOVE_IMAGE_HISTORY"; payload: string }
  | { type: "RESET" };

const initialState: SettingsState = {
  displayName: "",
  familyName: "",
  theme: "system",
  accentColor: "#3b82f6",
  profileImage: null,
  currentAvatar: null,
  imageHistory: [],
};


function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "SET_SETTINGS":
      return { ...state, ...action.payload };

    case "SET_CURRENT_AVATAR":
      return { ...state, currentAvatar: action.payload, profileImage: action.payload };

    case "SET_IMAGE_HISTORY":
      return { ...state, imageHistory: action.payload };

    case "ADD_IMAGE_HISTORY":
      return {
        ...state,
        imageHistory: [action.payload, ...state.imageHistory],
        currentAvatar: action.payload,
        profileImage: action.payload,
      };

    case "REMOVE_IMAGE_HISTORY": {
      const newHistory = state.imageHistory.filter((img) => img !== action.payload);
      const newAvatar =
        state.currentAvatar === action.payload ? newHistory[0] || null : state.currentAvatar;

      if (!newAvatar) localStorage.removeItem("currentAvatar");
      else localStorage.setItem("currentAvatar", newAvatar);

      return {
        ...state,
        imageHistory: newHistory,
        currentAvatar: newAvatar,
        profileImage: newAvatar,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

const SettingsContext = createContext<{
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
  isHydrated: boolean;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  /* Hydrate settings once globally */
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsHydrated(true); // still mark as done
        return;
      }

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

      const storedAvatar = localStorage.getItem("currentAvatar");

      const avatarToUse =
        storedAvatar && validHistory.includes(storedAvatar)
          ? storedAvatar
          : profileData?.profile_image_url || validHistory[0] || null;

      dispatch({
        type: "SET_SETTINGS",
        payload: {
          familyName: profileData?.family_name || "",
          theme: settingsData?.theme || "system",
          accentColor: settingsData?.accent_color || "#3b82f6",
        },
      });

      dispatch({ type: "SET_CURRENT_AVATAR", payload: avatarToUse });
      dispatch({ type: "SET_IMAGE_HISTORY", payload: validHistory });

      if (avatarToUse) localStorage.setItem("currentAvatar", avatarToUse);

      setIsHydrated(true);
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ state, dispatch, isHydrated }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};