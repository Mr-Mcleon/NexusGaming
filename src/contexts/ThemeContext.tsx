import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "cyber" | "midnight" | "sunset" | "forest" | "ocean" | "lavender" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { id: Theme; name: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes: { id: Theme; name: string; description: string }[] = [
  { id: "light", name: "Light Mode", description: "Clean & bright" },
  { id: "cyber", name: "Cyber Neon", description: "Electric cyan & purple" },
  { id: "midnight", name: "Midnight", description: "Deep blue & gold" },
  { id: "sunset", name: "Sunset", description: "Warm orange & pink" },
  { id: "forest", name: "Forest", description: "Natural greens" },
  { id: "ocean", name: "Ocean", description: "Cool blues & teals" },
  { id: "lavender", name: "Lavender", description: "Soft purple & pink" },
];

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved as Theme) || "cyber";
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  useEffect(() => {
    // Remove all theme classes
    const root = document.documentElement;
    themes.forEach(t => root.classList.remove(`theme-${t.id}`));
    // Add the current theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
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
