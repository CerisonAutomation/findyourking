'use client';

/**
 * GIF PICKER - ZENITH LEGENDARY TIER
 * Per Giphy SDK: https://developers.giphy.com/docs/sdk
 * Features: Search, trending, categories, preview
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GifAttachment } from '../types';

interface GifPickerProps {
  onSelect: (gif: GifAttachment) => void;
  children?: React.ReactNode;
}

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'demo';

export function GifPicker({ onSelect, children }: GifPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingGifs, setTrendingGifs] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTrending();
    }
  }, [open]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      setTrendingGifs(data.data || []);
    } catch (error) {
      console.error('Failed to fetch trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&rating=g`
      );
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Failed to search GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchGifs();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchGifs]);

  const handleGifSelect = (gif: any) => {
    const gifData: GifAttachment = {
      id: gif.id,
      url: gif.images.original.url,
      preview_url: gif.images.fixed_width.url,
      width: parseInt(gif.images.original.width),
      height: parseInt(gif.images.original.height),
      title: gif.title,
    };

    onSelect(gifData);
    setOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderGifGrid = (gifs: any[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
      {gifs.map((gif) => (
        <button
          key={gif.id}
          onClick={() => handleGifSelect(gif)}
          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all"
        >
          <img
            src={gif.images.fixed_width.url}
            alt={gif.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" aria-label="Add GIF">
            GIF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search GIFs</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search for GIFs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trending" className="flex-1 min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="trending" className="flex-1">
              Trending
            </TabsTrigger>
            <TabsTrigger value="search" className="flex-1" disabled={!searchQuery.trim()}>
              Search Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-4 flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : (
              renderGifGrid(trendingGifs)
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-4 flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : searchResults.length > 0 ? (
              renderGifGrid(searchResults)
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No GIFs found
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Powered by GIPHY */}
        <div className="text-center text-xs text-gray-500 mt-2">
          Powered by{' '}
          <a
            href="https://giphy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 hover:underline"
          >
            GIPHY
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
