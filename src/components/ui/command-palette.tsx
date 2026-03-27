'use client'

import {useEffect, useRef, useState} from 'react'
import {Command} from 'cmdk'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent} from '@/components/ui/dialog'
import {
    Bell,
    Calendar,
    Camera,
    Filter,
    Heart,
    HelpCircle,
    LogOut,
    MapPin,
    MessageSquare,
    Plus,
    Search,
    Settings,
    Shield,
    Sparkles,
    User,
    Users,
    Zap
} from 'lucide-react'

interface CommandItem {
    id: string
    title: string
    description?: string
    icon: React.ComponentType<{ className?: string }>
    action: () => void
    category: 'navigation' | 'actions' | 'search' | 'settings'
    shortcut?: string[]
    badge?: string
}

interface CommandPaletteProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CommandPalette({open, onOpenChange}: CommandPaletteProps) {
    const [search, setSearch] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const commands: CommandItem[] = [
        // Navigation
        {
            id: 'nav-home',
            title: 'Home',
            description: 'Go to home page',
            icon: Heart,
            action: () => window.location.href = '/',
            category: 'navigation',
            shortcut: ['g', 'h']
        },
        {
            id: 'nav-matches',
            title: 'Matches',
            description: 'View your matches',
            icon: Users,
            action: () => window.location.href = '/matches',
            category: 'navigation',
            shortcut: ['g', 'm']
        },
        {
            id: 'nav-messages',
            title: 'Messages',
            description: 'View conversations',
            icon: MessageSquare,
            action: () => window.location.href = '/messages',
            category: 'navigation',
            shortcut: ['g', 'c']
        },
        {
            id: 'nav-events',
            title: 'Events',
            description: 'Browse events',
            icon: Calendar,
            action: () => window.location.href = '/events',
            category: 'navigation',
            shortcut: ['g', 'e']
        },
        {
            id: 'nav-discover',
            title: 'Discover',
            description: 'Discover new people',
            icon: MapPin,
            action: () => window.location.href = '/discover',
            category: 'navigation',
            shortcut: ['g', 'd']
        },
        {
            id: 'nav-profile',
            title: 'Profile',
            description: 'Edit your profile',
            icon: User,
            action: () => window.location.href = '/profile',
            category: 'navigation',
            shortcut: ['g', 'p']
        },

        // Actions
        {
            id: 'action-new-match',
            title: 'Find New Matches',
            description: 'Start matching with people nearby',
            icon: Zap,
            action: () => window.location.href = '/discover',
            category: 'actions',
            badge: 'Popular'
        },
        {
            id: 'action-upload-photo',
            title: 'Upload Photo',
            description: 'Add a new photo to your profile',
            icon: Camera,
            action: () => window.location.href = '/profile/photos',
            category: 'actions'
        },
        {
            id: 'action-create-event',
            title: 'Create Event',
            description: 'Host a new event',
            icon: Plus,
            action: () => window.location.href = '/events/create',
            category: 'actions'
        },
        {
            id: 'action-ai-coach',
            title: 'AI Dating Coach',
            description: 'Get personalized dating advice',
            icon: Sparkles,
            action: () => window.location.href = '/ai-coach',
            category: 'actions',
            badge: 'AI'
        },

        // Search
        {
            id: 'search-people',
            title: 'Search People',
            description: 'Find users by name or interests',
            icon: Search,
            action: () => window.location.href = '/search/people',
            category: 'search'
        },
        {
            id: 'search-events',
            title: 'Search Events',
            description: 'Find events in your area',
            icon: Search,
            action: () => window.location.href = '/search/events',
            category: 'search'
        },
        {
            id: 'search-filters',
            title: 'Advanced Filters',
            description: 'Refine your search criteria',
            icon: Filter,
            action: () => window.location.href = '/search/filters',
            category: 'search'
        },

        // Settings
        {
            id: 'settings-preferences',
            title: 'Preferences',
            description: 'Manage your dating preferences',
            icon: Settings,
            action: () => window.location.href = '/settings/preferences',
            category: 'settings'
        },
        {
            id: 'settings-notifications',
            title: 'Notifications',
            description: 'Manage notification settings',
            icon: Bell,
            action: () => window.location.href = '/settings/notifications',
            category: 'settings'
        },
        {
            id: 'settings-privacy',
            title: 'Privacy & Security',
            description: 'Manage privacy and security settings',
            icon: Shield,
            action: () => window.location.href = '/settings/privacy',
            category: 'settings'
        },
        {
            id: 'settings-help',
            title: 'Help & Support',
            description: 'Get help and contact support',
            icon: HelpCircle,
            action: () => window.location.href = '/help',
            category: 'settings'
        },
        {
            id: 'settings-logout',
            title: 'Logout',
            description: 'Sign out of your account',
            icon: LogOut,
            action: () => {
                // Implement logout logic
                window.location.href = '/auth/logout'
            },
            category: 'settings'
        }
    ]

