'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

interface AppShellProps {
    children: React.ReactNode
    requireAuth?: boolean
}

export default function AppShell({children, requireAuth = true}: AppShellProps) {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [pendingMatches, setPendingMatches] = useState(0)
    const router = useRouter()

    useEffect(() => {
        checkAuth()
    }, [requireAuth, router])

    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/session')
            if (response.ok) {
                const data = await response.json()
                if (data.session?.user) {
                    setUser(data.session.user)
                    await loadUserData(data.session.user.id)
                } else if (requireAuth) {
                    router.push('/auth')
                }
            } else if (requireAuth) {
                router.push('/auth')
            }
        } catch (error) {
            console.error('Auth check error:', error)
            if (requireAuth) {
                router.push('/auth')
            }
        } finally {
            setLoading(false)
        }
    }

    async function loadUserData(userId: string) {
        try {
            // Load user profile
            const profileResponse = await fetch('/api/profiles')
            if (profileResponse.ok) {
                const profileData = await profileResponse.json()
                setUser(prev => ({...prev, ...profileData.profile}))
            }

            // Load unread messages count
            const messagesResponse = await fetch('/api/messages?unread_only=true')
            if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json()
                setUnreadCount(messagesData.conversations?.length || 0)
            }

            // Load pending matches count
            const matchesResponse = await fetch('/api/matches?status=pending')
            if (matchesResponse.ok) {
                const matchesData = await matchesResponse.json()
                setPendingMatches(matchesData.matches?.length || 0)
            }
        } catch (error) {
            console.error('Load user data error:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user && requireAuth) {
        return null // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header user={user}/>

            <div className="flex">
                {/* Sidebar - Desktop */}
                <Sidebar
                    user={user}
                    isOpen={true}
                />

                {/* Main Content */}
                <main className="flex-1 md:ml-0 mb-16 md:mb-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Bottom Navigation - Mobile */}
            <BottomNav
                unreadCount={unreadCount}
                pendingMatches={pendingMatches}
            />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="md:hidden">
                    <Sidebar
                        user={user}
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                </div>
            )}
        </div>
    )
}