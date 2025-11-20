'use client';

import { useEffect, useState, useCallback } from 'react';
import { Gift, X, Heart, Sparkles } from 'lucide-react';

interface VirtualGift {
  id: string;
  gift_type: string;
  title: string;
  content: string;
  occasion: string;
  opened: boolean;
  opened_at: string | null;
  user_reaction: string | null;
  created_at: string;
}

interface GiftSystemProps {
  boyfriendId: string;
  boyfriendName: string;
}

const GIFT_EMOJIS: Record<string, string> = {
  flowers: '💐',
  poem: '📝',
  playlist: '🎵',
  letter: '💌',
  surprise_message: '✨',
};

export function GiftSystem({ boyfriendId, boyfriendName }: GiftSystemProps) {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);
  const [loading, setLoading] = useState(true);
  const [reaction, setReaction] = useState('');

  const loadGifts = useCallback(async () => {
    try {
      const response = await fetch(`/api/boyfriend/gifts/send?boyfriendId=${boyfriendId}`);
      if (response.ok) {
        const data = await response.json();
        setGifts(data.gifts || []);
      }
    } catch {
      // Error loading gifts
    } finally {
      setLoading(false);
    }
  }, [boyfriendId]);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  async function openGift(gift: VirtualGift) {
    if (gift.opened) {
      setSelectedGift(gift);
      return;
    }

    try {
      const response = await fetch('/api/boyfriend/gifts/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftId: gift.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedGift(data.gift);
        loadGifts();
      }
    } catch {
      // Error opening gift
    }
  }

  async function sendReaction() {
    if (!selectedGift || !reaction.trim()) return;

    try {
      const response = await fetch('/api/boyfriend/gifts/send', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          giftId: selectedGift.id, 
          reaction: reaction.trim() 
        }),
      });

      if (response.ok) {
        setReaction('');
        loadGifts();
        setSelectedGift(null);
      }
    } catch {
      // Error sending reaction
    }
  }

  const unopenedGifts = gifts.filter(g => !g.opened);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading gifts...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Unopened Gifts Badge */}
      {unopenedGifts.length > 0 && (
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
            <Gift className="w-5 h-5" />
            <span className="font-medium">
              {unopenedGifts.length} new {unopenedGifts.length === 1 ? 'gift' : 'gifts'} from {boyfriendName}!
            </span>
          </div>
        </div>
      )}

      {/* Gifts Grid */}
      {gifts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gifts.map((gift) => (
            <button
              key={gift.id}
              onClick={() => openGift(gift)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                gift.opened
                  ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-linear-to-br from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 border-pink-300 dark:border-pink-700 animate-pulse'
              }`}
            >
              <div className="text-4xl mb-2">{GIFT_EMOJIS[gift.gift_type] || '🎁'}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {gift.title}
              </div>
              {!gift.opened && (
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No gifts yet. {boyfriendName} will send you something special soon!</p>
        </div>
      )}

      {/* Gift Modal */}
      {selectedGift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedGift(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="text-6xl mb-3">{GIFT_EMOJIS[selectedGift.gift_type] || '🎁'}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedGift.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                From {boyfriendName} • {new Date(selectedGift.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedGift.content}
              </p>
            </div>

            {selectedGift.user_reaction ? (
              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Your response:</span> {selectedGift.user_reaction}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={reaction}
                  onChange={(e) => setReaction(e.target.value)}
                  placeholder={`Reply to ${boyfriendName}...`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={sendReaction}
                  disabled={!reaction.trim()}
                  className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Send Your Reaction
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
