'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {Calendar, Heart, LogOut, MapPin, Menu, MessageCircle, Settings, Shield, User, X} from 'lucide-react'
import {usePresenceStore} from '@/hooks/usePresenceStore'

interface SidebarProps {
    user?: {
        id: string
        username: string
        avatar_url?: string
        role?: string
    }
    isOpen?: boolean
    onClose?: () => void
}

export default function Sidebar({user, isOpen = true, onClose}: SidebarProps) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [collapsed, setCollapsed] = useState(false)
    const [onlineUsers] = usePresenceStore()
    const pathname = usePathname()
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

    const mainNavigation = [
        {name: 'Discover', href: '/discover', icon: Heart},
        {name: 'Events', href: '/events', icon: Calendar},
        {name: 'Messages', href: '/messages', icon: MessageCircle, badge: unreadCount},
        {name: 'Live Location', href: '/live-location', icon: MapPin},
    ]

    const secondaryNavigation = [
        {name: 'Profile', href: '/profile', icon: User},
        {name: 'Settings', href: '/settings', icon: Settings},
    ]

    const adminNavigation = user?.role === 'admin' ? [
        {name: 'Admin Dashboard', href: '/admin', icon: Shield},
    ] : []

    if (!isOpen) {
        return null
    }

    return (
        <div className="hidden md:flex">
            {/* Sidebar */}
            <div className={`${
                collapsed ? 'w-16' : 'w-64'
            } bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ease-in-out`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            {!collapsed && (
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">👑</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">Find Your King</span>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(!collapsed)}
                            >
                                {collapsed ? <Menu className="h-4 w-4"/> : <X className="h-4 w-4"/>}
                            </Button>
                        </div>
                    </div>

                    {/* User Profile */}
                    {user && !collapsed && (
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar_url}/>
                                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                                    <p className="text-xs text-gray-500">
                                        {onlineUsers.includes(user.id) ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="space-y-2 px-2">
                            {/* Main Navigation */}
                            <div className="space-y-1">
                                {mainNavigation.map((item) => {
                                    const isActive = pathname === item.href
                                    const Icon = item.icon

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                                                isActive
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <div className="relative">
                                                <Icon className="h-5 w-5"/>
                                                {item.badge && item.badge > 0 && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                                                    >
                                                        {item.badge > 99 ? '99+' : item.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                            {!collapsed && <span className="text-sm">{item.name}</span>}
                                        </Link>
                                    )
                                })}
                            </div>

                            {/* Secondary Navigation */}
                            {!collapsed && (
                                <>
                                    <Separator className="my-4"/>
                                    <div className="space-y-1">
                                        {secondaryNavigation.map((item) => {
                                            const isActive = pathname === item.href
                                            const Icon = item.icon

                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                                                        isActive
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <Icon className="h-5 w-5"/>
                                                    <span className="text-sm">{item.name}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Admin Navigation */}
                            {adminNavigation.length > 0 && !collapsed && (
                                <>
                                    <Separator className="my-4"/>
                                    <div className="space-y-1">
                                        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Admin
                                        </p>
                                        {adminNavigation.map((item) => {
                                            const isActive = pathname === item.href
                                            const Icon = item.icon

                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                                                        isActive
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <Icon className="h-5 w-5"/>
                                                    <span className="text-sm">{item.name}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    {!collapsed && user && (
                        <div className="p-4 border-t border-gray-200">
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={handleSignOut}
                            >
                                <LogOut className="h-4 w-4 mr-2"/>
                                Sign Out
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Overlay */}
            {onClose && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}
        </div>
    )
}