'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Bell, ChevronDown, Heart, LogOut, Menu, MessageCircle, Search, Settings, Shield, User, X,} from 'lucide-react';
import {cn} from '@/lib/utils';

interface NavbarProps {
    className?: string;
}

export function Navbar({className}: NavbarProps) {
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const notifications = [
        {id: '1', type: 'match', message: 'You have a new match!', time: '2m ago', unread: true},
        {id: '2', type: 'message', message: 'Alex sent you a message', time: '15m ago', unread: true},
        {id: '3', type: 'like', message: 'Jordan liked your profile', time: '1h ago', unread: false},
    ];

    const unreadCount = notifications.filter((n) => n.unread).length;

    return (
        <nav
            className={cn(
                'sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                className
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
                        <Heart className="h-5 w-5 text-white"/>
                    </div>
                    <span
                        className="hidden text-xl font-bold sm:block bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Find Your King
          </span>
                </Link>

                {/* Desktop Search */}
                <div className="hidden flex-1 px-8 md:block">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input
                            placeholder="Search people, events..."
                            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                            onClick={() => router.push('/discover')}
                        />
                    </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Mobile search toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        {isSearchOpen ? <X className="h-5 w-5"/> : <Search className="h-5 w-5"/>}
                    </Button>

                    {/* Messages */}
                    <Link href="/messages">
                        <Button variant="ghost" size="icon" className="relative">
                            <MessageCircle className="h-5 w-5"/>
                        </Button>
                    </Link>

                    {/* Notifications */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setIsNotificationsOpen(!isNotificationsOpen);
                                setIsProfileMenuOpen(false);
                            }}
                        >
                            <Bell className="h-5 w-5"/>
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
                            )}
                        </Button>

                        {isNotificationsOpen && (
                            <div
                                className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-popover p-2 shadow-lg">
                                <div className="flex items-center justify-between px-3 py-2">
                                    <h3 className="font-semibold">Notifications</h3>
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        Mark all read
                                    </Button>
                                </div>
                                <div className="mt-1 max-h-96 overflow-y-auto">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                'flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent',
                                                notification.unread && 'bg-primary/5'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'mt-0.5 h-2 w-2 rounded-full',
                                                    notification.unread ? 'bg-primary' : 'bg-transparent'
                                                )}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm">{notification.message}</p>
                                                <p className="text-xs text-muted-foreground">{notification.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 border-t border-border px-3 py-2">
                                    <Link href="/notifications" className="text-xs text-primary hover:underline">
                                        View all notifications
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile menu */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            className="hidden items-center gap-2 sm:flex"
                            onClick={() => {
                                setIsProfileMenuOpen(!isProfileMenuOpen);
                                setIsNotificationsOpen(false);
                            }}
                        >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600"/>
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        </Button>

                        {isProfileMenuOpen && (
                            <div
                                className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
                                <div className="px-3 py-2 border-b border-border mb-1">
                                    <p className="text-sm font-medium">Alex Johnson</p>
                                    <p className="text-xs text-muted-foreground">@alexjohnson</p>
                                </div>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <User className="h-4 w-4"/>
                                    My Profile
                                </Link>
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <Settings className="h-4 w-4"/>
                                    Settings
                                </Link>
                                <Link
                                    href="/safety"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <Shield className="h-4 w-4"/>
                                    Safety Center
                                </Link>
                                <div className="my-1 border-t border-border"/>
                                <button
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                                    onClick={() => setIsProfileMenuOpen(false)}
                                >
                                    <LogOut className="h-4 w-4"/>
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5"/>
                    </Button>
                </div>
            </div>

            {/* Mobile search expanded */}
            {isSearchOpen && (
                <div className="border-t border-border px-4 py-3 md:hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input placeholder="Search people, events..." className="pl-10" autoFocus/>
                    </div>
                </div>
            )}
        </nav>
    );
}
