"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("gd_theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Tema claro" : "Tema oscuro"}
      style={{
        background: "none",
        border: "1px solid var(--border2)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text2)",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        padding: "5px 8px",
      }}
    >
      <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} />
    </button>
  );
}
