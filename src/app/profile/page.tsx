'use client'

import {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from '@/components/ui/sheet'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Camera, Check, Edit, Heart, MapPin, Users, X} from 'lucide-react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import type {ProfilePrivacyInput, ProfileUpdateInput} from '@/validations/profile'
import {profilePrivacySchema, profileUpdateSchema} from '@/validations/profile'

interface Profile {
    id: string
    username: string
    bio?: string
    birth_date?: string
    location?: string
    interests: string[]
    avatar_url?: string
    languages: string[]
    verified: boolean
    created_at: string
    last_active?: string
    privacy?: {
        show_online_status: boolean
        show_distance: boolean
        show_age: boolean
        allow_messages_from: 'everyone' | 'matches_only' | 'nobody'
    }
    stats?: {
        likes_received: number
        matches_count: number
        events_attended: number
        profile_views: number
    }
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [newInterest, setNewInterest] = useState('')

    const updateForm = useForm<ProfileUpdateInput>({
        resolver: zodResolver(profileUpdateSchema),
    })

    const privacyForm = useForm<ProfilePrivacyInput>({
        resolver: zodResolver(profilePrivacySchema),
    })

    useEffect(() => {
        loadProfile()
    }, [])

    async function loadProfile() {
        setLoading(true)
        try {
            const response = await fetch('/api/profiles')
            if (!response.ok) {
                if (response.status === 404) {
                    // Profile doesn't exist, show create form
                    setEditMode(true)
                    setLoading(false)
                    return
                }
                throw new Error('Failed to load profile')
            }

            const data = await response.json()
            setProfile(data.profile)

            // Populate forms with existing data
            if (data.profile) {
                updateForm.reset({
                    username: data.profile.username,
                    bio: data.profile.bio || '',
                    location: data.profile.location || '',
                    interests: data.profile.interests || [],
                    languages: data.profile.languages || [],
                })

                if (data.profile.privacy) {
                    privacyForm.reset(data.profile.privacy)
                }
            }
        } catch (error) {
            console.error('Load profile error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateProfile(data: ProfileUpdateInput) {
        try {
            const response = await fetch('/api/profiles', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            })

            if (!response.ok) throw new Error('Failed to update profile')

            const result = await response.json()
            setProfile(result.profile)
            setEditMode(false)
        } catch (error) {
            console.error('Update profile error:', error)
        }
    }

    async function handleUpdatePrivacy(data: ProfilePrivacyInput) {
        try {
            const response = await fetch('/api/profiles/privacy', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            })

            if (!response.ok) throw new Error('Failed to update privacy')

            const result = await response.json()
            setProfile(prev => prev ? {...prev, privacy: result.privacy} : null)
        } catch (error) {
            console.error('Update privacy error:', error)
        }
    }

