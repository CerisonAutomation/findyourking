'use client';

import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Briefcase, Camera, ChevronDown, ChevronUp, Globe, Loader2, Plus, Save, User,} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {GenderIdentity, Profile, ProfileUpdate, RelationshipType, SexualOrientation,} from '@/types/database';

interface ProfileEditorProps {
    profile: Profile;
    onSave: (data: ProfileUpdate) => Promise<void>;
    className?: string;
}

const genderOptions: { value: GenderIdentity; label: string }[] = [
    {value: 'man', label: 'Man'},
    {value: 'woman', label: 'Woman'},
    {value: 'non_binary', label: 'Non-binary'},
    {value: 'genderqueer', label: 'Genderqueer'},
    {value: 'genderfluid', label: 'Genderfluid'},
    {value: 'agender', label: 'Agender'},
    {value: 'two_spirit', label: 'Two-Spirit'},
    {value: 'other', label: 'Other'},
];

const orientationOptions: { value: SexualOrientation; label: string }[] = [
    {value: 'gay', label: 'Gay'},
    {value: 'lesbian', label: 'Lesbian'},
    {value: 'bisexual', label: 'Bisexual'},
    {value: 'pansexual', label: 'Pansexual'},
    {value: 'asexual', label: 'Asexual'},
    {value: 'queer', label: 'Queer'},
    {value: 'questioning', label: 'Questioning'},
    {value: 'other', label: 'Other'},
];

const relationshipOptions: { value: RelationshipType; label: string }[] = [
    {value: 'dating', label: 'Dating'},
    {value: 'relationship', label: 'Relationship'},
    {value: 'friendship', label: 'Friendship'},
    {value: 'casual', label: 'Casual'},
    {value: 'networking', label: 'Networking'},
    {value: 'open', label: 'Open'},
];

const interestOptions = [
    'Photography', 'Travel', 'Music', 'Fitness', 'Cooking',
    'Gaming', 'Reading', 'Art', 'Movies', 'Hiking',
    'Dancing', 'Yoga', 'Tech', 'Fashion', 'Food',
    'Sports', 'Nature', 'Pets', 'Writing', 'Volunteering',
];

const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Portuguese',
    'Italian', 'Japanese', 'Korean', 'Mandarin', 'Arabic',
    'Hindi', 'Russian', 'Dutch', 'Swedish', 'ASL',
];

const lifestyleChoices = {
    smoking: ['Non-smoker', 'Social smoker', 'Smoker', 'Trying to quit'],
    drinking: ['Non-drinker', 'Social drinker', 'Regular drinker', 'Sober'],
    children: ['Want children', 'Don\'t want children', 'Have children', 'Not sure'],
    pets: ['Dog person', 'Cat person', 'Love all pets', 'No pets', 'Have pets'],
};

