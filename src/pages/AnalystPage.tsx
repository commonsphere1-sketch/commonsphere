import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import {
  Users,
  ShareNetwork,
  ChatTeardropDots,
  Lightning,
  PushPin,
  Export,
  ArrowRight,
  MagnifyingGlass,
  Plus,
  DotsThree,
  Fire,
  Sparkle,
  Bell,
  Hash,
  BookmarkSimple,
  CaretDown,
  PaperPlaneRight,
  Smiley,
  Paperclip,
  At,
  TrendUp,
  Globe,
  ArrowUp,
  X,
} from "@phosphor-icons/react";

/* ─── Static Data ───────────────────────────────────────────────────────── */

const ANALYSTS = [
  {
    id: 0,
    author: "Dr. Sarah Chen",
    initials: "SC",
    color: "#6366f1",
    role: "Senior Economist",
    online: true,
    followers: 1240,
    posts: 89,
  },
  {
    id: 1,
    author: "Marcus Webb",
    initials: "MW",
    color: "#10b981",
    role: "Geopolitical Analyst",
    online: true,
    followers: 876,
    posts: 61,
  },
  {
    id: 2,
    author: "Priya Nair",
    initials: "PN",
    color: "#f97316",
    role: "Policy Strategist",
    online: false,
    followers: 1034,
    posts: 74,
  },
  {
    id: 3,
    author: "James Okafor",
    initials: "JO",
    color: "#ec4899",
    role: "Defense & Security",
    online: true,
    followers: 590,
    posts: 42,
  },
  {
    id: 4,
    author: "Yuki Tanaka",
    initials: "YT",
    color: "#0ea5e9",
    role: "Asia-Pacific Analyst",
    online: false,
    followers: 720,
    posts: 55,
  },
];

type Post = {
  id: number;
  analystId: number;
  content: string;
  tags: string[];
  likes: number;
  replies: Reply[];
  shares: number;
  time: string;
  pinned?: boolean;
  channel: string;
};

type Reply = {
  analystId: number;
  content: string;
  time: string;
  likes: number;
};

const CHANNELS = [
  { id: "general", label: "General", icon: Hash },
  { id: "economics", label: "Economics", icon: TrendUp },
  { id: "geopolitics", label: "Geopolitics", icon: Globe },
  { id: "policy", label: "Policy", icon: BookmarkSimple },
];

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    analystId: 0,
    channel: "economics",
    content:
      "BRICS expansion accelerating dollar de-dollarization faster than consensus models predict. Watch the Q3 reserves data — the IMF's own projections are already being revised downward. This isn't a 5-year story anymore.",
    tags: ["BRICS", "USD", "Reserves"],
    likes: 47,
    shares: 12,
    time: "2h ago",
    pinned: true,
    replies: [
      {
        analystId: 1,
        content:
          "Agreed on the timeline compression. The Saudi petrodollar arrangement is the key variable most people are sleeping on.",
        time: "1h ago",
        likes: 14,
      },
      {
        analystId: 2,
        content:
          "The policy response from Washington has been underwhelming. We need a coordinated G7 counter-strategy.",
        time: "45m ago",
        likes: 9,
      },
    ],
  },
  {
    id: 2,
    analystId: 1,
    channel: "geopolitics",
    content:
      "Ceasefire momentum in Eastern Europe is being underpriced by energy markets. Nat-gas futures divergence widening — this represents a multi-sigma opportunity for anyone paying attention to the political risk premium.",
    tags: ["Ukraine", "Energy", "Gas"],
    likes: 31,
    shares: 8,
    time: "5h ago",
    replies: [
      {
        analystId: 3,
        content:
          "The military posture on both sides doesn't support the ceasefire narrative yet. Markets may be getting ahead of themselves.",
        time: "4h ago",
        likes: 22,
      },
    ],
  },
  {
    id: 3,
    analystId: 2,
    channel: "policy",
    content:
      "India&#39;s semiconductor subsidy package outpaces CHIPS Act on a per-capita basis. Supply chain realignment is already underway — three major Taiwan ODMs have announced Gujarat expansions in Q2 alone.",
    tags: ["India", "Tech", "Supply Chain"],
    likes: 28,
    shares: 15,
    time: "9h ago",
    replies: [],
  },
  {
    id: 4,
    analystId: 3,
    channel: "geopolitics",
    content:
      "Sudan conflict entering a new phase. RSF territorial gains in Darfur are being systematically underreported. Humanitarian corridor data from WFP paints a bleaker picture than official OCHA bulletins.",
    tags: ["Sudan", "Africa", "Humanitarian"],
    likes: 19,
    shares: 6,
    time: "12h ago",
    replies: [
      {
        analystId: 0,
        content:
          "The economic cost to the region is compounding. Chad and CAR GDP projections are being revised down across the board.",
        time: "11h ago",
        likes: 11,
      },
    ],
  },
  {
    id: 5,
    analystId: 4,
    channel: "geopolitics",
    content:
      "Taiwan Strait signal intelligence from the past 72hrs suggests a posture shift — not escalation, but repositioning. Beijing appears to be testing response latency rather than threatening action. Useful to watch ADIZ entry patterns.",
    tags: ["Taiwan", "China", "Defense"],
    likes: 53,
    shares: 21,
    time: "1d ago",
    replies: [
      {
        analystId: 3,
        content:
          "Consistent with the military exercise cadence we saw in Aug 2022 and 2023. Pattern recognition suggests this is calibrated signaling.",
        time: "23h ago",
        likes: 18,
      },
      {
        analystId: 1,
        content:
          "Markets are barely pricing in a 3% risk premium on Taiwan exposure. That gap is the story.",
        time: "22h ago",
        likes: 7,
      },
    ],
  },
  {
    id: 6,
    analystId: 0,
    channel: "economics",
    content:
      "Fed balance sheet normalization is hitting an inflection point. The reverse repo facility drawdown is nearly complete — when it empties, watch for sudden tightening of dollar liquidity in overnight markets. Potential Q4 volatility catalyst.",
    tags: ["Fed", "Liquidity", "USD"],
    likes: 62,
    shares: 27,
    time: "1d ago",
    replies: [],
  },
];

