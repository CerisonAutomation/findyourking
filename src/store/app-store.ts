// Zustand Store with Persistence
// Extracted from app 2/ (Aether Forge) — enterprise-grade state management

import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

interface Location {
    lat: number;
    lng: number;
}

interface AppState {
    // Auth
    user: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // UI
    stage: string;
    leftMenuOpen: boolean;
    rightMenuOpen: boolean;
    activeChat: string | null;
    selectedProfile: any | null;

    // Data
    peers: any[];
    chats: any[];
    notifications: any[];
    favorites: string[];
    blocked: string[];

    // Filters
    searchFilters: {
        ageMin: number;
        ageMax: number;
        distance: number;
        tribes: string[];
        roles: string[];
        verifiedOnly: boolean;
        onlineOnly: boolean;
        withPhotosOnly: boolean;
    };
    meetNowFilter: boolean;
    verifiedFilter: boolean;
    onlineFilter: boolean;

    // GPS
    gpsEnabled: boolean;
    userLocation: Location | null;
    locationError: string | null;

    // Subscription
    subscriptionTier: string;
    isSubscribed: boolean;

    // Call
    activeCall: {
        peerId: string;
        type: 'audio' | 'video';
        isIncoming: boolean;
        isConnected: boolean;
    } | null;

    // Actions
    setUser: (user: any | null) => void;
    setAuthenticated: (value: boolean) => void;
    setLoading: (value: boolean) => void;
    setStage: (stage: string) => void;
    toggleLeftMenu: () => void;
    toggleRightMenu: () => void;
    setActiveChat: (chatId: string | null) => void;
    setSelectedProfile: (profile: any | null) => void;

    addPeer: (peer: any) => void;
    removePeer: (peerId: string) => void;
    updatePeer: (peerId: string, updates: Partial<any>) => void;
    setPeers: (peers: any[]) => void;

    addChat: (chat: any) => void;
    addMessage: (chatId: string, message: any) => void;
    markChatAsRead: (chatId: string) => void;

    addNotification: (notification: any) => void;
    markNotificationAsRead: (id: string) => void;
    clearNotifications: () => void;

    toggleFavorite: (peerId: string) => void;
    isFavorite: (peerId: string) => boolean;
    blockUser: (peerId: string) => void;
    unblockUser: (peerId: string) => void;
    isBlocked: (peerId: string) => boolean;

    setSearchFilters: (filters: Partial<AppState['searchFilters']>) => void;
    resetSearchFilters: () => void;
    toggleMeetNowFilter: () => void;
    toggleVerifiedFilter: () => void;
    toggleOnlineFilter: () => void;

    setGpsEnabled: (enabled: boolean) => void;
    setUserLocation: (location: Location | null) => void;
    setLocationError: (error: string | null) => void;

    setSubscriptionTier: (tier: string) => void;
    subscribe: (tier: string) => void;

    setActiveCall: (call: AppState['activeCall']) => void;
    endCall: () => void;

    logout: () => void;
    reset: () => void;
}