export function ProfileEditor({profile, onSave, className}: ProfileEditorProps) {
    const [formData, setFormData] = useState<ProfileUpdate>({
        display_name: profile.display_name,
        bio: profile.bio,
        pronouns: profile.pronouns,
        gender_identity: profile.gender_identity,
        sexual_orientation: profile.sexual_orientation,
        relationship_goals: profile.relationship_goals,
        occupation: profile.occupation,
        education: profile.education,
        location_city: profile.location_city,
        location_state: profile.location_state,
        location_country: profile.location_country,
        height_cm: profile.height_cm,
        interests: profile.interests,
        languages: profile.languages,
        smoking: profile.smoking,
        drinking: profile.drinking,
        children: profile.children,
        pets: profile.pets,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        identity: true,
        details: false,
        lifestyle: false,
        interests: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({...prev, [section]: !prev[section]}));
    };

    const handleChange = (field: keyof ProfileUpdate, value: unknown) => {
        setFormData((prev) => ({...prev, [field]: value}));
    };

    const toggleItem = (field: 'interests' | 'languages' | 'sexual_orientation' | 'relationship_goals', item: string) => {
        const current = (formData[field] as string[]) || [];
        handleChange(
            field,
            current.includes(item) ? current.filter((i) => i !== item) : [...current, item]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={cn('max-w-2xl mx-auto space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Edit Profile</h1>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4"/>
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Photos section */}
            <div className="rounded-lg border border-border p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="h-4 w-4"/>
                    Photos
                </h2>
                <div className="grid grid-cols-4 gap-2">
                    {/* Existing photos would go here */}
                    <button
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors">
                        <Plus className="h-6 w-6 text-muted-foreground"/>
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Add up to 6 photos. First photo is your main profile picture.
                </p>
            </div>

            {/* Basic Info */}
            <div className="rounded-lg border border-border p-4">
                <button
                    onClick={() => toggleSection('basic')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h2 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4"/>
                        Basic Info
                    </h2>
                    {expandedSections.basic ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                </button>
                {expandedSections.basic && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Display Name</label>
                            <Input
                                value={formData.display_name || ''}
                                onChange={(e) => handleChange('display_name', e.target.value)}
                                placeholder="Your display name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bio</label>
                            <textarea
                                value={formData.bio || ''}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                placeholder="Tell people about yourself..."
                                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {(formData.bio || '').length}/500 characters
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Pronouns</label>
                            <Input
                                value={formData.pronouns || ''}
                                onChange={(e) => handleChange('pronouns', e.target.value)}
                                placeholder="e.g., he/him, she/her, they/them"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Identity */}
            <div className="rounded-lg border border-border p-4">
                <button
                    onClick={() => toggleSection('identity')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h2 className="font-semibold">Identity & Preferences</h2>
                    {expandedSections.identity ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                </button>
                {expandedSections.identity && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Gender Identity</label>
                            <div className="flex flex-wrap gap-2">
                                {genderOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleChange('gender_identity', option.value)}
                                        className={cn(
                                            'rounded-full px-3 py-1.5 text-sm transition-colors',
                                            formData.gender_identity === option.value
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Sexual Orientation</label>
                            <div className="flex flex-wrap gap-2">
                                {orientationOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => toggleItem('sexual_orientation', option.value)}
                                        className={cn(
                                            'rounded-full px-3 py-1.5 text-sm transition-colors',
                                            (formData.sexual_orientation || []).includes(option.value)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Looking For</label>
                            <div className="flex flex-wrap gap-2">
                                {relationshipOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => toggleItem('relationship_goals', option.value)}
                                        className={cn(
                                            'rounded-full px-3 py-1.5 text-sm transition-colors',
                                            (formData.relationship_goals || []).includes(option.value)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="rounded-lg border border-border p-4">
                <button
                    onClick={() => toggleSection('details')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h2 className="font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4"/>
                        Details
                    </h2>
                    {expandedSections.details ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                </button>
                {expandedSections.details && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Occupation</label>
                                <Input
                                    value={formData.occupation || ''}
                                    onChange={(e) => handleChange('occupation', e.target.value)}
                                    placeholder="Your job"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Education</label>
                                <Input
                                    value={formData.education || ''}
                                    onChange={(e) => handleChange('education', e.target.value)}
                                    placeholder="Your school"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <Input
                                    value={formData.location_city || ''}
                                    onChange={(e) => handleChange('location_city', e.target.value)}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">State</label>
                                <Input
                                    value={formData.location_state || ''}
                                    onChange={(e) => handleChange('location_state', e.target.value)}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <Input
                                    value={formData.location_country || ''}
                                    onChange={(e) => handleChange('location_country', e.target.value)}
                                    placeholder="Country"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Height (cm)</label>
                            <Input
                                type="number"
                                value={formData.height_cm || ''}
                                onChange={(e) => handleChange('height_cm', e.target.value ? Number(e.target.value) : null)}
                                placeholder="175"
                                min={100}
                                max={250}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Lifestyle */}
            <div className="rounded-lg border border-border p-4">
                <button
                    onClick={() => toggleSection('lifestyle')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h2 className="font-semibold">Lifestyle</h2>
                    {expandedSections.lifestyle ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                </button>
                {expandedSections.lifestyle && (
                    <div className="space-y-4">
                        {Object.entries(lifestyleChoices).map(([key, choices]) => (
                            <div key={key}>
                                <label className="block text-sm font-medium mb-2 capitalize">{key}</label>
                                <div className="flex flex-wrap gap-2">
                                    {choices.map((choice) => (
                                        <button
                                            key={choice}
                                            onClick={() => handleChange(key as keyof ProfileUpdate, choice)}
                                            className={cn(
                                                'rounded-full px-3 py-1.5 text-sm transition-colors',
                                                formData[key as keyof ProfileUpdate] === choice
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                            )}
                                        >
                                            {choice}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Interests & Languages */}
            <div className="rounded-lg border border-border p-4">
                <button
                    onClick={() => toggleSection('interests')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <h2 className="font-semibold flex items-center gap-2">
                        <Globe className="h-4 w-4"/>
                        Interests & Languages
                    </h2>
                    {expandedSections.interests ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                </button>
                {expandedSections.interests && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Interests</label>
                            <div className="flex flex-wrap gap-2">
                                {interestOptions.map((interest) => (
                                    <button
                                        key={interest}
                                        onClick={() => toggleItem('interests', interest)}
                                        className={cn(
                                            'rounded-full px-3 py-1.5 text-sm transition-colors',
                                            (formData.interests || []).includes(interest)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        )}
                                    >
                                        {interest}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Languages</label>
                            <div className="flex flex-wrap gap-2">
                                {languageOptions.map((language) => (
                                    <button
                                        key={language}
                                        onClick={() => toggleItem('languages', language)}
                                        className={cn(
                                            'rounded-full px-3 py-1.5 text-sm transition-colors',
                                            (formData.languages || []).includes(language)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        )}
                                    >
                                        {language}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom save */}
            <div className="flex justify-end pb-8">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4"/>
                            Save All Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
