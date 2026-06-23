"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return localStorage.getItem("gd_theme") === "light" ? "light" : "dark";
}

function subscribeToThemeChanges(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("gd-theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("gd-theme-change", callback);
  };
}

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToThemeChanges, getStoredTheme, () => "dark");

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("gd_theme", next);
    applyTheme(next);
    window.dispatchEvent(new Event("gd-theme-change"));
  }

  return (
    <button
      type="button"
      className="btn theme-toggle"
      data-active-theme={theme}
      onClick={toggle}
      title={theme === "light" ? "Modo oscuro" : "Modo claro"}
      aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      <span className="theme-sun"><i className="ti ti-sun" /></span>
      <span className="theme-moon"><i className="ti ti-moon" /></span>
    </button>
  );
}
