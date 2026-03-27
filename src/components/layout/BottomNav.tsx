'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Badge} from '@/components/ui/badge'
import {Calendar, Heart, MapPin, MessageCircle, User} from 'lucide-react'

interface BottomNavProps {
    unreadCount?: number
    pendingMatches?: number
}

export default function BottomNav({unreadCount = 0, pendingMatches = 0}: BottomNavProps) {
    const pathname = usePathname()

    const navigation = [
        {name: 'Discover', href: '/discover', icon: Heart},
        {name: 'Events', href: '/events', icon: Calendar},
        {name: 'Messages', href: '/messages', icon: MessageCircle, badge: unreadCount},
        {name: 'Location', href: '/live-location', icon: MapPin},
        {name: 'Profile', href: '/profile', icon: User, badge: pendingMatches},
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                    ? 'text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5"/>
                                {item.badge && item.badge > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                                    >
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs">{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}