'use client'

import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'

interface PresenceState {
    members: Set<string>
    setMembers: (members: Set<string>) => void
    addMember: (memberId: string) => void
    removeMember: (memberId: string) => void
    isOnline: (memberId: string) => boolean
    getOnlineCount: () => number
    clear: () => void
}

export const usePresenceStore = create<PresenceState>()(
    subscribeWithSelector((set, get) => ({
        members: new Set<string>(),

        setMembers: (members) => set({members}),

        addMember: (memberId) =>
            set((state) => {
                const newMembers = new Set(state.members)
                newMembers.add(memberId)
                return {members: newMembers}
            }),

        removeMember: (memberId) =>
            set((state) => {
                const newMembers = new Set(state.members)
                newMembers.delete(memberId)
                return {members: newMembers}
            }),

        isOnline: (memberId) => get().members.has(memberId),

        getOnlineCount: () => get().members.size,

        clear: () => set({members: new Set<string>()}),
    }))
)

// Selector hooks for better performance
export const useOnlineMembers = () => usePresenceStore((state) => Array.from(state.members))
export const useOnlineCount = () => usePresenceStore((state) => state.members.size)
export const useIsUserOnline = (userId: string) =>
    usePresenceStore((state) => state.members.has(userId))