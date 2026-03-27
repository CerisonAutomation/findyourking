'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Bell, Calendar, Heart, LogOut, MapPin, MessageCircle, Settings, User} from 'lucide-react'
import {usePresenceStore} from '@/hooks/usePresenceStore'
import {useRouter} from 'next/navigation'

interface HeaderProps {
    user?: {
        id: string
        username: string
        avatar_url?: string
        unread_messages?: number
        pending_matches?: number
    }
}

export default function Header({user}: HeaderProps) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [onlineUsers] = usePresenceStore()
    const router = useRouter()

    useEffect(() => {
        if (user) {
            loadUnreadCount()
        }
    }, [user])

    async function loadUnreadCount() {
        try {
            const response = await fetch('/api/messages?unread_only=true')
            if (response.ok) {
                const data = await response.json()
                setUnreadCount(data.conversations?.length || 0)
            }
        } catch (error) {
            console.error('Load unread count error:', error)
        }
    }

    async function handleSignOut() {
        try {
            const response = await fetch('/api/auth/sign-out', {
                method: 'POST'
            })
            if (response.ok) {
                router.push('/')
            }
        } catch (error) {
            console.error('Sign out error:', error)
        }
    }

    const navigation = [
        {name: 'Discover', href: '/discover', icon: Heart},
        {name: 'Events', href: '/events', icon: Calendar},
        {name: 'Messages', href: '/messages', icon: MessageCircle, badge: unreadCount},
        {name: 'Location', href: '/live-location', icon: MapPin},
    ]

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/discover" className="flex items-center space-x-2">
                            <div
                                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">👑</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Find Your King</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <item.icon className="h-4 w-4"/>
                                <span>{item.name}</span>
                                {item.badge && item.badge > 0 && (
                                    <Badge variant="destructive"
                                           className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                        {item.badge}
                                    </Badge>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5"/>
                            {user?.pending_matches && user.pending_matches > 0 && (
                                <Badge variant="destructive"
                                       className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                                    {user.pending_matches}
                                </Badge>
                            )}
                        </Button>

                        {/* User Profile */}
                        {user ? (
                            <div className="flex items-center space-x-3">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                    <p className="text-xs text-gray-500">
                                        {onlineUsers.includes(user.id) ? 'Online' : 'Offline'}
                                    </p>
                                </div>

                                <div className="relative group">
                                    <Avatar className="h-8 w-8 cursor-pointer">
                                        <AvatarImage src={user.avatar_url}/>
                                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>

                                    {/* Dropdown Menu */}
                                    <div
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <div className="py-1">
                                            <Link
                                                href="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <User className="h-4 w-4 mr-2"/>
                                                Profile
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <Settings className="h-4 w-4 mr-2"/>
                                                Settings
                                            </Link>
                                            <hr className="my-1"/>
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <LogOut className="h-4 w-4 mr-2"/>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link href="/auth">
                                    <Button variant="ghost">Sign In</Button>
                                </Link>
                                <Link href="/auth">
                                    <Button>Sign Up</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden border-t border-gray-200">
                <div className="px-4 py-2 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        >
                            <item.icon className="h-5 w-5"/>
                            <span>{item.name}</span>
                            {item.badge && item.badge > 0 && (
                                <Badge variant="destructive"
                                       className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {item.badge}
                                </Badge>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </header>
    )
}