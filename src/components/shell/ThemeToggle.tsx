"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("gd_theme");
    const current = saved === "light" ? "light" : "dark";
    setTheme(current);
    if (current === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
    localStorage.setItem("gd_theme", next);
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
