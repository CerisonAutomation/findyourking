'use client';

import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Check, ChevronDown, ChevronUp, Heart, MapPin, SlidersHorizontal, User, X,} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {GenderIdentity, RelationshipType} from '@/types/database';

interface FilterPanelProps {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    onApply?: (filters: FilterState) => void;
    initialFilters?: Partial<FilterState>;
}

interface FilterState {
    minAge: number;
    maxAge: number;
    maxDistance: number;
    genderPreferences: GenderIdentity[];
    relationshipGoals: RelationshipType[];
    verifiedOnly: boolean;
    hasPhotos: boolean;
    onlineNow: boolean;
    interests: string[];
}

const defaultFilters: FilterState = {
    minAge: 18,
    maxAge: 50,
    maxDistance: 50,
    genderPreferences: [],
    relationshipGoals: [],
    verifiedOnly: false,
    hasPhotos: true,
    onlineNow: false,
    interests: [],
};

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

export function FilterPanel({
                                className,
                                isOpen,
                                onClose,
                                onApply,
                                initialFilters,
                            }: FilterPanelProps) {
    const [filters, setFilters] = useState<FilterState>({
        ...defaultFilters,
        ...initialFilters,
    });
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        age: true,
        distance: true,
        gender: true,
        relationship: false,
        interests: false,
        other: false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({...prev, [section]: !prev[section]}));
    };

    const toggleGender = (gender: GenderIdentity) => {
        setFilters((prev) => ({
            ...prev,
            genderPreferences: prev.genderPreferences.includes(gender)
                ? prev.genderPreferences.filter((g) => g !== gender)
                : [...prev.genderPreferences, gender],
        }));
    };

    const toggleRelationship = (goal: RelationshipType) => {
        setFilters((prev) => ({
            ...prev,
            relationshipGoals: prev.relationshipGoals.includes(goal)
                ? prev.relationshipGoals.filter((g) => g !== goal)
                : [...prev.relationshipGoals, goal],
        }));
    };

    const toggleInterest = (interest: string) => {
        setFilters((prev) => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter((i) => i !== interest)
                : [...prev.interests, interest],
        }));
    };

    const handleReset = () => {
        setFilters(defaultFilters);
    };

    const handleApply = () => {
        onApply?.(filters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={cn('w-full', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary"/>
                    <h2 className="text-lg font-semibold">Filters</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5"/>
                </Button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Age Range */}
                <div className="rounded-lg border border-border p-4">
                    <button
                        onClick={() => toggleSection('age')}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-medium">Age Range</span>
                        </div>
                        {expandedSections.age ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground"/>
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        )}
                    </button>
                    {expandedSections.age && (
                        <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {filters.minAge} - {filters.maxAge} years
                </span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground">Minimum age</label>
                                    <Slider
                                        value={[filters.minAge]}
                                        onValueChange={([value]) =>
                                            setFilters((prev) => ({...prev, minAge: Math.min(value, prev.maxAge - 1)}))
                                        }
                                        min={18}
                                        max={80}
                                        step={1}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Maximum age</label>
                                    <Slider
                                        value={[filters.maxAge]}
                                        onValueChange={([value]) =>
                                            setFilters((prev) => ({...prev, maxAge: Math.max(value, prev.minAge + 1)}))
                                        }
                                        min={18}
                                        max={80}
                                        step={1}
                                        className="mt-2"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Distance */}
                <div className="rounded-lg border border-border p-4">
                    <button
                        onClick={() => toggleSection('distance')}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-medium">Distance</span>
                        </div>
                        {expandedSections.distance ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground"/>
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        )}
                    </button>
                    {expandedSections.distance && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Maximum distance</span>
                                <span className="font-medium">{filters.maxDistance} km</span>
                            </div>
                            <Slider
                                value={[filters.maxDistance]}
                                onValueChange={([value]) =>
                                    setFilters((prev) => ({...prev, maxDistance: value}))
                                }
                                min={1}
                                max={200}
                                step={1}
                            />
                        </div>
                    )}
                </div>

                {/* Gender Preferences */}
                <div className="rounded-lg border border-border p-4">
                    <button
                        onClick={() => toggleSection('gender')}
                        className="flex items-center justify-between w-full"
                    >
                        <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-medium">Show me</span>
                        </div>
                        {expandedSections.gender ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground"/>
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        )}
                    </button>
                    {expandedSections.gender && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {genderOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => toggleGender(option.value)}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-sm transition-colors',
                                        filters.genderPreferences.includes(option.value)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-accent'
                                    )}
                                >
                                    {filters.genderPreferences.includes(option.value) && (
                                        <Check className="mr-1 inline h-3 w-3"/>
                                    )}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Relationship Goals */}
                <div className="rounded-lg border border-border p-4">
                    <button
                        onClick={() => toggleSection('relationship')}
                        className="flex items-center justify-between w-full"
                    >
                        <span className="font-medium">Looking for</span>
                        {expandedSections.relationship ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground"/>
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        )}
                    </button>
                    {expandedSections.relationship && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {relationshipOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => toggleRelationship(option.value)}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-sm transition-colors',
                                        filters.relationshipGoals.includes(option.value)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-accent'
                                    )}
                                >
                                    {filters.relationshipGoals.includes(option.value) && (
                                        <Check className="mr-1 inline h-3 w-3"/>
                                    )}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Interests */}
                <div className="rounded-lg border border-border p-4">
                    <button
                        onClick={() => toggleSection('interests')}
                        className="flex items-center justify-between w-full"
                    >
                        <span className="font-medium">Interests</span>
                        {expandedSections.interests ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground"/>
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        )}
                    </button>
                    {expandedSections.interests && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {interestOptions.map((interest) => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-sm transition-colors',
                                        filters.interests.includes(interest)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-accent'
                                    )}
                                >
                                    {filters.interests.includes(interest) && (
                                        <Check className="mr-1 inline h-3 w-3"/>
                                    )}
                                    {interest}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Toggle filters */}
                <div className="rounded-lg border border-border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Verified only</p>
                            <p className="text-xs text-muted-foreground">Show only verified profiles</p>
                        </div>
                        <Switch
                            checked={filters.verifiedOnly}
                            onCheckedChange={(checked) =>
                                setFilters((prev) => ({...prev, verifiedOnly: checked}))
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Has photos</p>
                            <p className="text-xs text-muted-foreground">Show only profiles with photos</p>
                        </div>
                        <Switch
                            checked={filters.hasPhotos}
                            onCheckedChange={(checked) =>
                                setFilters((prev) => ({...prev, hasPhotos: checked}))
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Online now</p>
                            <p className="text-xs text-muted-foreground">Show only currently online users</p>
                        </div>
                        <Switch
                            checked={filters.onlineNow}
                            onCheckedChange={(checked) =>
                                setFilters((prev) => ({...prev, onlineNow: checked}))
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                    Reset
                </Button>
                <Button className="flex-1" onClick={handleApply}>
                    Apply Filters
                </Button>
            </div>
        </div>
    );
}
