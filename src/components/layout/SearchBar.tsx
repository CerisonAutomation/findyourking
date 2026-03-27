'use client';

import React, {useEffect, useRef, useState} from 'react';
import {Clock, MapPin, Search, SlidersHorizontal, TrendingUp, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';

interface SearchBarProps {
    className?: string;
    placeholder?: string;
    onSearch?: (query: string) => void;
    onFilterClick?: () => void;
    showFilters?: boolean;
}

const recentSearches = ['Los Angeles', 'Photography lovers', 'Nearby'];
const trendingSearches = ['Pride events', 'Coffee dates', 'Hikers', 'Tech professionals'];

export function SearchBar({
                              className,
                              placeholder = 'Search people, interests, locations...',
                              onSearch,
                              onFilterClick,
                              showFilters = true,
                          }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch?.(query.trim());
            setIsFocused(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        onSearch?.(suggestion);
        setIsFocused(false);
    };

    const clearQuery = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={cn('relative w-full max-w-xl', className)}>
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder={placeholder}
                    className={cn(
                        'pl-10 pr-20 bg-muted/50 border-border/50 focus-visible:ring-primary/30',
                        isFocused && 'ring-1 ring-primary/30'
                    )}
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {query && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={clearQuery}
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                    {showFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={onFilterClick}
                        >
                            <SlidersHorizontal className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
            </form>

            {/* Search suggestions dropdown */}
            {isFocused && (
                <div
                    className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-border bg-popover p-3 shadow-lg">
                    {/* Recent searches */}
                    {recentSearches.length > 0 && (
                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground"/>
                                <span className="text-xs font-medium text-muted-foreground">Recent</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {recentSearches.map((search) => (
                                    <button
                                        key={search}
                                        onClick={() => handleSuggestionClick(search)}
                                        className="rounded-full bg-muted px-3 py-1 text-xs transition-colors hover:bg-accent"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending searches */}
                    {trendingSearches.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground"/>
                                <span className="text-xs font-medium text-muted-foreground">Trending</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {trendingSearches.map((search) => (
                                    <button
                                        key={search}
                                        onClick={() => handleSuggestionClick(search)}
                                        className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-accent"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick filters */}
                    <div className="mt-3 border-t border-border pt-3">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground"/>
                            <span className="text-xs font-medium text-muted-foreground">Quick Filters</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => handleSuggestionClick('Nearby')}
                                className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs transition-colors hover:bg-primary/20"
                            >
                                Nearby
                            </button>
                            <button
                                onClick={() => handleSuggestionClick('Online now')}
                                className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs transition-colors hover:bg-primary/20"
                            >
                                Online now
                            </button>
                            <button
                                onClick={() => handleSuggestionClick('Verified')}
                                className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs transition-colors hover:bg-primary/20"
                            >
                                Verified only
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
