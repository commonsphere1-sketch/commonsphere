import { Globe, Moon, Sun } from "@phosphor-icons/react";
import { useState } from "react";

export function Footer() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe size={20} weight="fill" className="text-secondary" />
          <span className="text-sm font-sans text-muted-foreground">
            © 2024 CommonSphere. All rights reserved.
          </span>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap items-center gap-4">
            {["About", "Terms", "Privacy", "Accessibility"].map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-xs font-sans text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={() => setDarkMode((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-muted-foreground hover:bg-border hover:text-foreground transition-colors duration-150 cursor-pointer text-xs font-normal font-sans"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <>
              <Moon size={16} weight="fill" className="text-secondary" />
              <span className="text-muted-foreground">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={16} weight="fill" className="text-warning" />
              <span className="text-muted-foreground">Light Mode</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
