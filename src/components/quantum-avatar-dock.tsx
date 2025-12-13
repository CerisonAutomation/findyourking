"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Dumbbell,
  Plane,
  NotebookPen,
  Salad,
  Newspaper,
  Clock,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

export type QuantumTabId =
  | "scheduler"
  | "gym"
  | "travel"
  | "notes"
  | "calendar"
  | "diet"
  | "news"
  | "settings";

type QuantumTab = {
  id: QuantumTabId;
  label: string;
  icon: React.ReactNode;
  accentClass: string; // tailwind gradient helpers
};

const TABS: QuantumTab[] = [
  { id: "scheduler", label: "Scheduler", icon: <Clock />, accentClass: "from-sky-400/70 via-cyan-300/30 to-transparent" },
  { id: "gym", label: "Gym", icon: <Dumbbell />, accentClass: "from-emerald-400/70 via-lime-300/30 to-transparent" },
  { id: "travel", label: "Travel", icon: <Plane />, accentClass: "from-violet-400/70 via-fuchsia-300/30 to-transparent" },
  { id: "notes", label: "Notes", icon: <NotebookPen />, accentClass: "from-amber-400/70 via-orange-300/30 to-transparent" },
  { id: "calendar", label: "Calendar", icon: <CalendarDays />, accentClass: "from-indigo-400/70 via-sky-300/30 to-transparent" },
  { id: "diet", label: "Diet", icon: <Salad />, accentClass: "from-lime-400/70 via-emerald-300/30 to-transparent" },
  { id: "news", label: "News", icon: <Newspaper />, accentClass: "from-rose-400/70 via-pink-300/30 to-transparent" },
  { id: "settings", label: "Settings", icon: <Settings />, accentClass: "from-slate-300/50 via-white/10 to-transparent" },
];

// Clamp utility function
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useOnClickOutside<T extends HTMLElement>(ref: React.RefObject<T>, handler: () => void) {
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [ref, handler]);
}

