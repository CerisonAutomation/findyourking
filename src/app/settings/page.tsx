'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Switch} from '@/components/ui/switch'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Badge} from '@/components/ui/badge'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Separator} from '@/components/ui/separator'
import {AlertTriangle, Bell, Download, Key, Lock, Palette, Shield, Trash2, User} from 'lucide-react'
import {useForm, SubmitHandler} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import type {ProfilePrivacyInput} from '@/validations/profile'
import {profilePrivacySchema} from '@/validations/profile'

interface UserSettings {
    email: string
    username: string
    privacy: ProfilePrivacyInput
    notifications: {
        email_notifications: boolean
        push_notifications: boolean
        message_notifications: boolean
        match_notifications: boolean
        event_notifications: boolean
    }
    appearance: {
        theme: 'light' | 'dark' | 'system'
        language: string
    }
    blockedUsers: Array<{
        id: string
        username: string
        blocked_at: string
    }>
    reports: Array<{
        id: string
        type: string
        status: string
        created_at: string
    }>
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const privacyForm = useForm<ProfilePrivacyInput>({
        resolver: zodResolver(profilePrivacySchema),
    })

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        setLoading(true)
        try {
            const response = await fetch('/api/settings')
            if (!response.ok) throw new Error('Failed to load settings')

            const data = await response.json()
            setSettings(data.settings)

            // Populate privacy form
            if (data.settings.privacy) {
                privacyForm.reset(data.settings.privacy)
            }
        } catch (error) {
            console.error('Load settings error:', error)
            showMessage('error', 'Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdatePrivacy(data: ProfilePrivacyInput) {
        setSaving(true)
        try {
            const response = await fetch('/api/settings/privacy', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            })

            if (!response.ok) throw new Error('Failed to update privacy settings')

            const result = await response.json()
            setSettings(prev => prev ? {...prev, privacy: result.privacy} : null)
            showMessage('success', 'Privacy settings updated')
        } catch (error) {
            console.error('Update privacy error:', error)
            showMessage('error', 'Failed to update privacy settings')
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdateNotifications(notifications: UserSettings['notifications']) {
        setSaving(true)
        try {
            const response = await fetch('/api/settings/notifications', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(notifications),
            })

            if (!response.ok) throw new Error('Failed to update notification settings')

            const result = await response.json()
            setSettings(prev => prev ? {...prev, notifications: result.notifications} : null)
            showMessage('success', 'Notification settings updated')
        } catch (error) {
            console.error('Update notifications error:', error)
            showMessage('error', 'Failed to update notification settings')
        } finally {
            setSaving(false)
        }
    }

    async function handleChangePassword(data: { current_password: string; new_password: string }) {
        setSaving(true)
        try {
            const response = await fetch('/api/settings/password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to change password')
            }

            showMessage('success', 'Password changed successfully')
        } catch (error) {
            console.error('Change password error:', error)
            showMessage('error', error instanceof Error ? error.message : 'Failed to change password')
        } finally {
            setSaving(false)
        }
    }

