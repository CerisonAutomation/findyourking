'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PersonalityEditor, PersonalityTraits } from '@/components/ai/PersonalityEditor';
import { X } from 'lucide-react';

export default function PersonalityModal() {
  const [personality, setPersonality] = useState<PersonalityTraits | null>(null);
  const [boyfriendId, setBoyfriendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const loadPersonalityData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: boyfriend } = await supabase
        .from('ai_boyfriends')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (boyfriend) {
        setBoyfriendId(boyfriend.id);
        setPersonality({
          openness: boyfriend.openness,
          conscientiousness: boyfriend.conscientiousness,
          extraversion: boyfriend.extraversion,
          agreeableness: boyfriend.agreeableness,
          neuroticism: boyfriend.neuroticism,
          formality: boyfriend.formality,
          verbosity: boyfriend.verbosity,
          humor: boyfriend.humor,
          emotiveness: boyfriend.emotiveness,
          playfulness: boyfriend.playfulness,
          flirtiness: boyfriend.flirtiness,
        });
      }
    } catch (error) {
      console.error('Failed to load personality:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPersonalityData();
  }, [loadPersonalityData]);

  const handleSave = async (updatedPersonality: PersonalityTraits) => {
    if (!boyfriendId) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('ai_boyfriends')
        .update(updatedPersonality)
        .eq('id', boyfriendId);

      if (error) throw error;

      setPersonality(updatedPersonality);
      router.back(); // Close modal
    } catch {
      alert('Failed to save personality. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white">Loading personality...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!personality) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-white mb-4">No AI boyfriend found.</p>
            <button
              onClick={handleClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Edit Personality</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <PersonalityEditor
            boyfriendId={boyfriendId || ''}
            onSave={handleSave}
            onCancel={handleClose}
            isLoading={saving}
          />
        </div>
      </div>
    </div>
  );
}