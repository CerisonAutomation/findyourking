'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Activity, Ban, Check, Eye, Flag, MessageSquare, Search, Settings, Shield, Users, X} from 'lucide-react'
import {Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

interface DashboardStats {
    total_users: number
    active_users_today: number
    new_users_today: number
    total_messages: number
    total_events: number
    flagged_users: number
    pending_reports: number
    system_health: 'good' | 'warning' | 'error'
}

interface User {
    id: string
    username: string
    email: string
    created_at: string
    last_active?: string
    verified: boolean
    banned: boolean
    reports_count: number
    messages_count: number
    events_attended: number
}

interface Report {
    id: string
    type: 'user' | 'message' | 'event'
    reason: string
    description: string
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
    created_at: string
    reporter: {
        username: string
    }
    reported_user?: {
        username: string
    }
    priority: 'low' | 'medium' | 'high'
}

interface AnalyticsData {
    signups: Array<{ date: string; count: number }>
    messages: Array<{ date: string; count: number }>
    events: Array<{ date: string; count: number }>
    featureUsage: Array<{ feature: string; usage: number }>
}

export default function AdminPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [reports, setReports] = useState<Report[]>([])
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [userFilter, setUserFilter] = useState<'all' | 'banned' | 'verified' | 'unverified'>('all')
    const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved'>('pending')

    useEffect(() => {
        loadDashboardData()
    }, [])

    async function loadDashboardData() {
        setLoading(true)
        try {
            // Load all admin data in parallel
            const [statsRes, usersRes, reportsRes, analyticsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/users'),
                fetch('/api/admin/reports'),
                fetch('/api/admin/analytics'),
            ])

            if (!statsRes.ok || !usersRes.ok || !reportsRes.ok || !analyticsRes.ok) {
                throw new Error('Failed to load admin data')
            }

            const [statsData, usersData, reportsData, analyticsData] = await Promise.all([
                statsRes.json(),
                usersRes.json(),
                reportsRes.json(),
                analyticsRes.json(),
            ])

            setStats(statsData.stats)
            setUsers(usersData.users || [])
            setReports(reportsData.reports || [])
            setAnalytics(analyticsData.analytics)
        } catch (error) {
            console.error('Load admin data error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleBanUser(userId: string) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'POST',
            })

            if (!response.ok) throw new Error('Failed to ban user')

            // Refresh users list
            const usersRes = await fetch('/api/admin/users')
            if (usersRes.ok) {
                const usersData = await usersRes.json()
                setUsers(usersData.users || [])
            }
        } catch (error) {
            console.error('Ban user error:', error)
        }
    }

    async function handleUnbanUser(userId: string) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/unban`, {
                method: 'POST',
            })

            if (!response.ok) throw new Error('Failed to unban user')

            // Refresh users list
            const usersRes = await fetch('/api/admin/users')
            if (usersRes.ok) {
                const usersData = await usersRes.json()
                setUsers(usersData.users || [])
            }
        } catch (error) {
            console.error('Unban user error:', error)
        }
    }

    async function handleVerifyUser(userId: string) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/verify`, {
                method: 'POST',
            })

            if (!response.ok) throw new Error('Failed to verify user')

            // Refresh users list
            const usersRes = await fetch('/api/admin/users')
            if (usersRes.ok) {
                const usersData = await usersRes.json()
                setUsers(usersData.users || [])
            }
        } catch (error) {
            console.error('Verify user error:', error)
        }
    }

    async function handleResolveReport(reportId: string, action: 'resolve' | 'dismiss') {
        try {
            const response = await fetch(`/api/admin/reports/${reportId}/${action}`, {
                method: 'POST',
            })

            if (!response.ok) throw new Error(`Failed to ${action} report`)

            // Refresh reports list
            const reportsRes = await fetch('/api/admin/reports')
            if (reportsRes.ok) {
                const reportsData = await reportsRes.json()
                setReports(reportsData.reports || [])
            }
        } catch (error) {
            console.error('Resolve report error:', error)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter =
            userFilter === 'all' ||
            (userFilter === 'banned' && user.banned) ||
            (userFilter === 'verified' && user.verified) ||
            (userFilter === 'unverified' && !user.verified)

        return matchesSearch && matchesFilter
    })

    const filteredReports = reports.filter(report =>
        reportFilter === 'all' || report.status === reportFilter
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                        <Badge variant={stats?.system_health === 'good' ? 'default' :
                            stats?.system_health === 'warning' ? 'secondary' : 'destructive'}>
                            <Activity className="h-3 w-3 mr-1"/>
                            {stats?.system_health}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="system">System</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Users"
                                value={stats?.total_users || 0}
                                icon={<Users className="h-5 w-5"/>}
                                trend={stats?.new_users_today || 0}
                                trendLabel="new today"
                            />
                            <StatCard
                                title="Active Today"
                                value={stats?.active_users_today || 0}
                                icon={<Activity className="h-5 w-5"/>}
                                trend={null}
                                trendLabel=""
                            />
                            <StatCard
                                title="Total Messages"
                                value={stats?.total_messages || 0}
                                icon={<MessageSquare className="h-5 w-5"/>}
                                trend={null}
                                trendLabel=""
                            />
                            <StatCard
                                title="Pending Reports"
                                value={stats?.pending_reports || 0}
                                icon={<Flag className="h-5 w-5"/>}
                                trend={stats?.flagged_users || 0}
                                trendLabel="flagged users"
                                variant="warning"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5"/>
                                        Recent Users
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {users.slice(0, 5).map((user) => (
                                            <div key={user.id} className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{user.username}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {user.verified &&
                                                    <Badge variant="default" className="text-xs">✓</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Flag className="h-5 w-5"/>
                                        Recent Reports
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {reports.slice(0, 5).map((report) => (
                                            <div key={report.id} className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    report.priority === 'high' ? 'bg-red-500' :
                                                        report.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}/>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate capitalize">{report.type}</p>
                                                    <p className="text-sm text-gray-600">{report.reason}</p>
                                                </div>
                                                <Badge
                                                    variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                                                    {report.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5"/>
                                        System Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span>Database</span>
                                        <Badge variant="default">Healthy</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>API Response</span>
                                        <Badge variant="default">Normal</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Storage</span>
                                        <Badge variant="default">78%</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>CDN</span>
                                        <Badge variant="default">Active</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>User Management</CardTitle>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Search
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                            <Input
                                                placeholder="Search users..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 w-64"
                                            />
                                        </div>
                                        <Select value={userFilter} onValueChange={(value: any) => setUserFilter(value)}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="verified">Verified</SelectItem>
                                                <SelectItem value="unverified">Unverified</SelectItem>
                                                <SelectItem value="banned">Banned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead>Last Active</TableHead>
                                            <TableHead>Reports</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{user.username}</p>
                                                            <p className="text-sm text-gray-600">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {user.verified &&
                                                            <Badge variant="default" className="text-xs">✓</Badge>}
                                                        {user.banned && <Badge variant="destructive"
                                                                               className="text-xs">Banned</Badge>}
                                                        {!user.verified && !user.banned && (
                                                            <Badge variant="secondary"
                                                                   className="text-xs">Unverified</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {user.last_active
                                                        ? new Date(user.last_active).toLocaleDateString()
                                                        : 'Never'
                                                    }
                                                </TableCell>
                                                <TableCell>{user.reports_count}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {!user.verified && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleVerifyUser(user.id)}
                                                            >
                                                                <Check className="h-3 w-3"/>
                                                            </Button>
                                                        )}
                                                        {user.banned ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleUnbanUser(user.id)}
                                                            >
                                                                <Shield className="h-3 w-3"/>
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleBanUser(user.id)}
                                                            >
                                                                <Ban className="h-3 w-3"/>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Report Management</CardTitle>
                                    <Select value={reportFilter} onValueChange={(value: any) => setReportFilter(value)}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="reviewing">Reviewing</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredReports.map((report) => (
                                        <Card key={report.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="outline" className="capitalize">
                                                                {report.type}
                                                            </Badge>
                                                            <Badge variant={
                                                                report.priority === 'high' ? 'destructive' :
                                                                    report.priority === 'medium' ? 'secondary' : 'default'
                                                            }>
                                                                {report.priority}
                                                            </Badge>
                                                            <Badge variant={
                                                                report.status === 'pending' ? 'destructive' :
                                                                    report.status === 'reviewing' ? 'secondary' : 'default'
                                                            }>
                                                                {report.status}
                                                            </Badge>
                                                        </div>

                                                        <h4 className="font-medium mb-1">{report.reason}</h4>
                                                        <p className="text-gray-600 text-sm mb-2">{report.description}</p>

                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <span>Reported by {report.reporter.username}</span>
                                                            {report.reported_user && (
                                                                <span>Against {report.reported_user.username}</span>
                                                            )}
                                                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 ml-4">
                                                        {report.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleResolveReport(report.id, 'dismiss')}
                                                                >
                                                                    <X className="h-3 w-3"/>
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleResolveReport(report.id, 'resolve')}
                                                                >
                                                                    <Check className="h-3 w-3"/>
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" variant="outline">
                                                                    <Eye className="h-3 w-3"/>
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Report Details</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <h4 className="font-medium">Type</h4>
                                                                        <p className="text-gray-600 capitalize">{report.type}</p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-medium">Reason</h4>
                                                                        <p className="text-gray-600">{report.reason}</p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-medium">Description</h4>
                                                                        <p className="text-gray-600">{report.description}</p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-medium">Reporter</h4>
                                                                        <p className="text-gray-600">{report.reporter.username}</p>
                                                                    </div>
                                                                    {report.reported_user && (
                                                                        <div>
                                                                            <h4 className="font-medium">Reported
                                                                                User</h4>
                                                                            <p className="text-gray-600">{report.reported_user.username}</p>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <h4 className="font-medium">Priority</h4>
                                                                        <Badge variant={
                                                                            report.priority === 'high' ? 'destructive' :
                                                                                report.priority === 'medium' ? 'secondary' : 'default'
                                                                        }>
                                                                            {report.priority}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>User Signups</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={analytics?.signups || []}>
                                            <CartesianGrid strokeDasharray="3 3"/>
                                            <XAxis dataKey="date"/>
                                            <YAxis/>
                                            <Tooltip/>
                                            <Line type="monotone" dataKey="count" stroke="#8884d8"/>
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Messages Sent</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={analytics?.messages || []}>
                                            <CartesianGrid strokeDasharray="3 3"/>
                                            <XAxis dataKey="date"/>
                                            <YAxis/>
                                            <Tooltip/>
                                            <Line type="monotone" dataKey="count" stroke="#82ca9d"/>
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Events Created</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={analytics?.events || []}>
                                            <CartesianGrid strokeDasharray="3 3"/>
                                            <XAxis dataKey="date"/>
                                            <YAxis/>
                                            <Tooltip/>
                                            <Bar dataKey="count" fill="#ffc658"/>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Feature Usage</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={analytics?.featureUsage || []}>
                                            <CartesianGrid strokeDasharray="3 3"/>
                                            <XAxis dataKey="feature"/>
                                            <YAxis/>
                                            <Tooltip/>
                                            <Bar dataKey="usage" fill="#8884d8"/>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="system" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Health</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span>Database Connection</span>
                                        <Badge variant="default">Healthy</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Redis Cache</span>
                                        <Badge variant="default">Connected</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>File Storage</span>
                                        <Badge variant="default">Operational</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Email Service</span>
                                        <Badge variant="default">Working</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>P2P Signaling</span>
                                        <Badge variant="secondary">Degraded</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span>Avg Response Time</span>
                                        <span className="font-medium">142ms</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>API Success Rate</span>
                                        <span className="font-medium">99.7%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Database Query Time</span>
                                        <span className="font-medium">23ms</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Cache Hit Rate</span>
                                        <span className="font-medium">87%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Memory Usage</span>
                                        <span className="font-medium">64%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function StatCard({
                      title,
                      value,
                      icon,
                      trend,
                      trendLabel,
                      variant = 'default'
                  }: {
    title: string
    value: number
    icon: React.ReactNode
    trend: number | null
    trendLabel: string
    variant?: 'default' | 'warning' | 'error'
}) {
    return (
        <Card className={variant === 'warning' ? 'border-yellow-200' : variant === 'error' ? 'border-red-200' : ''}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                        {trend !== null && (
                            <p className="text-sm text-gray-600 mt-1">
                                {trend > 0 ? '+' : ''}{trend} {trendLabel}
                            </p>
                        )}
                    </div>
                    <div className={`p-3 rounded-full ${
                        variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            variant === 'error' ? 'bg-red-100 text-red-600' :
                                'bg-blue-100 text-blue-600'
                    }`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}