const TRENDING_TOPICS = [
  { tag: "BRICS", count: 34, hot: true },
  { tag: "USD", count: 28, hot: true },
  { tag: "Taiwan", count: 22, hot: false },
  { tag: "Energy", count: 19, hot: false },
  { tag: "India", count: 17, hot: false },
  { tag: "Ukraine", count: 15, hot: false },
  { tag: "Fed", count: 14, hot: false },
];

/* ─── Sub-components ────────────────────────────────────────────────────── */

function Avatar({
  analyst,
  size = 8,
}: {
  analyst: (typeof ANALYSTS)[0];
  size?: number;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold`}
        style={{
          background: analyst.color,
          fontSize: size <= 7 ? "10px" : size <= 9 ? "11px" : "12px",
          width: `${size * 4}px`,
          height: `${size * 4}px`,
        }}
      >
        {analyst.initials}
      </div>
      {analyst.online && (
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-current"
          style={{ background: "#10b981", borderColor: "inherit" }}
        />
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export function AnalystPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeChannel, setActiveChannel] = useState("general");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [liked, setLiked] = useState<number[]>([]);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [composeText, setComposeText] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [activeAnalyst, setActiveAnalyst] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* theme tokens */
  const bg = isLight ? "#f8fafc" : "#0b0b14";
  const cardBg = isLight ? "#ffffff" : "rgba(255,255,255,0.04)";
  const cardBorder = isLight
    ? "1px solid rgba(0,0,0,0.09)"
    : "1px solid rgba(255,255,255,0.08)";
  const cardShadow = isLight ? "0 1px 10px rgba(0,0,0,0.07)" : "none";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const bodyText = isLight ? "#1e293b" : "#e2e8f0";
  const mutedText = isLight ? "rgba(30,41,59,0.48)" : "rgba(255,255,255,0.38)";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const sidebarBg = isLight ? "#f1f5f9" : "rgba(255,255,255,0.025)";
  const inputBg = isLight ? "#f8fafc" : "rgba(255,255,255,0.06)";

  const filteredPosts = posts.filter((p) => {
    const matchChannel =
      activeChannel === "general" || p.channel === activeChannel;
    const matchSearch =
      !searchVal ||
      p.content.toLowerCase().includes(searchVal.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchVal.toLowerCase()));
    const matchAnalyst =
      activeAnalyst === null || p.analystId === activeAnalyst;
    return matchChannel && matchSearch && matchAnalyst;
  });

  function handleLike(postId: number) {
    setLiked((prev) =>
      prev.includes(postId)
        ? prev.filter((x) => x !== postId)
        : [...prev, postId],
    );
  }

  function handleBookmark(postId: number) {
    setBookmarked((prev) =>
      prev.includes(postId)
        ? prev.filter((x) => x !== postId)
        : [...prev, postId],
    );
  }

  function toggleReplies(postId: number) {
    setExpandedReplies((prev) =>
      prev.includes(postId)
        ? prev.filter((x) => x !== postId)
        : [...prev, postId],
    );
  }

  function submitReply(postId: number) {
    if (!replyText.trim()) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              replies: [
                ...p.replies,
                {
                  analystId: 0,
                  content: replyText.trim(),
                  time: "just now",
                  likes: 0,
                },
              ],
            }
          : p,
      ),
    );
    setReplyText("");
    setReplyingTo(null);
    setExpandedReplies((prev) =>
      prev.includes(postId) ? prev : [...prev, postId],
    );
  }

  function submitPost() {
    if (!composeText.trim()) return;
    const newPost: Post = {
      id: Date.now(),
      analystId: 0,
      channel: activeChannel === "general" ? "general" : activeChannel,
      content: composeText.trim(),
      tags: [],
      likes: 0,
      shares: 0,
      time: "just now",
      replies: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposeText("");
  }

  return (
    <div
      className="min-h-screen animate-fade-in"
      style={{ background: bg, color: bodyText }}
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-0 h-screen overflow-hidden">
        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <div
          className="hidden lg:flex flex-col w-64 shrink-0 border-r overflow-y-auto"
          style={{
            background: sidebarBg,
            borderColor: gridLine,
          }}
        >
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: gridLine }}>
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} weight="fill" style={{ color: "#6366f1" }} />
              <span
                className="text-sm font-bold font-sans"
                style={{ color: headText }}
              >
                Analyst Network
              </span>
            </div>
            <p className="text-[10px] font-sans" style={{ color: mutedText }}>
              {ANALYSTS.filter((a) => a.online).length} analysts online
            </p>
          </div>

          {/* Channels */}
          <div className="p-3">
            <p
              className="text-[9px] font-mono uppercase tracking-widest mb-2 px-1"
              style={{ color: mutedText }}
            >
              Channels
            </p>
            <div className="flex flex-col gap-0.5">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isActive = activeChannel === ch.id;
                const count = INITIAL_POSTS.filter(
                  (p) => ch.id === "general" || p.channel === ch.id,
                ).length;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors"
                    style={{
                      background: isActive
                        ? isLight
                          ? "#6366f118"
                          : "#6366f120"
                        : "transparent",
                      color: isActive ? "#6366f1" : mutedText,
                    }}
                  >
                    <Icon size={13} weight={isActive ? "fill" : "regular"} />
                    <span className="text-[11px] font-sans font-medium flex-1">
                      {ch.label}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isActive ? "#6366f120" : gridLine,
                        color: isActive ? "#6366f1" : mutedText,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analysts Online */}
          <div className="p-3 flex-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <p
                className="text-[9px] font-mono uppercase tracking-widest"
                style={{ color: mutedText }}
              >
                Analysts
              </p>
              <button style={{ color: mutedText }}>
                <Plus size={11} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {ANALYSTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    setActiveAnalyst(activeAnalyst === a.id ? null : a.id)
                  }
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors"
                  style={{
                    background:
                      activeAnalyst === a.id
                        ? isLight
                          ? `${a.color}15`
                          : `${a.color}20`
                        : "transparent",
                  }}
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: a.color }}
                    >
                      {a.initials}
                    </div>
                    {a.online && (
                      <span
                        className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-current"
                        style={{
                          background: "#10b981",
                          borderColor: sidebarBg,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-semibold font-sans truncate leading-none"
                      style={{ color: headText }}
                    >
                      {a.author}
                    </p>
                    <p
                      className="text-[9px] font-sans mt-0.5 truncate"
                      style={{ color: mutedText }}
                    >
                      {a.role}
                    </p>
                  </div>
                  <span
                    className="text-[8px] font-mono shrink-0"
                    style={{ color: a.online ? "#10b981" : mutedText }}
                  >
                    {a.online ? "●" : "○"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN FEED ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
            style={{
              background: cardBg,
              borderColor: gridLine,
            }}
          >
            <div className="flex items-center gap-2">
              <Hash size={15} style={{ color: "#6366f1" }} />
              <span
                className="text-sm font-bold font-sans"
                style={{ color: headText }}
              >
                {CHANNELS.find((c) => c.id === activeChannel)?.label ??
                  "General"}
              </span>
              {activeAnalyst !== null && (
                <span
                  className="flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-full"
                  style={{
                    background: ANALYSTS[activeAnalyst].color + "20",
                    color: ANALYSTS[activeAnalyst].color,
                  }}
                >
                  {ANALYSTS[activeAnalyst].initials}
                  <button onClick={() => setActiveAnalyst(null)}>
                    <X size={9} weight="bold" />
                  </button>
                </span>
              )}
            </div>
            <div className="flex-1" />

            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: inputBg, border: cardBorder }}
            >
              <MagnifyingGlass size={13} style={{ color: mutedText }} />
              <input
                type="text"
                placeholder="Search insights…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="bg-transparent outline-none text-[11px] font-sans w-36"
                style={{ color: headText }}
              />
            </div>

            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-sans transition-opacity hover:opacity-80"
              style={{
                background: isLight
                  ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                  : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: "#fff",
              }}
            >
              <Bell size={12} weight="fill" />
              Subscribe
            </button>
          </div>

          {/* Compose box */}
          <div
            className="flex items-start gap-3 px-4 py-3 border-b shrink-0"
            style={{ borderColor: gridLine }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: "#6366f1" }}
            >
              SC
            </div>
            <div
              className="flex-1 rounded-xl px-3 py-2"
              style={{ background: inputBg, border: cardBorder }}
            >
              <textarea
                placeholder="Share an insight with the network…"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    submitPost();
                }}
                rows={2}
                className="w-full bg-transparent outline-none text-[12px] font-sans resize-none"
                style={{ color: headText }}
              />
              <div
                className="flex items-center gap-2 mt-1.5 pt-1.5"
                style={{ borderTop: `1px solid ${gridLine}` }}
              >
                <button style={{ color: mutedText }}>
                  <Paperclip size={13} />
                </button>
                <button style={{ color: mutedText }}>
                  <At size={13} />
                </button>
                <button style={{ color: mutedText }}>
                  <Hash size={13} />
                </button>
                <button style={{ color: mutedText }}>
                  <Smiley size={13} />
                </button>
                <div className="flex-1" />
                <span
                  className="text-[10px] font-mono"
                  style={{ color: mutedText }}
                >
                  ⌘↵ to post
                </span>
                <button
                  onClick={submitPost}
                  disabled={!composeText.trim()}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "#6366f1", color: "#fff" }}
                >
                  <PaperPlaneRight size={11} weight="fill" />
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            {filteredPosts.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-16 gap-3"
                style={{ color: mutedText }}
              >
                <MagnifyingGlass size={32} />
                <p className="text-sm font-sans">
                  No insights match your filters
                </p>
              </div>
            )}

            {filteredPosts.map((post) => {
              const analyst = ANALYSTS[post.analystId];
              const isLiked = liked.includes(post.id);
              const isBookmarked = bookmarked.includes(post.id);
              const showReplies = expandedReplies.includes(post.id);
              const isReplying = replyingTo === post.id;

              return (
                <div
                  key={post.id}
                  className="rounded-2xl p-5"
                  style={{
                    background: cardBg,
                    border: post.pinned
                      ? `1px solid ${"#6366f1"}40`
                      : cardBorder,
                    boxShadow: cardShadow,
                  }}
                >
                  {/* Pinned badge */}
                  {post.pinned && (
                    <div
                      className="flex items-center gap-1 text-[9px] font-mono mb-3 pb-2"
                      style={{
                        color: "#6366f1",
                        borderBottom: `1px solid ${"#6366f1"}20`,
                      }}
                    >
                      <PushPin size={10} weight="fill" />
                      Pinned Insight
                    </div>
                  )}

                  {/* Author row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ background: analyst.color }}
                    >
                      {analyst.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-bold font-sans"
                          style={{ color: headText }}
                        >
                          {analyst.author}
                        </span>
                        <span
                          className="text-[10px] font-sans px-2 py-0.5 rounded-full"
                          style={{
                            background: analyst.color + "18",
                            color: analyst.color,
                          }}
                        >
                          {analyst.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-sans"
                          style={{ color: mutedText }}
                        >
                          {post.time}
                        </span>
                        <span style={{ color: gridLine }}>·</span>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: isLight ? "#6366f110" : "#6366f115",
                            color: "#6366f1",
                          }}
                        >
                          #{post.channel}
                        </span>
                      </div>
                    </div>
                    <button style={{ color: mutedText }}>
                      <DotsThree size={18} weight="bold" />
                    </button>
                  </div>

                  {/* Content */}
                  <p
                    className="text-sm font-sans leading-relaxed mb-3"
                    style={{ color: bodyText }}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            background: analyst.color + "15",
                            color: analyst.color,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action bar */}
                  <div
                    className="flex items-center gap-4 pt-3"
                    style={{ borderTop: `1px solid ${gridLine}` }}
                  >
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 text-[11px] font-sans transition-colors hover:opacity-80"
                      style={{ color: isLiked ? "#ef4444" : mutedText }}
                    >
                      <Lightning
                        size={13}
                        weight={isLiked ? "fill" : "regular"}
                      />
                      {post.likes + (isLiked ? 1 : 0)}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(isReplying ? null : post.id);
                        if (!showReplies) toggleReplies(post.id);
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-sans transition-colors hover:opacity-80"
                      style={{ color: isReplying ? "#6366f1" : mutedText }}
                    >
                      <ChatTeardropDots
                        size={13}
                        weight={isReplying ? "fill" : "regular"}
                      />
                      {post.replies.length > 0
                        ? `${post.replies.length} Repl${post.replies.length === 1 ? "y" : "ies"}`
                        : "Reply"}
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-[11px] font-sans transition-colors hover:opacity-80"
                      style={{ color: mutedText }}
                    >
                      <ShareNetwork size={13} />
                      {post.shares}
                    </button>
                    <button
                      onClick={() => handleBookmark(post.id)}
                      className="flex items-center gap-1.5 text-[11px] font-sans transition-colors hover:opacity-80 ml-auto"
                      style={{ color: isBookmarked ? "#f59e0b" : mutedText }}
                    >
                      <BookmarkSimple
                        size={13}
                        weight={isBookmarked ? "fill" : "regular"}
                      />
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-[11px] font-sans transition-colors hover:opacity-80"
                      style={{ color: mutedText }}
                    >
                      <Export size={13} />
                    </button>
                  </div>

                  {/* Replies */}
                  {post.replies.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleReplies(post.id)}
                        className="flex items-center gap-1.5 text-[10px] font-sans mb-2 hover:opacity-70 transition-opacity"
                        style={{ color: "#6366f1" }}
                      >
                        <CaretDown
                          size={10}
                          weight="bold"
                          style={{
                            transform: showReplies ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        />
                        {showReplies
                          ? "Hide replies"
                          : `Show ${post.replies.length} repl${post.replies.length === 1 ? "y" : "ies"}`}
                      </button>
                      {showReplies && (
                        <div
                          className="flex flex-col gap-3 pl-4 pt-2"
                          style={{ borderLeft: `2px solid ${gridLine}` }}
                        >
                          {post.replies.map((r, ri) => {
                            const ra = ANALYSTS[r.analystId];
                            return (
                              <div
                                key={ri}
                                className="flex items-start gap-2.5"
                              >
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                  style={{ background: ra.color }}
                                >
                                  {ra.initials}
                                </div>
                                <div
                                  className="flex-1 rounded-xl p-2.5"
                                  style={{
                                    background: isLight
                                      ? "rgba(0,0,0,0.025)"
                                      : "rgba(255,255,255,0.03)",
                                    border: isLight
                                      ? "1px solid rgba(0,0,0,0.06)"
                                      : "1px solid rgba(255,255,255,0.06)",
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span
                                      className="text-[11px] font-bold font-sans"
                                      style={{ color: headText }}
                                    >
                                      {ra.author}
                                    </span>
                                    <span
                                      className="text-[9px] font-sans"
                                      style={{ color: mutedText }}
                                    >
                                      {r.time}
                                    </span>
                                  </div>
                                  <p
                                    className="text-[11px] font-sans leading-relaxed"
                                    style={{ color: bodyText }}
                                  >
                                    {r.content}
                                  </p>
                                  <button
                                    className="flex items-center gap-1 text-[10px] font-sans mt-1.5 hover:opacity-70 transition-opacity"
                                    style={{ color: mutedText }}
                                  >
                                    <Lightning size={10} />
                                    {r.likes}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply compose */}
                  {isReplying && (
                    <div
                      className="flex items-start gap-2.5 mt-3 pl-4"
                      style={{ borderLeft: `2px solid #6366f1` }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ background: "#6366f1" }}
                      >
                        SC
                      </div>
                      <div
                        className="flex-1 rounded-xl px-3 py-2"
                        style={{
                          background: inputBg,
                          border: `1px solid #6366f140`,
                        }}
                      >
                        <input
                          type="text"
                          placeholder={`Reply to ${analyst.author}…`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitReply(post.id);
                            if (e.key === "Escape") setReplyingTo(null);
                          }}
                          autoFocus
                          className="w-full bg-transparent outline-none text-[11px] font-sans"
                          style={{ color: headText }}
                        />
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="text-[10px] font-sans hover:opacity-70"
                            style={{ color: mutedText }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => submitReply(post.id)}
                            disabled={!replyText.trim()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: "#6366f1", color: "#fff" }}
                          >
                            <PaperPlaneRight size={10} weight="fill" />
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
        <div
          className="hidden xl:flex flex-col w-72 shrink-0 border-l overflow-y-auto p-4 gap-5"
          style={{
            background: sidebarBg,
            borderColor: gridLine,
          }}
        >
          {/* Network stats */}
          <div
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: cardBorder }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkle size={13} weight="fill" style={{ color: "#6366f1" }} />
              <span
                className="text-[11px] font-bold font-sans"
                style={{ color: headText }}
              >
                Network Stats
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Analysts", value: "127" },
                { label: "Posts Today", value: "43" },
                { label: "Discussions", value: "18" },
                { label: "Trending", value: "7" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-2.5 text-center"
                  style={{
                    background: isLight
                      ? "rgba(99,102,241,0.05)"
                      : "rgba(99,102,241,0.08)",
                  }}
                >
                  <p
                    className="text-base font-bold font-mono"
                    style={{ color: headText }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-[9px] font-sans"
                    style={{ color: mutedText }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Trending topics */}
          <div
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: cardBorder }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Fire size={13} weight="fill" style={{ color: "#ef4444" }} />
              <span
                className="text-[11px] font-bold font-sans"
                style={{ color: headText }}
              >
                Trending Topics
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {TRENDING_TOPICS.map((t, i) => (
                <button
                  key={t.tag}
                  onClick={() => setSearchVal(t.tag)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:opacity-80"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.025)"
                      : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span
                    className="text-[10px] font-mono w-4 shrink-0 text-center"
                    style={{ color: mutedText }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-[11px] font-mono flex-1"
                    style={{ color: "#6366f1" }}
                  >
                    #{t.tag}
                  </span>
                  {t.hot && (
                    <Fire
                      size={10}
                      weight="fill"
                      style={{ color: "#ef4444" }}
                    />
                  )}
                  <span
                    className="text-[9px] font-mono"
                    style={{ color: mutedText }}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Top analysts */}
          <div
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: cardBorder }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <ArrowUp size={13} weight="bold" style={{ color: "#10b981" }} />
                <span
                  className="text-[11px] font-bold font-sans"
                  style={{ color: headText }}
                >
                  Top Analysts
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {ANALYSTS.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl"
                  style={{
                    background: isLight
                      ? "rgba(0,0,0,0.02)"
                      : "rgba(255,255,255,0.025)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: a.color }}
                  >
                    {a.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-semibold font-sans truncate"
                      style={{ color: headText }}
                    >
                      {a.author}
                    </p>
                    <p
                      className="text-[9px] font-sans truncate"
                      style={{ color: mutedText }}
                    >
                      {a.followers.toLocaleString()} followers
                    </p>
                  </div>
                  <button
                    className="px-2 py-1 rounded-lg text-[9px] font-semibold font-sans transition-opacity hover:opacity-80"
                    style={{
                      background: a.color + "20",
                      color: a.color,
                    }}
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Join CTA */}
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: isLight
                ? "linear-gradient(135deg,#eef2ff,#ede9fe)"
                : "linear-gradient(135deg,#1e1b4b,#2e1065)",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            <Users
              size={24}
              weight="fill"
              style={{ color: "#6366f1", margin: "0 auto 8px" }}
            />
            <p
              className="text-xs font-bold font-sans mb-1"
              style={{ color: headText }}
            >
              Join the Network
            </p>
            <p
              className="text-[10px] font-sans mb-3"
              style={{ color: mutedText }}
            >
              Connect with 127+ analysts. Share insights, follow debates.
            </p>
            <button
              className="w-full py-2 rounded-xl text-[11px] font-semibold font-sans flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
              }}
            >
              <Sparkle size={11} weight="fill" />
              Request Access
              <ArrowRight size={11} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