export default function QuantumAvatarDock() {
  const reduce = useReducedMotion();
  const shellRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QuantumTabId>("scheduler");

  useOnClickOutside(shellRef, () => setOpen(false));

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeTab = useMemo(() => TABS.find((t) => t.id === active)!, [active]);

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div ref={shellRef} className="relative w-full max-w-xl">
        {/* Floating content panel (toggles) */}
        <div className="pointer-events-none absolute -top-[18.5rem] left-0 right-0 mx-auto w-full">
          <motion.div
            layout
            className={[
              "pointer-events-auto relative overflow-hidden rounded-3xl border border-white/10",
              "bg-slate-950/35 backdrop-blur-2xl shadow-[0_18px_70px_-18px_rgba(0,0,0,0.9)]",
            ].join(" ")}
          >
            {/* ambient gradient + scanline + noise */}
            <div
              aria-hidden="true"
              className={[
                "absolute inset-0 opacity-90",
                "bg-[radial-gradient(1000px_circle_at_30%_0%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(900px_circle_at_70%_10%,rgba(168,85,247,0.18),transparent_60%),radial-gradient(800px_circle_at_40%_100%,rgba(34,197,94,0.14),transparent_55%)]",
              ].join(" ")}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_18%,transparent_82%,rgba(255,255,255,0.06))]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(to_bottom,rgba(255,255,255,0.18),rgba(255,255,255,0.18)_1px,transparent_1px,transparent_6px)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.05] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%2240%22 height=%2240%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')]"
            />

            {/* active accent wash */}
            <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-tr ${activeTab.accentClass}`} />

            <div className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/90">
                    <span className="[&>svg]:h-5 [&>svg]:w-5">{activeTab.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{activeTab.label}</div>
                    <div className="text-xs text-white/60">
                      Tap avatar → radial HUD → instant mode switch
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOpen((v) => !v)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                >
                  {open ? "Close HUD" : "Open HUD"}
                </button>
              </div>

              <div className="mt-4">
                <ActivePanel tab={active} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dock bar */}
        <div className="relative mx-auto w-fit rounded-3xl border border-white/10 bg-slate-950/30 p-2 backdrop-blur-2xl shadow-[0_16px_60px_-18px_rgba(0,0,0,0.9)]">
          {/* neon edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-60 blur-2xl
            bg-[radial-gradient(650px_circle_at_50%_120%,rgba(56,189,248,0.35),rgba(168,85,247,0.18),transparent_60%)]"
          />
          <div className="flex items-center gap-2">
            <QuickChip active={active === "scheduler"} onClick={() => setActive("scheduler")} icon={<Clock />} />
            <QuickChip active={active === "calendar"} onClick={() => setActive("calendar")} icon={<CalendarDays />} />
            <QuickChip active={active === "notes"} onClick={() => setActive("notes")} icon={<NotebookPen />} />

            {/* Avatar launcher */}
            <div className="relative px-1">
              <AvatarLauncher
                open={open}
                onToggle={() => setOpen((v) => !v)}
                reduceMotion={!!reduce}
              />
              <RadialHUD
                open={open}
                tabs={TABS}
                active={active}
                onPick={(id) => {
                  setActive(id);
                  setOpen(false);
                }}
                reduceMotion={!!reduce}
              />
            </div>

            <QuickChip active={active === "gym"} onClick={() => setActive("gym")} icon={<Dumbbell />} />
            <QuickChip active={active === "diet"} onClick={() => setActive("diet")} icon={<Salad />} />
            <QuickChip active={active === "news"} onClick={() => setActive("news")} icon={<Newspaper />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickChip({
  active,
  onClick,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative grid h-12 w-12 place-items-center rounded-2xl",
        "border border-white/10 bg-white/5 text-white/85",
        "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60",
        active ? "bg-white/12 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]" : "",
      ].join(" ")}
      aria-pressed={active}
    >
      <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-sm transition-opacity duration-200 group-hover:opacity-100
        bg-[radial-gradient(120px_circle_at_30%_20%,rgba(56,189,248,0.40),transparent_55%),radial-gradient(120px_circle_at_70%_80%,rgba(168,85,247,0.30),transparent_60%)]"
      />
    </button>
  );
}

function AvatarLauncher({
  open,
  onToggle,
  reduceMotion,
}: {
  open: boolean;
  onToggle: () => void;
  reduceMotion: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={[
        "relative grid h-14 w-14 place-items-center rounded-3xl",
        "border border-white/12 bg-white/5 backdrop-blur-xl",
        "focus:outline-none focus:ring-2 focus:ring-sky-400/70",
      ].join(" ")}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label="Open HUD menu"
    >
      {/* ultra-futuristic avatar core */}
      <div className="relative h-11 w-11 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[conic-gradient(from_180deg,rgba(56,189,248,0.95),rgba(168,85,247,0.9),rgba(34,197,94,0.75),rgba(56,189,248,0.95))] opacity-75" />
        <div className="absolute inset-[2px] rounded-2xl bg-slate-950/60" />
        <div className="absolute inset-[6px] rounded-2xl bg-white/10" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:repeating-linear-gradient(to_bottom,rgba(255,255,255,0.28),rgba(255,255,255,0.28)_1px,transparent_1px,transparent_6px)]" />
        <motion.div
          aria-hidden="true"
          className="absolute -inset-8 opacity-30 blur-xl"
          animate={reduceMotion ? {} : { rotate: open ? 360 : 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.55), transparent 55%)",
          }}
        />
        <div className="relative grid h-full w-full place-items-center text-white/90">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>

      {/* status dot */}
      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-sky-300/90 shadow-[0_0_0_18px_rgba(56,189,248,0.95)]" />

      {/* open indicator */}
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-white/20"
        animate={reduceMotion ? {} : { width: open ? 42 : 28, opacity: open ? 0.95 : 0.55 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      />
    </button>
  );
}

function RadialHUD({
  open,
  tabs,
  active,
  onPick,
  reduceMotion,
}: {
  open: boolean;
  tabs: QuantumTab[];
  active: QuantumTabId;
  onPick: (id: QuantumTabId) => void;
  reduceMotion: boolean;
}) {
  // Arrange items in an arc ABOVE the avatar (not full circle): from -160° to -20°
  const angles = useMemo(() => {
    const start = -160;
    const end = -20;
    const n = tabs.length;
    const step = (end - start) / Math.max(1, n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
  }, [tabs.length]);

  const radius = 140;

  const containerVariants = {
    closed: { opacity: 0, filter: "blur(10px)" },
    open: { opacity: 1, filter: "blur(0px)" },
  } as const;

  const itemVariants = {
    closed: (i: number) => ({
      opacity: 0,
      scale: 0.6,
      x: 0,
      y: 20,
      rotate: -10,
      transition: { duration: reduceMotion ? 0 : 0.12 },
    }),
    open: (i: number) => {
      const a = (angles[i] * Math.PI) / 180;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius; // negative = up
      return {
        opacity: 1,
        scale: 1,
        x,
        y,
        rotate: 0,
        transition: reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 30, mass: 0.7, delay: i * 0.015 },
      };
    },
  } as const;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={containerVariants}
          className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2"
        >
          {/* HUD halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full
            bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.22),rgba(168,85,247,0.12),transparent_60%)]
            blur-2xl"
          />

          {/* Radial Items */}
          {tabs.map((t, i) => (
            <motion.button
              key={t.id}
              custom={i}
              variants={itemVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => onPick(t.id)}
              className={[
                "pointer-events-auto absolute left-1/2 top-1/2",
                "-translate-x-1/2 -translate-y-1/2",
                "group",
              ].join(" ")}
              role="menuitem"
              aria-label={t.label}
            >
              <div
                className={[
                  "relative grid h-14 w-14 place-items-center rounded-3xl",
                  "border border-white/12 bg-slate-950/45 backdrop-blur-xl",
                  "shadow-[0_14px_40px_-20px_rgba(0,0,0,0.9)]",
                  t.id === active ? "bg-white/10 shadow-[0_0_0_1px_rgba(56,189,248,0.38)]" : "",
                ].join(" ")}
              >
                {/* neon bloom */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 blur-sm transition-opacity duration-150 group-hover:opacity-100
                  bg-[radial-gradient(120px_circle_at_30%_20%,rgba(56,189,248,0.42),transparent_55%),radial-gradient(120px_circle_at_70%_80%,rgba(168,85,247,0.32),transparent_60%)]"
                />
                <span className="relative text-white/90 [&>svg]:h-6 [&>svg]:w-6">
                  {t.icon}
                </span>

                {/* micro label */}
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/70 px-2 py-1 text-[11px] text-white/85 opacity-0 backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100">
                  {t.label}
                </span>
              </div>
            </motion.button>
          ))}

          {/* Close button (tiny) */}
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }}
            onClick={() => onPick(active)}
            className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 translate-y-[76px] rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10"
            aria-label="Close HUD"
          >
            <span className="inline-flex items-center gap-2">
              <X className="h-4 w-4" /> Close
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActivePanel({ tab }: { tab: QuantumTabId }) {
  switch (tab) {
    case "scheduler":
      return (
        <Panel title="Scheduler" subtitle="Your next 3 actions (tap to edit)">
          <ul className="space-y-2 text-sm text-white/85">
            <li className="rounded-2xl border border-white/10 bg-white/5 p-3">08:30 — Deep work sprint (45m)</li>
            <li className="rounded-2xl border border-white/10 bg-white/5 p-3">10:00 — Gym prep + commute</li>
            <li className="rounded-2xl border border-white/10 bg-white/5 p-3">12:15 — Meal + hydration check</li>
          </ul>
        </Panel>
      );
    case "gym":
      return (
        <Panel title="Gym" subtitle="Today's session">
          <div className="grid gap-2 text-sm text-white/85 sm:grid-cols-2">
            <CardLine k="Warmup" v="8 min incline walk" />
            <CardLine k="Main" v="Squat + Pull + Core" />
            <CardLine k="Finisher" v="Intervals 6×30s" />
            <CardLine k="Recovery" v="Protein + stretch" />
          </div>
        </Panel>
      );
    case "travel":
      return (
        <Panel title="Travel" subtitle="Quick planner">
          <div className="grid gap-2 text-sm text-white/85 sm:grid-cols-2">
            <CardLine k="Next trip" v="Set destination + dates" />
            <CardLine k="Budget" v="Flight + hotel targets" />
            <CardLine k="Checklist" v="Passport / charger / meds" />
            <CardLine k="Ideas" v="Save 3 places" />
          </div>
        </Panel>
      );
    case "notes":
      return (
        <Panel title="Notes" subtitle="Capture fast">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            Tip: make notes "atomic" — one idea per line. Then tag: #date #gym #travel.
          </div>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/85">
            • Buy groceries for diet plan<br />
            • Draft profile bio update<br />
            • Plan weekend hike route
          </div>
        </Panel>
      );
    case "calendar":
      return (
        <Panel title="Calendar" subtitle="This week at a glance">
          <div className="grid gap-2 text-sm text-white/85 sm:grid-cols-3">
            <MiniDay day="Mon" event="Gym + focus" />
            <MiniDay day="Wed" event="Social night" />
            <MiniDay day="Sat" event="Travel prep" />
          </div>
        </Panel>
      );
    case "diet":
      return (
        <Panel title="Diet" subtitle="Targets">
          <div className="grid gap-2 text-sm text-white/85 sm:grid-cols-3">
            <CardLine k="Protein" v="150g" />
            <CardLine k="Water" v="2.5L" />
            <CardLine k="Steps" v="8,000" />
          </div>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            Next meal: lean protein + greens + carbs (post-workout).
          </div>
        </Panel>
      );
    case "news":
      return (
        <Panel title="News" subtitle="Your feed lanes">
          <div className="grid gap-2 text-sm text-white/85 sm:grid-cols-2">
            <CardLine k="AI" v="Model updates + safety" />
            <CardLine k="Fitness" v="Training science" />
            <CardLine k="Travel" v="Deals + guides" />
            <CardLine k="Local" v="Events near you" />
          </div>
        </Panel>
      );
    case "settings":
      return (
        <Panel title="Settings" subtitle="Personalize your HUD">
          <div className="grid gap-2 text-sm text-white/85 sm:grid-cols-2">
            <CardLine k="Theme" v="Neon Glass" />
            <CardLine k="Motion" v="Cinematic" />
            <CardLine k="Privacy" v="On-device modes" />
            <CardLine k="Shortcuts" v="Customize" />
          </div>
        </Panel>
      );
  }
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3">
        <div className="text-base font-semibold text-white">{title}</div>
        <div className="text-xs text-white/60">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function CardLine({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{k}</div>
      <div className="text-sm text-white/90">{v}</div>
    </div>
  );
}

function MiniDay({ day, event }: { day: string; event: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{day}</div>
      <div className="text-sm text-white/90">{event}</div>
    </div>
  );
}