    async function handlePhotoUpload(file: File) {
        setUploadingPhoto(true)
        try {
            const formData = new FormData()
            formData.append('photo', file)

            const response = await fetch('/api/profiles/photo', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Failed to upload photo')

            const result = await response.json()
            setProfile(prev => prev ? {...prev, avatar_url: result.avatar_url} : null)
        } catch (error) {
            console.error('Photo upload error:', error)
        } finally {
            setUploadingPhoto(false)
        }
    }

    function addInterest() {
        if (newInterest.trim() && profile) {
            const interests = [...(profile.interests || []), newInterest.trim()]
            updateForm.setValue('interests', interests)
            setProfile(prev => prev ? {...prev, interests} : null)
            setNewInterest('')
        }
    }

    function removeInterest(interestToRemove: string) {
        if (profile) {
            const interests = profile.interests.filter(i => i !== interestToRemove)
            updateForm.setValue('interests', interests)
            setProfile(prev => prev ? {...prev, interests} : null)
        }
    }

    function calculateAge(birthDate?: string): number {
        if (!birthDate) return 0
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!profile && !editMode) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-md">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                    <h2 className="text-xl font-semibold mb-2">No Profile Yet</h2>
                    <p className="text-gray-600 mb-4">Create your profile to start matching</p>
                    <Button onClick={() => setEditMode(true)}>
                        Create Profile
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Profile</h1>
                        {profile && (
                            <Sheet open={editMode} onOpenChange={setEditMode}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-2"/>
                                        Edit Profile
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="overflow-y-auto">
                                    <SheetHeader>
                                        <SheetTitle>Edit Profile</SheetTitle>
                                    </SheetHeader>
                                    <EditProfileForm
                                        form={updateForm}
                                        onSubmit={handleUpdateProfile}
                                        uploadingPhoto={uploadingPhoto}
                                        onPhotoUpload={handlePhotoUpload}
                                        interests={profile.interests}
                                        newInterest={newInterest}
                                        onNewInterestChange={setNewInterest}
                                        onAddInterest={addInterest}
                                        onRemoveInterest={removeInterest}
                                    />
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4">
                {profile ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile Overview */}
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <div className="relative inline-block">
                                        <Avatar className="w-24 h-24 mx-auto">
                                            <AvatarImage src={profile.avatar_url}/>
                                            <AvatarFallback className="text-2xl">
                                                {profile.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Badge
                                            className={`absolute -bottom-2 -right-2 ${
                                                profile.verified ? 'bg-blue-500' : 'bg-gray-400'
                                            }`}
                                        >
                                            {profile.verified ? '✓ Verified' : 'Unverified'}
                                        </Badge>
                                    </div>

                                    <h2 className="text-2xl font-bold mt-4">{profile.username}</h2>

                                    {profile.birth_date && (
                                        <p className="text-gray-600">
                                            {profile.privacy?.show_age !== false ? calculateAge(profile.birth_date) : 'Age hidden'}
                                        </p>
                                    )}

                                    {profile.location && profile.privacy?.show_distance !== false && (
                                        <div className="flex items-center justify-center text-gray-600 mt-2">
                                            <MapPin className="h-4 w-4 mr-1"/>
                                            {profile.location}
                                        </div>
                                    )}

                                    <div className="flex justify-center gap-2 mt-4">
                                        <Button variant="outline" size="sm">
                                            <Heart className="h-4 w-4 mr-1"/>
                                            {profile.stats?.likes_received || 0}
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Users className="h-4 w-4 mr-1"/>
                                            {profile.stats?.matches_count || 0}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats */}
                            {profile.stats && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Profile Views</span>
                                            <span className="font-medium">{profile.stats.profile_views}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Likes Received</span>
                                            <span className="font-medium">{profile.stats.likes_received}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Matches</span>
                                            <span className="font-medium">{profile.stats.matches_count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Events Attended</span>
                                            <span className="font-medium">{profile.stats.events_attended}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Profile Details */}
                        <div className="md:col-span-2 space-y-6">
                            <Tabs defaultValue="about" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="about">About</TabsTrigger>
                                    <TabsTrigger value="interests">Interests</TabsTrigger>
                                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                                </TabsList>

                                <TabsContent value="about" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>About Me</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {profile.bio ? (
                                                <p className="text-gray-700">{profile.bio}</p>
                                            ) : (
                                                <p className="text-gray-500 italic">No bio added yet</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {profile.languages.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Languages</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.languages.map((language, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {language}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Account Info</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Member Since</span>
                                                <span className="font-medium">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Last Active</span>
                                                <span className="font-medium">
                          {profile.last_active
                              ? new Date(profile.last_active).toLocaleDateString()
                              : 'Unknown'
                          }
                        </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="interests" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Interests & Hobbies</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {profile.interests.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.interests.map((interest, index) => (
                                                        <Badge key={index} variant="secondary">
                                                            {interest}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No interests added yet</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="privacy" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Privacy Settings</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {profile.privacy ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Show Online Status</span>
                                                        <Badge
                                                            variant={profile.privacy.show_online_status ? 'default' : 'secondary'}>
                                                            {profile.privacy.show_online_status ? 'Visible' : 'Hidden'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Show Distance</span>
                                                        <Badge
                                                            variant={profile.privacy.show_distance ? 'default' : 'secondary'}>
                                                            {profile.privacy.show_distance ? 'Visible' : 'Hidden'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Show Age</span>
                                                        <Badge
                                                            variant={profile.privacy.show_age ? 'default' : 'secondary'}>
                                                            {profile.privacy.show_age ? 'Visible' : 'Hidden'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Allow Messages From</span>
                                                        <Badge variant="outline">
                                                            {profile.privacy.allow_messages_from}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">Privacy settings not configured</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                ) : (
                    /* Create Profile Form */
                    <div className="max-w-2xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Your Profile</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <EditProfileForm
                                    form={updateForm}
                                    onSubmit={handleUpdateProfile}
                                    uploadingPhoto={uploadingPhoto}
                                    onPhotoUpload={handlePhotoUpload}
                                    interests={[]}
                                    newInterest={newInterest}
                                    onNewInterestChange={setNewInterest}
                                    onAddInterest={addInterest}
                                    onRemoveInterest={() => {
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

function EditProfileForm({
                             form,
                             onSubmit,
                             uploadingPhoto,
                             onPhotoUpload,
                             interests,
                             newInterest,
                             onNewInterestChange,
                             onAddInterest,
                             onRemoveInterest,
                         }: {
    form: any
    onSubmit: (data: ProfileUpdateInput) => void
    uploadingPhoto: boolean
    onPhotoUpload: (file: File) => void
    interests: string[]
    newInterest: string
    onNewInterestChange: (value: string) => void
    onAddInterest: () => void
    onRemoveInterest: (interest: string) => void
}) {
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
        setValue,
        watch,
    } = form

    const watchedInterests = watch('interests') || []

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo Upload */}
            <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) onPhotoUpload(file)
                        }}
                        className="hidden"
                        id="photo-upload"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingPhoto}
                        onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                        {uploadingPhoto ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"/>
                        ) : (
                            <Camera className="h-4 w-4 mr-2"/>
                        )}
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                        id="username"
                        {...register('username')}
                        placeholder="Choose a username"
                    />
                    {errors.username && (
                        <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        {...register('bio')}
                        placeholder="Tell us about yourself..."
                        rows={3}
                    />
                    {errors.bio && (
                        <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        {...register('location')}
                        placeholder="City, Country"
                    />
                    {errors.location && (
                        <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="birth_date">Birth Date</Label>
                    <Input
                        id="birth_date"
                        type="date"
                        {...register('birth_date')}
                    />
                    {errors.birth_date && (
                        <p className="text-sm text-red-600 mt-1">{errors.birth_date.message}</p>
                    )}
                </div>
            </div>

            {/* Interests */}
            <div className="space-y-3">
                <Label>Interests</Label>
                <div className="flex gap-2">
                    <Input
                        value={newInterest}
                        onChange={(e) => onNewInterestChange(e.target.value)}
                        placeholder="Add an interest..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                onAddInterest()
                            }
                        }}
                    />
                    <Button type="button" onClick={onAddInterest} disabled={!newInterest.trim()}>
                        <Check className="h-4 w-4"/>
                    </Button>
                </div>

                {watchedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {watchedInterests.map((interest: string, index: number) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {interest}
                                <button
                                    type="button"
                                    onClick={() => onRemoveInterest(interest)}
                                    className="ml-1 hover:text-red-500"
                                >
                                    <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Languages */}
            <div>
                <Label htmlFor="languages">Languages</Label>
                <Input
                    id="languages"
                    {...register('languages')}
                    placeholder="English, Spanish, French..."
                />
                {errors.languages && (
                    <p className="text-sm text-red-600 mt-1">{errors.languages.message}</p>
                )}
            </div>

            <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                </Button>
            </div>
        </form>
    )
}