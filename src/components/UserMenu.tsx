import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  UserCircle,
  SignOut,
  GearSix,
  Crown,
  ChartBar,
  CaretRight,
  DotsThree,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleNav = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          group flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border transition-all duration-200 text-sm
          ${
            open
              ? "border-secondary/60 bg-secondary/10 shadow-sm"
              : "border-border hover:border-secondary/40 hover:bg-white/[0.03]"
          }
        `}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shrink-0 text-[11px] font-bold text-white shadow-inner ring-1 ring-white/10">
          {initials}
        </div>
        <span className="text-foreground font-medium max-w-[110px] truncate leading-none">
          {user.name || user.email}
        </span>
        <DotsThree size={16} weight="bold" className="text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-2.5 w-60 z-50 rounded-2xl overflow-hidden
            bg-card border border-border
            shadow-[0_16px_48px_rgba(0,0,0,0.32),0_2px_8px_rgba(0,0,0,0.16)]
            animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150
          "
        >
          {/* Profile header */}
          <div className="relative px-4 pt-4 pb-3.5 overflow-hidden">
            {/* subtle bg glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/[0.08] via-transparent to-transparent pointer-events-none" />

            <div className="relative flex items-center gap-3">
              {/* Large avatar */}
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center text-base font-bold text-white shadow-lg ring-1 ring-white/10">
                  {initials}
                </div>
                {/* online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate leading-snug">
                  {user.name || "User"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate leading-snug mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Plan badge */}
            <div className="relative mt-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-[11px] font-semibold text-secondary tracking-wide uppercase">
                <Crown size={10} weight="fill" />
                Pro Plan
              </div>
              <button
                onClick={() => handleNav("/dashboard/settings")}
                className="text-[11px] text-muted-foreground hover:text-secondary transition-colors flex items-center gap-0.5"
              >
                Manage
                <CaretRight size={10} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-3" />

          {/* Nav items */}
          <div className="p-2 space-y-0.5">
            <MenuItem
              icon={<UserCircle size={15} weight="fill" />}
              label="Profile Settings"
              description="Edit your account info"
              onClick={() => handleNav("/dashboard/settings")}
            />
            <MenuItem
              icon={<GearSix size={15} weight="fill" />}
              label="Preferences"
              description="Theme, display & more"
              onClick={() => handleNav("/dashboard/settings")}
            />
            <MenuItem
              icon={<ChartBar size={15} weight="fill" />}
              label="Dashboard"
              description="Your activity overview"
              onClick={() => handleNav("/dashboard")}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-3" />

          {/* Sign out */}
          <div className="p-2">
            <button
              onClick={async () => {
                await logout();
                setOpen(false);
              }}
              className="
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                text-destructive hover:bg-destructive/10 transition-all duration-150 group
              "
            >
              <span className="w-8 h-8 rounded-lg bg-destructive/8 border border-destructive/15 flex items-center justify-center shrink-0 group-hover:bg-destructive/15 transition-colors">
                <SignOut size={15} weight="fill" className="text-destructive" />
              </span>
              <div className="text-left">
                <p className="font-medium leading-tight">Sign Out</p>
                <p className="text-[11px] text-destructive/60 leading-tight mt-0.5">
                  End your current session
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── small reusable menu item ─── */
type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
};

function MenuItem({ icon, label, description, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
        hover:bg-white/[0.05] transition-all duration-150 group text-left
      "
    >
      <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center shrink-0 group-hover:bg-secondary/12 group-hover:border-secondary/25 transition-all duration-150">
        <span className="text-muted-foreground group-hover:text-secondary transition-colors">
          {icon}
        </span>
      </span>
      <div className="min-w-0">
        <p className="font-medium text-foreground leading-tight truncate">
          {label}
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
          {description}
        </p>
      </div>
      <CaretRight
        size={12}
        className="ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0"
      />
    </button>
  );
}