const defaultSearchFilters = {
    ageMin: 18,
    ageMax: 99,
    distance: 50,
    tribes: [] as string[],
    roles: [] as string[],
    verifiedOnly: false,
    onlineOnly: false,
    withPhotosOnly: true,
};

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    stage: 'onboarding' as const,
    leftMenuOpen: false,
    rightMenuOpen: false,
    activeChat: null,
    selectedProfile: null,
    peers: [],
    chats: [],
    notifications: [],
    favorites: [] as string[],
    blocked: [] as string[],
    searchFilters: defaultSearchFilters,
    meetNowFilter: false,
    verifiedFilter: false,
    onlineFilter: false,
    gpsEnabled: false,
    userLocation: null,
    locationError: null,
    subscriptionTier: 'free' as const,
    isSubscribed: false,
    activeCall: null,
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setUser: (user) => set({user, isAuthenticated: !!user}),
            setAuthenticated: (isAuthenticated) => set({isAuthenticated}),
            setLoading: (isLoading) => set({isLoading}),
            setStage: (stage) => set({stage}),
            toggleLeftMenu: () => set((state) => ({leftMenuOpen: !state.leftMenuOpen, rightMenuOpen: false})),
            toggleRightMenu: () => set((state) => ({rightMenuOpen: !state.rightMenuOpen, leftMenuOpen: false})),
            setActiveChat: (activeChat) => set({activeChat}),
            setSelectedProfile: (selectedProfile) => set({selectedProfile}),

            addPeer: (peer) => set((state) => {
                const exists = state.peers.find((p: any) => p.peerId === peer.peerId);
                if (exists) return {peers: state.peers.map((p: any) => p.peerId === peer.peerId ? {...p, ...peer} : p)};
                return {peers: [...state.peers, peer]};
            }),
            removePeer: (peerId) => set((state) => ({peers: state.peers.filter((p: any) => p.peerId !== peerId)})),
            updatePeer: (peerId, updates) => set((state) => ({
                peers: state.peers.map((p: any) => p.peerId === peerId ? {...p, ...updates} : p)
            })),
            setPeers: (peers) => set({peers}),

            addChat: (chat) => set((state) => {
                if (state.chats.find((c: any) => c.id === chat.id)) return {};
                return {chats: [...state.chats, chat]};
            }),
            addMessage: (chatId, message) => set((state) => ({
                chats: state.chats.map((chat: any) => {
                    if (chat.id !== chatId) return chat;
                    if (chat.messages?.find((m: any) => m.id === message.id)) return chat;
                    return {
                        ...chat,
                        messages: [...(chat.messages || []), message],
                        lastMessage: message,
                        updatedAt: Date.now(),
                        unreadCount: message.senderId !== state.user?.id ? (chat.unreadCount || 0) + 1 : chat.unreadCount,
                    };
                })
            })),
            markChatAsRead: (chatId) => set((state) => ({
                chats: state.chats.map((chat: any) => chat.id === chatId ? {...chat, unreadCount: 0} : chat)
            })),

            addNotification: (notification) => set((state) => ({notifications: [notification, ...state.notifications]})),
            markNotificationAsRead: (id) => set((state) => ({
                notifications: state.notifications.map((n: any) => n.id === id ? {...n, isRead: true} : n)
            })),
            clearNotifications: () => set({notifications: []}),

            toggleFavorite: (peerId) => set((state) => ({
                favorites: state.favorites.includes(peerId) ? state.favorites.filter(id => id !== peerId) : [...state.favorites, peerId]
            })),
            isFavorite: (peerId) => get().favorites.includes(peerId),

            blockUser: (peerId) => set((state) => ({blocked: [...state.blocked, peerId]})),
            unblockUser: (peerId) => set((state) => ({blocked: state.blocked.filter(id => id !== peerId)})),
            isBlocked: (peerId) => get().blocked.includes(peerId),

            setSearchFilters: (filters) => set((state) => ({searchFilters: {...state.searchFilters, ...filters}})),
            resetSearchFilters: () => set({searchFilters: defaultSearchFilters}),
            toggleMeetNowFilter: () => set((state) => ({meetNowFilter: !state.meetNowFilter})),
            toggleVerifiedFilter: () => set((state) => ({verifiedFilter: !state.verifiedFilter})),
            toggleOnlineFilter: () => set((state) => ({onlineFilter: !state.onlineFilter})),

            setGpsEnabled: (gpsEnabled) => set({gpsEnabled}),
            setUserLocation: (userLocation) => set({userLocation}),
            setLocationError: (locationError) => set({locationError}),

            setSubscriptionTier: (subscriptionTier) => set({
                subscriptionTier,
                isSubscribed: subscriptionTier !== 'free'
            }),
            subscribe: (tier) => set({subscriptionTier: tier, isSubscribed: true, stage: 'browse'}),

            setActiveCall: (activeCall) => set({activeCall}),
            endCall: () => set({activeCall: null}),

            logout: () => set({...initialState, peers: [], chats: [], notifications: []}),
            reset: () => set(initialState),
        }),
        {
            name: 'findyourking-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                favorites: state.favorites,
                blocked: state.blocked,
                subscriptionTier: state.subscriptionTier,
                isSubscribed: state.isSubscribed,
                searchFilters: state.searchFilters,
                gpsEnabled: state.gpsEnabled,
            }),
        }
    )
);

// Selector hooks for performance
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useStage = () => useAppStore((state) => state.stage);
export const usePeers = () => useAppStore((state) => state.peers);
export const useChats = () => useAppStore((state) => state.chats);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useFavorites = () => useAppStore((state) => state.favorites);
export const useSearchFilters = () => useAppStore((state) => state.searchFilters);
export const useSubscriptionTier = () => useAppStore((state) => state.subscriptionTier);
export const useActiveCall = () => useAppStore((state) => state.activeCall);
export const useGpsEnabled = () => useAppStore((state) => state.gpsEnabled);
export const useUserLocation = () => useAppStore((state) => state.userLocation);