import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "ow_theme";

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
}

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    // If no preference stored, check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const dark = getInitialTheme();
    // Apply immediately to avoid FOUC
    applyTheme(dark);
    return dark;
  });

  useEffect(() => {
    applyTheme(isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggle };
}
