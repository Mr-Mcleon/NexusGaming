import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "system" | "cyber" | "midnight" | "sunset" | "forest" | "ocean" | "lavender" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { id: Theme; name: string; description: string }[];
  resolvedTheme: Exclude<Theme, "system">;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes: { id: Theme; name: string; description: string }[] = [
  { id: "system", name: "System", description: "Follow OS preference" },
  { id: "light", name: "Light Mode", description: "Clean & bright" },
  { id: "cyber", name: "Cyber Neon", description: "Electric cyan & purple" },
  { id: "midnight", name: "Midnight", description: "Deep blue & gold" },
  { id: "sunset", name: "Sunset", description: "Warm orange & pink" },
  { id: "forest", name: "Forest", description: "Natural greens" },
  { id: "ocean", name: "Ocean", description: "Cool blues & teals" },
  { id: "lavender", name: "Lavender", description: "Soft purple & pink" },
];

const getSystemTheme = (): "light" | "cyber" => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "cyber" : "light";
  }
  return "cyber";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved as Theme) || "cyber";
  });

  const [systemPreference, setSystemPreference] = useState<"light" | "cyber">(getSystemTheme);

  const resolvedTheme: Exclude<Theme, "system"> = theme === "system" ? systemPreference : theme;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  // Listen for OS preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "cyber" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Remove all theme classes
    const root = document.documentElement;
    themes.forEach(t => root.classList.remove(`theme-${t.id}`));
    // Add the resolved theme class
    root.classList.add(`theme-${resolvedTheme}`);
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
