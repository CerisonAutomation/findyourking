'use client'

import {useCallback, useEffect, useState} from "react";

/* ═══════════════════════════════════════════════════════════════
   FIND YOUR KING — COMPLETE APP
   Exact original style: deep void black, crimson, gold, cobalt
   Zero border radius · Space Grotesk bold · Plasma accents
═══════════════════════════════════════════════════════════════ */

// ── Global styles injected once ──────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #06060E;
    --bg1: #0A0A16;
    --bg2: #0F0F1E;
    --bg3: #141428;
    --border: rgba(255,255,255,0.07);
    --crimson: #DC2020;
    --crimson-bright: #FF2E2E;
    --gold: #F5A623;
    --cobalt: #3B82F6;
    --emerald: #22C55E;
    --muted: rgba(255,255,255,0.35);
    --faint: rgba(255,255,255,0.08);
  }
  body { background: var(--bg); font-family: 'Space Grotesk', system-ui, sans-serif; color: #fff; overflow: hidden; }
  ::-webkit-scrollbar { width: 0; }
  ::selection { background: rgba(220,32,32,0.3); }
`;

// ── Type helpers ─────────────────────────────────────────────────
type Screen =
    | "landing" | "signin" | "signup"
    | "discover" | "messages" | "chat" | "rightnow" | "events" | "eventdetail"
    | "profile" | "viewprofile" | "editprofile"
    | "notifications" | "settings" | "settingsaccount" | "settingsprivacy"
    | "settingsnotifications" | "subscription" | "safety" | "blocked"
    | "onboarding";

interface User {
    id: string;
    name: string;
    age: number;
    city: string;
    bio: string;
    avatar: string;
    tribes: string[];
    distance: number;
    online: boolean;
    verified: boolean;
    premium: boolean;
}

interface Message {
    id: string;
    text: string;
    time: string;
    sent: boolean;
    read: boolean;
    type?: "text" | "image" | "gif";
}

interface Conversation {
    id: string;
    user: User;
    lastMsg: string;
    time: string;
    unread: number;
}

interface Event {
    id: string;
    title: string;
    type: string;
    date: string;
    time: string;
    location: string;
    attending: number;
    capacity: number;
    host: User;
    tags: string[];
    going: boolean;
}

interface Notification {
    id: string;
    type: string;
    text: string;
    time: string;
    read: boolean;
    from?: User;
}

// ── Mock data ─────────────────────────────────────────────────────
const AVATARS = [
    "https://i.pravatar.cc/150?img=11", "https://i.pravatar.cc/150?img=15",
    "https://i.pravatar.cc/150?img=18", "https://i.pravatar.cc/150?img=22",
    "https://i.pravatar.cc/150?img=25", "https://i.pravatar.cc/150?img=32",
    "https://i.pravatar.cc/150?img=36", "https://i.pravatar.cc/150?img=41",
    "https://i.pravatar.cc/150?img=44", "https://i.pravatar.cc/150?img=52",
    "https://i.pravatar.cc/150?img=57", "https://i.pravatar.cc/150?img=60",
];

const NAMES = ["Marcus", "Dante", "Lorenzo", "Rafael", "Sebastian", "Xavier", "Adrian", "Nico", "Luca", "Javier", "Mateo", "Carlos"];

const CITIES = ["Madrid", "Barcelona", "London", "Berlin", "Amsterdam", "Paris", "Milan", "Lisbon", "Dubai", "NYC", "LA", "Melbourne"];

const TRIBES = ["Bear", "Muscle", "Jock", "Daddy", "Otter", "Twink", "Leather", "Masc", "Vers", "Geek"];

const makeUser = (i: number): User => ({
    id: String(i),
    name: NAMES[i % NAMES.length],
    age: 24 + (i * 3 % 18),
    city: CITIES[i % CITIES.length],
    bio: `Living my best life. ${TRIBES[i % TRIBES.length]} proud. Looking for real connections.`,
    avatar: AVATARS[i % AVATARS.length],
    tribes: [TRIBES[i % TRIBES.length], TRIBES[(i + 2) % TRIBES.length]],
    distance: parseFloat((0.3 + i * 0.7).toFixed(1)),
    online: i % 3 !== 0,
    verified: i % 4 === 0,
    premium: i % 5 === 0,
});

const USERS: User[] = Array.from({length: 24}, (_, i) => makeUser(i));

const ME: User = {
    id: "me",
    name: "King",
    age: 28,
    city: "Madrid",
    bio: "Premium member. Real connections only. Bear tribe. Love events, travel, good food.",
    avatar: "https://i.pravatar.cc/150?img=8",
    tribes: ["Bear", "Muscle"],
    distance: 0,
    online: true,
    verified: true,
    premium: true
};

// ── Utility ───────────────────────────────────────────────────────
const px = (n: number) => `${n}px`;

const s = {
    // Layout
    screen: {
        display: "flex",
        flexDirection: "column" as const,
        height: "100dvh",
        background: "var(--bg)",
        overflow: "hidden"
    },

    scroll: {
        flex: 1,
        overflowY: "auto" as const,
        overflowX: "hidden" as const
    },

    // Typography
    hero: {
        fontSize: 56,
        fontWeight: 900,
        letterSpacing: "-1.5px",
        lineHeight: 1.0
    },

    h1: {
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: "-0.5px",
        lineHeight: 1.1
    },

    h2: {
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: "-0.3px"
    },

    body: {
        fontSize: 14,
        lineHeight: 1.55,
        color: "rgba(255,255,255,0.72)"
    },

    small: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const
    },

    label: {
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.18em",
        textTransform: "uppercase" as const,
        color: "var(--muted)"
    },

    // Surfaces
    card: {
        background: "var(--bg1)",
        border: "1px solid var(--border)"
    },

    card2: {
        background: "var(--bg2)",
        border: "1px solid var(--border)"
    },

    // Input
    input: {
        width: "100%",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 0,
        padding: "14px 16px",
        color: "#fff",
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.15s",
    },

    // Buttons
    btnPrimary: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "16px 28px",
        background: "linear-gradient(135deg,#DC2020,#FF6B35)",
        border: "none",
        color: "#fff",
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: "0.06em",
        cursor: "pointer",
        width: "100%",
        fontFamily: "inherit",
        transition: "opacity 0.15s",
    },

    btnGhost: {
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        padding: "8px 12px",
    },
};

// ── Icons (inline SVG) ─────────────────────────────────────────────
const Icon = ({name, size = 20, color = "#fff", strokeWidth = 2}: {
    name: string;
    size?: number;
    color?: string;
    strokeWidth?: number
}) => {
    const paths: Record<string, string> = {
        crown: "M3 18h18M5 9l4-4 4 4-4 4 4v9H5V9z",
        compass: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0 0V2m0 20H2m10-20h10M12 12l4.5-4.5M12 12l-4.5 4.5",
        zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
        message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
        user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
        bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
        heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
        star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        check: "M20 6L9 17l-5-5",
        x: "M18 6L6 18M6 6l12 12",
        plus: "M12 5v14M5 12h14",
        chevronRight: "M9 18l6-6-6-6",
        chevronLeft: "M15 18l-6-6 6-6",
        settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06-.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0V.09A1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
        map: "M3 6l6-2 6 2 6-2v16l-6 2-6 2-6 2V6z",
        calendar: "M3 4h18v18H3V4zM16 2v4M8 2v4M3 10h18",
        fire: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 011.5-4.5z",
        send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
        camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11zM12 17a4 4 0 100-8 4 4 0 000 8z",
        mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0V-2M12 19v4M8 23h8",
        shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
        lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
        mappin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
        clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
        sparkles: "M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M1 12h2M21 12h2M4.22 19.78l.7-.7M18.36 5.64l.7-.7M12 6a6 6 0 100 12A6 6 0 0012 6z",
        users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
        globe: "M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 014-10z",
    };

    const d = paths[name] || paths.star;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
             strokeLinecap="round" strokeLinejoin="round">
            <path d={d}/>
        </svg>
    );
};

// ── Mock AI AutoReply Component ─────────────────────────────────────
const AutoReplyButton = ({message, onSelectReply}: { message: string; onSelectReply: (reply: string) => void }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const generateReplies = async () => {
        setLoading(true);
        // Simulate AI processing delay
        setTimeout(() => {
            const mockReplies = [
                "Hey king 👑 Thanks for reaching out!",
                "What's good? Looking to connect 🔥",
                "Nice profile! What brings you here?",
                "Down to chat if you're interested - want to meet up?",
                "Your vibe is exactly what I'm looking for"
            ];
            setSuggestions(mockReplies.slice(0, 3));
            setLoading(false);
        }, 1200);
    };

    return (
        <div style={{marginTop: 12}}>
            <button
                onClick={generateReplies}
                disabled={loading}
                style={{
                    ...s.btnGhost,
                    padding: "8px 16px",
                    fontSize: 12,
                    opacity: loading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                }}
            >
                <Icon name="sparkles" size={14} color="var(--gold)"/>
                {loading ? 'Generating...' : '💡 Smart Replies'}
            </button>

            {suggestions.length > 0 && (
                <div style={{marginTop: 8, display: "flex", flexDirection: "column", gap: 6}}>
                    {suggestions.map((reply, i) => (
                        <button
                            key={i}
                            onClick={() => onSelectReply(reply)}
                            style={{
                                ...s.card2,
                                padding: "10px 14px",
                                textAlign: "left",
                                border: "1px solid rgba(245,166,35,0.3)",
                                background: "rgba(245,166,35,0.05)",
                                cursor: "pointer",
                                transition: "all 0.15s"
                            }}
                        >
                            <span style={{fontSize: 13, color: "var(--gold)"}}>{reply}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Mock Voice Control Component ─────────────────────────────────────
const VoiceKing = ({onCommand}: { onCommand: (command: string, params?: string[]) => void }) => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    const startListening = () => {
        setListening(true);
        setTranscript("Listening for commands...");

        // Simulate voice recognition
        setTimeout(() => {
            const commands = [
                "show nearby",
                "message Marcus",
                "go to events",
                "find events in Madrid",
                "open profile",
                "turn on right now"
            ];
            const randomCommand = commands[Math.floor(Math.random() * commands.length)];
            setTranscript(`Heard: "${randomCommand}"`);

            // Process command
            if (randomCommand.includes("show nearby")) onCommand('navigate', ['discover']);
            else if (randomCommand.includes("message")) onCommand('message', ['Marcus']);
            else if (randomCommand.includes("events")) onCommand('navigate', ['events']);
            else if (randomCommand.includes("profile")) onCommand('navigate', ['profile']);
            else if (randomCommand.includes("right now")) onCommand('navigate', ['rightnow']);

            setTimeout(() => {
                setListening(false);
                setTranscript("");
            }, 2000);
        }, 1500);
    };

    return (
        <button
            onClick={startListening}
            disabled={listening}
            style={{
                position: "fixed",
                bottom: 80,
                right: 16,
                width: 56,
                height: 56,
                background: listening ? "var(--crimson)" : "linear-gradient(135deg,var(--gold),var(--crimson))",
                border: "none",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: listening ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(245,166,35,0.4)",
                zIndex: 1000,
                transition: "all 0.2s"
            }}
        >
            <span style={{fontSize: 16}}>{listening ? '🎤' : '👑'}</span>
        </button>
    );
};

// ── Mock Map Component ─────────────────────────────────────────────
const KingMap = ({users, onUserSelect}: { users: User[]; onUserSelect: (user: User) => void }) => {
    return (
        <div style={{
            height: 300,
            position: "relative",
            background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(220,32,32,0.05))",
            border: "1px solid var(--border)",
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <div style={{textAlign: "center"}}>
                <Icon name="map" size={48} color="rgba(255,255,255,0.3)"/>
                <div style={{marginTop: 12, ...s.body, fontSize: 12}}>
                    {users.filter(u => u.online).length} kings nearby · Live P2P discovery
                </div>
                <div style={{
                    marginTop: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "center",
                    maxWidth: 300
                }}>
                    {users.filter(u => u.online).slice(0, 6).map(user => (
                        <button
                            key={user.id}
                            onClick={() => onUserSelect(user)}
                            style={{
                                ...s.card2,
                                padding: "8px 12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11
                            }}
                        >
                            <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: user.verified ? "var(--crimson)" : "var(--cobalt)",
                                border: "2px solid var(--bg)",
                                position: "relative"
                            }}>
                                {user.online && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: -2,
                                        right: -2,
                                        width: 8,
                                        height: 8,
                                        background: "#22C55E",
                                        borderRadius: "50%"
                                    }}/>
                                )}
                            </div>
                            <span>{user.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Main App Component ─────────────────────────────────────────────
export default function FindYourKing() {
    const [screen, setScreen] = useState<Screen>("landing");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [message, setMessage] = useState("");

    const handleCommand = useCallback((command: string, params?: string[]) => {
        console.log('Voice command:', command, params);
        switch (command) {
            case 'navigate':
                if (params?.[0]) setScreen(params[0] as Screen);
                break;
            case 'message':
                if (params?.[0]) {
                    const user = USERS.find(u => u.name.toLowerCase() === params[0].toLowerCase());
                    if (user) {
                        setSelectedUser(user);
                        setScreen('chat');
                    }
                }
                break;
            case 'events':
                setScreen('events');
                break;
        }
    }, []);

    // CSS animations
    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = GLOBAL_CSS + `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.15)} }
      @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      input:focus { border-color: rgba(220,32,32,0.5) !important; }
      button:active { opacity:0.85; }
      .map-container { border-radius: 0; overflow: hidden; }
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div style={{
            maxWidth: 430,
            margin: "0 auto",
            height: "100dvh",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg)",
            overflow: "hidden",
            position: "relative"
        }}>

            {/* Voice Control */}
            <VoiceKing onCommand={handleCommand}/>

            {/* Main Content */}
            <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
                {screen === "landing" && (
                    <div style={{...s.screen, position: "relative", overflowY: "auto"}}>
                        <div style={{
                            position: "relative",
                            zIndex: 1,
                            padding: "60px 24px 40px",
                            minHeight: "100dvh",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between"
                        }}>
                            <div>
                                <h1 style={{...s.hero, marginBottom: 0}}>
                                    <span style={{color: "#fff", display: "block"}}>FIND YOUR</span>
                                    <span style={{
                                        background: "linear-gradient(135deg,#DC2020,#FF6B35)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                        display: "block"
                                    }}>KING.</span>
                                </h1>
                                <p style={{...s.body, fontSize: 16, lineHeight: 1.65, maxWidth: 540, marginBottom: 36}}>
                                    The premium gay social platform with on-device AI, voice control, and true P2P
                                    privacy.
                                </p>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: 0,
                                    marginBottom: 40
                                }}>
                                    <div style={{textAlign: "center"}}>
                                        <div style={{fontSize: 36, fontWeight: 900, color: "var(--crimson)"}}>24</div>
                                        <div style={{...s.label, marginTop: 4}}>KINGS NEARBY</div>
                                    </div>
                                    <div style={{textAlign: "center"}}>
                                        <div style={{fontSize: 36, fontWeight: 900, color: "var(--cobalt)"}}>P2P</div>
                                        <div style={{...s.label, marginTop: 4}}>ENCRYPTED</div>
                                    </div>
                                    <div style={{textAlign: "center"}}>
                                        <div style={{fontSize: 36, fontWeight: 900, color: "var(--gold)"}}>AI</div>
                                        <div style={{...s.label, marginTop: 4}}>AUTO-REPLY</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <button style={{...s.btnPrimary, marginBottom: 20}}
                                        onClick={() => setScreen("discover")}>
                                    <Icon name="compass" size={18} color="#fff"/>
                                    START DISCOVERING
                                </button>
                                <div style={{textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)"}}>
                                    🎤 Voice Commands Active · 💡 On-Device AI · 🔒 Zero-Knowledge
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {screen === "discover" && (
                    <div style={{...s.screen}}>
                        <div style={{...s.h2, padding: "20px 16px 12px"}}>Discover Kings</div>
                        <KingMap users={USERS.filter(u => u.online)} onUserSelect={(user) => {
                            setSelectedUser(user);
                            setScreen("viewprofile");
                        }}/>
                        <div style={{...s.scroll, padding: "12px"}}>
                            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8}}>
                                {USERS.map(user => (
                                    <div key={user.id} style={{...s.card, cursor: "pointer", padding: 12}}
                                         onClick={() => {
                                             setSelectedUser(user);
                                             setScreen("viewprofile");
                                         }}>
                                        <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 8}}>
                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "50%",
                                                overflow: "hidden",
                                                border: user.verified ? "2px solid var(--crimson)" : "1px solid rgba(255,255,255,0.1)"
                                            }}>
                                                <img src={user.avatar} alt={user.name}
                                                     style={{width: "100%", height: "100%", objectFit: "cover"}}/>
                                            </div>
                                            <div style={{flex: 1}}>
                                                <div style={{
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    marginBottom: 2
                                                }}>{user.name}</div>
                                                <div style={{
                                                    fontSize: 12,
                                                    color: "rgba(255,255,255,0.6)"
                                                }}>{user.distance}km away · {user.city}</div>
                                            </div>
                                            {user.online && <div style={{
                                                width: 8,
                                                height: 8,
                                                background: "#22C55E",
                                                borderRadius: "50%"
                                            }}/>}
                                        </div>
                                        <p style={{...s.body, fontSize: 13}}>{user.bio}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {screen === "viewprofile" && selectedUser && (
                    <div style={{...s.screen}}>
                        <div style={{
                            ...s.h2,
                            padding: "20px 16px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <span>{selectedUser.name}</span>
                            <button onClick={() => setScreen("discover")} style={{...s.btnGhost, padding: 0}}>
                                <Icon name="x" size={20} color="rgba(255,255,255,0.6)"/>
                            </button>
                        </div>

                        <div style={{...s.scroll, padding: "16px"}}>
                            <div style={{textAlign: "center", marginBottom: 20}}>
                                <div style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    border: selectedUser.verified ? "3px solid var(--crimson)" : "1px solid rgba(255,255,255,0.1)",
                                    margin: "0 auto 16px"
                                }}>
                                    <img src={selectedUser.avatar} alt={selectedUser.name}
                                         style={{width: "100%", height: "100%", objectFit: "cover"}}/>
                                </div>
                                <h2 style={{...s.h1, marginBottom: 8}}>{selectedUser.name}, {selectedUser.age}</h2>
                                <p style={{...s.body, marginBottom: 20}}>{selectedUser.bio}</p>
                            </div>

                            <button style={{...s.btnPrimary, marginBottom: 16}} onClick={() => setScreen("chat")}>
                                <Icon name="message" size={18} color="#fff"/>
                                Send Message
                            </button>
                        </div>
                    </div>
                )}

                {screen === "chat" && selectedUser && (
                    <div style={{...s.screen}}>
                        <div style={{
                            ...s.h2,
                            padding: "20px 16px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <span>{selectedUser.name}</span>
                            <button onClick={() => setScreen("discover")} style={{...s.btnGhost, padding: 0}}>
                                <Icon name="x" size={20} color="rgba(255,255,255,0.6)"/>
                            </button>
                        </div>

                        <div style={{...s.scroll, padding: "16px"}}>
                            <div style={{marginBottom: 16}}>
                                <div style={{...s.card2, padding: 12, marginBottom: 8}}>
                                    <div style={{fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4}}>Last
                                        message
                                    </div>
                                    <div style={{fontSize: 14}}>Hey! Saw your profile, you're 🔥</div>
                                </div>
                            </div>

                            <AutoReplyButton
                                message="Hey! Saw your profile, you're 🔥"
                                onSelectReply={(reply) => setMessage(reply)}
                            />

                            <div style={{display: "flex", gap: 8, marginTop: 16}}>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    style={{...s.input, flex: 1}}
                                />
                                <button style={{...s.btnPrimary, width: "auto", padding: "14px 20px"}}>
                                    <Icon name="send" size={16} color="#fff"/>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}