    async function handleExportData() {
        setSaving(true)
        try {
            const response = await fetch('/api/settings/export')
            if (!response.ok) throw new Error('Failed to export data')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `zenith-data-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            showMessage('success', 'Data exported successfully')
        } catch (error) {
            console.error('Export data error:', error)
            showMessage('error', 'Failed to export data')
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/settings/account', {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to delete account')

            // Redirect to home after deletion
            window.location.href = '/'
        } catch (error) {
            console.error('Delete account error:', error)
            showMessage('error', 'Failed to delete account')
            setSaving(false)
        }
    }

    function showMessage(type: 'success' | 'error', text: string) {
        setMessage({type, text})
        setTimeout(() => setMessage(null), 5000)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-semibold">Settings</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                {/* Message Alert */}
                {message && (
                    <Alert className={`mb-6 ${
                        message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                        <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="privacy">Privacy</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="safety">Safety</TabsTrigger>
                        <TabsTrigger value="data">Data</TabsTrigger>
                    </TabsList>

                    <TabsContent value="account" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5"/>
                                    Account Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Email</Label>
                                    <Input value={settings?.email || ''} disabled/>
                                </div>
                                <div>
                                    <Label>Username</Label>
                                    <Input value={settings?.username || ''} disabled/>
                                </div>
                                <ChangePasswordForm onSubmit={handleChangePassword} loading={saving}/>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5"/>
                                    Privacy Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={privacyForm.handleSubmit(handleUpdatePrivacy)} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="show_online_status">Show Online Status</Label>
                                            <p className="text-sm text-gray-600">Let others see when you are online</p>
                                        </div>
                                        <Switch
                                            id="show_online_status"
                                            {...privacyForm.register('show_online_status')}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="show_distance">Show Distance</Label>
                                            <p className="text-sm text-gray-600">Display distance to other users</p>
                                        </div>
                                        <Switch
                                            id="show_distance"
                                            {...privacyForm.register('show_distance')}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="show_age">Show Age</Label>
                                            <p className="text-sm text-gray-600">Display your age to others</p>
                                        </div>
                                        <Switch
                                            id="show_age"
                                            {...privacyForm.register('show_age')}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="allow_messages_from">Allow Messages From</Label>
                                        <Select
                                            {...privacyForm.register('allow_messages_from')}
                                            onValueChange={(value) => privacyForm.setValue('allow_messages_from', value as 'everyone' | 'matches_only' | 'nobody')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="everyone">Everyone</SelectItem>
                                                <SelectItem value="matches_only">Matches Only</SelectItem>
                                                <SelectItem value="nobody">Nobody</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Privacy Settings'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5"/>
                                    Notification Preferences
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {settings && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Email Notifications</Label>
                                                <p className="text-sm text-gray-600">Receive notifications via email</p>
                                            </div>
                                            <Switch
                                                checked={settings.notifications.email_notifications}
                                                onCheckedChange={(checked) =>
                                                    handleUpdateNotifications({
                                                        ...settings.notifications,
                                                        email_notifications: checked,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Push Notifications</Label>
                                                <p className="text-sm text-gray-600">Receive push notifications</p>
                                            </div>
                                            <Switch
                                                checked={settings.notifications.push_notifications}
                                                onCheckedChange={(checked) =>
                                                    handleUpdateNotifications({
                                                        ...settings.notifications,
                                                        push_notifications: checked,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Message Notifications</Label>
                                                <p className="text-sm text-gray-600">Notify when you receive
                                                    messages</p>
                                            </div>
                                            <Switch
                                                checked={settings.notifications.message_notifications}
                                                onCheckedChange={(checked) =>
                                                    handleUpdateNotifications({
                                                        ...settings.notifications,
                                                        message_notifications: checked,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Match Notifications</Label>
                                                <p className="text-sm text-gray-600">Notify about new matches</p>
                                            </div>
                                            <Switch
                                                checked={settings.notifications.match_notifications}
                                                onCheckedChange={(checked) =>
                                                    handleUpdateNotifications({
                                                        ...settings.notifications,
                                                        match_notifications: checked,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Event Notifications</Label>
                                                <p className="text-sm text-gray-600">Notify about events and
                                                    reminders</p>
                                            </div>
                                            <Switch
                                                checked={settings.notifications.event_notifications}
                                                onCheckedChange={(checked) =>
                                                    handleUpdateNotifications({
                                                        ...settings.notifications,
                                                        event_notifications: checked,
                                                    })
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5"/>
                                    Appearance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {settings && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Theme</Label>
                                            <Select
                                                value={settings.appearance.theme}
                                                onValueChange={(value: 'light' | 'dark' | 'system') =>
                                                    // In a real app, this would update the theme
                                                    console.log('Theme changed to:', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="light">Light</SelectItem>
                                                    <SelectItem value="dark">Dark</SelectItem>
                                                    <SelectItem value="system">System</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Language</Label>
                                            <Select
                                                value={settings.appearance.language}
                                                onValueChange={(value) =>
                                                    // In a real app, this would update the language
                                                    console.log('Language changed to:', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="es">Español</SelectItem>
                                                    <SelectItem value="fr">Français</SelectItem>
                                                    <SelectItem value="de">Deutsch</SelectItem>
                                                    <SelectItem value="it">Italiano</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="safety" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5"/>
                                    Safety & Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-medium mb-3">Blocked Users</h3>
                                    {settings?.blockedUsers.length === 0 ? (
                                        <p className="text-gray-500">No blocked users</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {settings?.blockedUsers.map((user) => (
                                                <div key={user.id}
                                                     className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{user.username}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Blocked {new Date(user.blocked_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" size="sm">
                                                        Unblock
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-medium mb-3">Report History</h3>
                                    {settings?.reports.length === 0 ? (
                                        <p className="text-gray-500">No reports submitted</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {settings?.reports.map((report) => (
                                                <div key={report.id}
                                                     className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium capitalize">{report.type}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(report.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant={report.status === 'resolved' ? 'default' : 'secondary'}>
                                                        {report.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <Button variant="outline" className="w-full">
                                        <AlertTriangle className="h-4 w-4 mr-2"/>
                                        Report a User
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="data" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="h-5 w-5"/>
                                    Data Management
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-medium mb-2">Export Your Data</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Download a copy of all your data including profile, messages, and activity.
                                    </p>
                                    <Button onClick={handleExportData} disabled={saving}>
                                        <Download className="h-4 w-4 mr-2"/>
                                        {saving ? 'Exporting...' : 'Export Data'}
                                    </Button>
                                </div>

                                <Separator/>

                                <div>
                                    <h3 className="font-medium mb-2 text-red-600">Delete Account</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Permanently delete your account and all associated data. This action cannot be
                                        undone.
                                    </p>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={saving}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2"/>
                                        {saving ? 'Deleting...' : 'Delete Account'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function ChangePasswordForm({
                                onSubmit,
                                loading
                            }: {
    onSubmit: (data: { current_password: string; new_password: string }) => void
    loading: boolean
}) {
    const {register, handleSubmit, formState: {errors}, watch} = useForm<{current_password: string; new_password: string; confirm_password: string}>()

    const newPassword = watch('new_password')

    const handleFormSubmit: SubmitHandler<{current_password: string; new_password: string; confirm_password: string}> = (data) => {
        onSubmit({
            current_password: data.current_password,
            new_password: data.new_password
        })
    }

    return (
        <div className="space-y-4">
            <h3 className="font-medium">Change Password</h3>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div>
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                        id="current_password"
                        type="password"
                        {...register('current_password', {required: 'Current password is required'})}
                    />
                    {errors.current_password && (
                        <p className="text-sm text-red-600 mt-1">{errors.current_password.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                        id="new_password"
                        type="password"
                        {...register('new_password', {
                            required: 'New password is required',
                            minLength: {value: 6, message: 'Password must be at least 6 characters'}
                        })}
                    />
                    {errors.new_password && (
                        <p className="text-sm text-red-600 mt-1">{errors.new_password.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                        id="confirm_password"
                        type="password"
                        {...register('confirm_password', {
                            required: 'Please confirm your password',
                            validate: value => value === newPassword || 'Passwords do not match'
                        })}
                    />
                    {errors.confirm_password && (
                        <p className="text-sm text-red-600 mt-1">{errors.confirm_password.message}</p>
                    )}
                </div>

                <Button type="submit" disabled={loading}>
                    <Key className="h-4 w-4 mr-2"/>
                    {loading ? 'Changing...' : 'Change Password'}
                </Button>
            </form>
        </div>
    )
}
