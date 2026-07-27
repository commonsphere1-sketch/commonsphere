module.exports = {
  darkMode: ["class"],
  /* light mode uses html.light — css vars handle the swap */
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        tertiary: {
          DEFAULT: "var(--color-tertiary)",
          foreground: "var(--color-tertiary-foreground)",
        },
        neutral: {
          DEFAULT: "var(--color-neutral)",
          foreground: "var(--color-neutral-foreground)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        gray: {
          50: "hsl(0, 0%, 98%)",
          100: "hsl(0, 0%, 96%)",
          200: "hsl(0, 0%, 90%)",
          300: "hsl(0, 0%, 80%)",
          400: "hsl(0, 0%, 70%)",
          500: "hsl(0, 0%, 60%)",
          600: "hsl(0, 0%, 45%)",
          700: "hsl(0, 0%, 35%)",
          800: "hsl(0, 0%, 25%)",
          900: "hsl(0, 0%, 10%)",
        },
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        border: "var(--color-border)",
        input: "var(--color-border)",
        ring: "var(--color-secondary)",
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        destructive: {
          DEFAULT: "hsl(0, 70%, 50%)",
          foreground: "hsl(0, 0%, 98%)",
        },
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      spacing: {
        4: "1rem",
        8: "2rem",
        12: "3rem",
        16: "4rem",
        24: "6rem",
        32: "8rem",
        48: "12rem",
        64: "16rem",
      },
      backgroundImage: {
        "gradient-1":
          "linear-gradient(135deg, hsl(222, 69%, 20%) 0%, hsl(200, 80%, 30%) 100%)",
        "gradient-2":
          "linear-gradient(135deg, hsl(210, 80%, 60%) 0%, hsl(190, 80%, 45%) 100%)",
        "button-border-gradient":
          "linear-gradient(90deg, hsl(200, 80%, 55%), hsl(190, 80%, 45%))",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-in-out",
        "slide-in": "slide-in 0.2s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
