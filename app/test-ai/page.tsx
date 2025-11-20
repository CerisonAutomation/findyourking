/**
 * Test page for modular AI components
 * This page demonstrates the reusable AI components
 */

'use client';

import { useState } from 'react';
import { AIChatInterface } from '@/components/ai/AIChatInterface';
import { PersonalityEditor } from '@/components/ai/PersonalityEditor';
import { TicTacToeGame } from '@/components/ai/TicTacToeGame';

export default function TestAIComponents() {
  const [activeTab, setActiveTab] = useState<'chat' | 'personality' | 'game'>('chat');
  const [boyfriendId] = useState('test-boyfriend-id'); // Mock ID for testing

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          AI Components Test Suite
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-pink-500'
              }`}
            >
              Chat Interface
            </button>
            <button
              onClick={() => setActiveTab('personality')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'personality'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-pink-500'
              }`}
            >
              Personality Editor
            </button>
            <button
              onClick={() => setActiveTab('game')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'game'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:text-pink-500'
              }`}
            >
              Tic Tac Toe
            </button>
          </div>
        </div>

        {/* Component Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'chat' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                AI Chat Interface
              </h2>
              <p className="text-gray-600 mb-4">
                Test the modular chat interface with streaming responses.
              </p>
              <AIChatInterface
                onSendMessage={async () => {

                  // Mock AI response
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }}
              />
            </div>
          )}

          {activeTab === 'personality' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Personality Editor
              </h2>
              <p className="text-gray-600 mb-4">
                Customize AI personality traits with this modular editor.
              </p>
              <PersonalityEditor boyfriendId={boyfriendId} />
            </div>
          )}

          {activeTab === 'game' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Tic Tac Toe Game
              </h2>
              <p className="text-gray-600 mb-4">
                Play against the AI in this interactive game component.
              </p>
              <TicTacToeGame
                boyfriendId={boyfriendId}
                onGameEnd={() => {

                }}
              />
            </div>
          )}
        </div>

        {/* Status Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Test Status</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Chat Interface: Modular component with streaming support</li>
            <li>• Personality Editor: Interactive trait customization</li>
            <li>• Tic Tac Toe: AI-powered game with API integration</li>
            <li>• All components: Reusable across different boyfriend profiles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}