    const filteredCommands = commands.filter(command =>
        command.title.toLowerCase().includes(search.toLowerCase()) ||
        command.description?.toLowerCase().includes(search.toLowerCase())
    )

    const categories = [
        {id: 'navigation', title: 'Navigation', icon: Heart},
        {id: 'actions', title: 'Actions', icon: Zap},
        {id: 'search', title: 'Search', icon: Search},
        {id: 'settings', title: 'Settings', icon: Settings}
    ]

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0)
        }
    }, [open])

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onOpenChange(!open)
        }
        if (e.key === 'Escape') {
            onOpenChange(false)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open])

    const executeCommand = (command: CommandItem) => {
        command.action()
        onOpenChange(false)
        setSearch('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 overflow-hidden max-w-2xl">
                <Command className="rounded-lg border-0 shadow-md">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50"/>
                        <Command.Input
                            ref={inputRef}
                            placeholder="Type a command or search..."
                            value={search}
                            onValueChange={setSearch}
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div className="ml-2 flex items-center gap-1">
                            <kbd
                                className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>
                    <Command.List className="max-h-[450px] overflow-y-auto p-2">
                        {!search && (
                            <div className="mb-2">
                                {categories.map((category) => {
                                    const categoryCommands = filteredCommands.filter(
                                        cmd => cmd.category === category.id
                                    )
                                    if (categoryCommands.length === 0) return null

                                    return (
                                        <div key={category.id} className="mb-4">
                                            <div className="flex items-center gap-2 px-2 py-1">
                                                <category.icon className="h-4 w-4 text-muted-foreground"/>
                                                <Command.Empty className="text-sm font-medium text-muted-foreground">
                                                    {category.title}
                                                </Command.Empty>
                                            </div>
                                            <div className="space-y-1">
                                                {categoryCommands.map((command) => (
                                                    <Command.Item
                                                        key={command.id}
                                                        onSelect={() => executeCommand(command)}
                                                        className="flex items-center gap-2 rounded-sm px-2 py-2 hover:bg-accent cursor-pointer"
                                                    >
                                                        <command.icon className="h-4 w-4 text-muted-foreground"/>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="text-sm font-medium">{command.title}</span>
                                                                {command.badge && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {command.badge}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {command.description && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {command.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {command.shortcut && (
                                                            <div className="flex gap-1">
                                                                {command.shortcut.map((key, index) => (
                                                                    <kbd
                                                                        key={index}
                                                                        className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
                                                                    >
                                                                        {key}
                                                                    </kbd>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </Command.Item>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {search && (
                            <div className="space-y-1">
                                {filteredCommands.length === 0 ? (
                                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                                        No commands found.
                                    </Command.Empty>
                                ) : (
                                    filteredCommands.map((command) => (
                                        <Command.Item
                                            key={command.id}
                                            onSelect={() => executeCommand(command)}
                                            className="flex items-center gap-2 rounded-sm px-2 py-2 hover:bg-accent cursor-pointer"
                                        >
                                            <command.icon className="h-4 w-4 text-muted-foreground"/>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{command.title}</span>
                                                    {command.badge && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {command.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {command.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {command.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Command.Item>
                                    ))
                                )}
                            </div>
                        )}
                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
