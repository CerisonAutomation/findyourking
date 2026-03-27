import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export type ThemeId = 'professional' | 'cobalt' | 'emerald' | 'amethyst' | 'carbon' | 'rose';

export type ThemeConfig = {
    id: ThemeId;
    name: string;
    emoji: string;
    desc: string;
    primary: string;
    accent: string;
    preview: [string, string, string];
};

export const THEMES: ThemeConfig[] = [
    {
        id: 'professional',
        name: 'Royal Gold',
        emoji: '👑',
        desc: 'Regal crimson & gold',
        primary: '0 90% 62%',
        accent: '35 95% 58%',
        preview: ['#ef4444', '#f97316', '#0A0A0F'],
    },
    {
        id: 'cobalt',
        name: 'Cobalt King',
        emoji: '⚡',
        desc: 'Electric blue power',
        primary: '220 88% 60%',
        accent: '200 90% 55%',
        preview: ['#3b82f6', '#06b6d4', '#080810'],
    },
    {
        id: 'emerald',
        name: 'Emerald Hunter',
        emoji: '🌿',
        desc: 'Deep forest vitality',
        primary: '152 68% 40%',
        accent: '170 75% 45%',
        preview: ['#10b981', '#14b8a6', '#080F0C'],
    },
    {
        id: 'amethyst',
        name: 'Amethyst God',
        emoji: '💜',
        desc: 'Mystic purple dominance',
        primary: '270 78% 62%',
        accent: '290 75% 60%',
        preview: ['#a855f7', '#d946ef', '#0A080F'],
    },
    {
        id: 'carbon',
        name: 'Carbon Black',
        emoji: '🖤',
        desc: 'Minimal monochrome',
        primary: '0 0% 85%',
        accent: '0 0% 65%',
        preview: ['#d4d4d4', '#a3a3a3', '#050505'],
    },
    {
        id: 'rose',
        name: 'Rose Desire',
        emoji: '🌹',
        desc: 'Warm rose passion',
        primary: '350 82% 60%',
        accent: '15 90% 58%',
        preview: ['#f43f5e', '#fb923c', '#0F080A'],
    },
];

interface ThemeState {
    themeId: ThemeId;
    setTheme: (id: ThemeId, userId?: string) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            themeId: 'professional',
            setTheme: async (id, userId) => {
                set({themeId: id});
                applyTheme(id);
                // Theme persistence now handled by local storage via zustand persist
            },
        }),
        {name: 'fyk-theme'}
    )
);

export function applyTheme(id: ThemeId) {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--ring', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--sidebar-primary', theme.primary);
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${theme.primary}), hsl(${theme.accent}))`);
    root.style.setProperty('--shadow-glow', `0 0 36px hsl(${theme.primary} / 0.22)`);
    root.style.setProperty('--shadow-glow-sm', `0 0 18px hsl(${theme.primary} / 0.14)`);

    const bgMap: Record<ThemeId, [string, string]> = {
        carbon: ['0 0% 4%', '0 0% 8%'],
        cobalt: ['225 20% 5%', '225 18% 9%'],
        emerald: ['160 15% 5%', '160 12% 9%'],
        amethyst: ['270 15% 5%', '270 12% 9%'],
        rose: ['350 12% 5%', '350 10% 9%'],
        professional: ['240 6% 5%', '240 5% 9%'],
    };

    const [bg, card] = bgMap[id] || bgMap.professional;
    root.style.setProperty('--background', bg);
    root.style.setProperty('--card', card);
}