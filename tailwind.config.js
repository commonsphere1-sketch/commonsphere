module.exports = {
  darkMode: ["class"],
  /* light mode uses html.light — css vars handle the swap */
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
        display: [
          '"Playfair Display"',
          '"Cormorant Garant"',
          "Georgia",
          "serif",
        ],
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
          "linear-gradient(135deg, hsl(240, 30%, 7%) 0%, hsl(255, 25%, 11%) 50%, hsl(270, 20%, 9%) 100%)",
        "gradient-2":
          "linear-gradient(135deg, hsl(0, 0%, 95%) 0%, hsl(0, 0%, 82%) 100%)",
        "gradient-gold":
          "linear-gradient(135deg, hsl(0, 0%, 99%) 0%, hsl(0, 0%, 93%) 40%, hsl(0, 0%, 84%) 70%, hsl(0, 0%, 70%) 100%)",
        "gradient-dark":
          "linear-gradient(180deg, hsl(240, 30%, 7%) 0%, hsl(250, 28%, 5%) 100%)",
        "button-border-gradient":
          "linear-gradient(90deg, hsl(0,0%,99%), hsl(0,0%,93%), hsl(0,0%,82%))",
        "card-shimmer":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(180,180,180,0.04) 100%)",
      },
      boxShadow: {
        premium: "0 4px 24px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3)",
        "premium-lg":
          "0 8px 40px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)",
        glow: "0 0 24px rgba(245, 245, 245, 0.28)",
        "inner-glow": "inset 0 1px 0 rgba(245, 245, 245, 0.2)",
      },
      letterSpacing: {
        tight: "-0.02em",
        normal: "0",
        wide: "0.02em",
        wider: "0.05em",
        widest: "0.1em",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.4, 0, 0.2, 1)",
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2.5s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
