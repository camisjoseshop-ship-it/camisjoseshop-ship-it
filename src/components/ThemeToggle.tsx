import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STORAGE_KEY = "camisjose-theme-roja";

export const ThemeToggle = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "1";
    setActive(saved);
    document.documentElement.classList.toggle("theme-roja", saved);
  }, []);

  const toggle = () => {
    const next = !active;
    setActive(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    document.documentElement.classList.toggle("theme-roja", next);
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={active}
      title={active ? "Desactivar tema La Roja" : "Activar tema La Roja Mundial"}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
          : "bg-transparent text-primary border-primary/40 hover:border-primary"
      }`}
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">{active ? "La Roja ON" : "Modo La Roja"}</span>
    </button>
  );
};

export default ThemeToggle;
