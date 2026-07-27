import React from "react";
import { NavLink } from "react-router-dom";
import {
  SquaresFour,
  GearSix,
  CaretLeft,
  CaretRight,
  Buildings,
  Globe,
  City,
  CurrencyDollar,
  NotePencil,
  Warning,
  Lectern,
  Crown,
  Scales,
  Users,
  ChartLine,
} from "@phosphor-icons/react";

interface SidebarNavProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: SquaresFour, end: true },
  { to: "/dashboard/states", label: "US States", icon: Buildings, end: false },
  { to: "/dashboard/countries", label: "Countries", icon: Globe, end: false },
  { to: "/dashboard/cities", label: "Global Cities", icon: City, end: false },
  {
    to: "/dashboard/economies",
    label: "Economies",
    icon: CurrencyDollar,
    end: false,
  },
];

const analysisNav = [
  { to: "/dashboard/policy", label: "Policy", icon: Scales, end: false },
  { to: "/dashboard/conflicts", label: "Conflicts", icon: Warning, end: false },
  {
    to: "/dashboard/worldmap",
    label: "World Leaders",
    icon: Lectern,
    end: false,
  },
  { to: "/dashboard/analysts", label: "Analysts", icon: Users, end: false },
  { to: "/dashboard/trends", label: "Trends", icon: ChartLine, end: false },
];

const bottomNav = [
  { to: "/dashboard/notes", label: "My Notes", icon: NotePencil, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: GearSix, end: false },
  { to: "/membership", label: "Membership", icon: Crown, end: false },
];

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  collapsed,
  mobile,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  end: boolean;
  collapsed: boolean;
  mobile: boolean;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex items-center py-[5px] rounded-md transition-colors duration-150 cursor-pointer group w-full ${
            isActive
              ? "bg-blue-500/20 text-blue-400"
              : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
          } ${collapsed && !mobile ? "justify-center px-0" : "gap-2.5 px-2.5"}`
        }
        title={collapsed && !mobile ? label : undefined}
        aria-label={collapsed && !mobile ? label : undefined}
      >
        {({ isActive }) => (
          <>
            <Icon
              size={18}
              weight={isActive ? "fill" : "regular"}
              className="shrink-0"
            />
            {(!collapsed || mobile) && (
              <span className="text-[11px] leading-none font-normal font-sans truncate">
                {label}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

function SectionLabel({
  label,
  collapsed,
  mobile,
}: {
  label: string;
  collapsed: boolean;
  mobile: boolean;
}) {
  if (collapsed && !mobile)
    return <div className="my-2 border-t border-border" />;
  return (
    <li className="px-2.5 pt-4 pb-1">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-black/25 dark:text-white/20 font-sans">
        {label}
      </span>
    </li>
  );
}

export function SidebarNav({
  collapsed,
  onToggle,
  mobile = false,
}: SidebarNavProps) {
  return (
    <nav
      className="flex flex-col h-full py-2 overflow-y-auto scrollbar-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      aria-label="Sidebar navigation"
    >
      {/* Main nav — fills available height */}
      <ul className="flex flex-col px-1.5 flex-1">
        {mainNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            mobile={mobile}
          />
        ))}

        <SectionLabel label="Analysis" collapsed={collapsed} mobile={mobile} />

        {analysisNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            mobile={mobile}
          />
        ))}

        {/* Spacer pushes bottom items down */}
        <li className="flex-1 min-h-0" aria-hidden="true" />

        <SectionLabel label="Account" collapsed={collapsed} mobile={mobile} />

        {bottomNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            mobile={mobile}
          />
        ))}
      </ul>

      {/* Collapse toggle — desktop only */}
      {!mobile && (
        <div className="px-2 pt-2 border-t border-border mt-1">
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md w-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors duration-150 cursor-pointer ${
              collapsed ? "justify-center px-0" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <CaretRight size={13} weight="bold" />
            ) : (
              <>
                <CaretLeft size={13} weight="bold" />
                <span className="text-[10px] font-normal font-sans">
                  Collapse
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </nav>
  );
}
