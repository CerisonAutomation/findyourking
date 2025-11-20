/**
 * Tic Tac Toe Game - Modular Component
 * Interactive AI-powered Tic Tac Toe game
 */

'use client';

import { useState, useCallback } from 'react';
import { X, Circle, RotateCcw, Target } from 'lucide-react';

interface GameState {
  board: (string | null)[];
  currentPlayer: 'user' | 'ai';
  winner: 'user' | 'ai' | 'draw' | null;
  isGameOver: boolean;
}

interface TicTacToeGameProps {
  boyfriendId: string;
  onGameEnd?: (result: { winner: 'user' | 'ai' | 'draw'; moves: number }) => void;
  className?: string;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

export function TicTacToeGame({ boyfriendId, onGameEnd, className = '' }: TicTacToeGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'user',
    winner: null,
    isGameOver: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });

  const checkWinner = useCallback((board: (string | null)[]): 'user' | 'ai' | 'draw' | null => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === 'X' ? 'user' : 'ai';
      }
    }

    if (board.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  }, []);

  const makeMove = useCallback(async (index: number) => {
    if (gameState.board[index] || gameState.isGameOver || isLoading) return;

    const newBoard = [...gameState.board];
    newBoard[index] = 'X';

    const winner = checkWinner(newBoard);
    const newMoveCount = moveCount + 1;

    if (winner) {
      const finalState = {
        board: newBoard,
        currentPlayer: 'ai' as const,
        winner,
        isGameOver: true,
      };
      setGameState(finalState);
      setMoveCount(newMoveCount);

      // Update stats
      setStats(prev => ({
        ...prev,
        [winner === 'user' ? 'wins' : winner === 'ai' ? 'losses' : 'draws']:
          prev[winner === 'user' ? 'wins' : winner === 'ai' ? 'losses' : 'draws'] + 1,
      }));

      onGameEnd?.({ winner, moves: newMoveCount });
      return;
    }

    setGameState({
      board: newBoard,
      currentPlayer: 'ai',
      winner: null,
      isGameOver: false,
    });
    setMoveCount(newMoveCount);
    setIsLoading(true);

    try {
      const response = await fetch('/api/boyfriend/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boyfriendId,
          move: index.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to make game move');
      }

      const result = await response.json();

      if (result.aiMove) {
        const aiIndex = parseInt(result.aiMove);

        const boardWithAIMove = [...newBoard];
        boardWithAIMove[aiIndex] = 'O';

        const aiWinner = checkWinner(boardWithAIMove);

        setGameState({
          board: boardWithAIMove,
          currentPlayer: 'user',
          winner: aiWinner,
          isGameOver: !!aiWinner,
        });

        if (aiWinner) {
          setStats(prev => ({
            ...prev,
            [aiWinner === 'ai' ? 'losses' : aiWinner === 'draw' ? 'draws' : 'wins']:
              prev[aiWinner === 'ai' ? 'losses' : aiWinner === 'draw' ? 'draws' : 'wins'] + 1,
          }));
          onGameEnd?.({ winner: aiWinner, moves: newMoveCount + 1 });
        }
      }
    } catch {
      // Error displayed in UI
      // Reset to user turn on error
      setGameState(prev => ({ ...prev, currentPlayer: 'user' }));
    } finally {
      setIsLoading(false);
    }
  }, [gameState, moveCount, isLoading, checkWinner, onGameEnd, boyfriendId]);

  const resetGame = useCallback(() => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'user',
      winner: null,
      isGameOver: false,
    });
    setMoveCount(0);
    setIsLoading(false);
  }, []);

  const getStatusMessage = () => {
    if (gameState.winner) {
      if (gameState.winner === 'draw') return "It's a draw! 🤝";
      return gameState.winner === 'user' ? 'You win! 🎉' : 'AI wins! 🤖';
    }
    if (isLoading) return 'AI is thinking... 🤔';
    return gameState.currentPlayer === 'user' ? 'Your turn!' : 'AI is playing...';
  };

  return (
    <div className={`bg-slate-900/50 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Tic Tac Toe
        </h2>
        <p className="text-gray-400">Challenge your AI boyfriend to a game!</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
          <div className="text-sm text-gray-400">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
          <div className="text-sm text-gray-400">Losses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.draws}</div>
          <div className="text-sm text-gray-400">Draws</div>
        </div>
      </div>

      {/* Game Status */}
      <div className="text-center mb-6">
        <p className="text-lg text-white">{getStatusMessage()}</p>
        {gameState.winner && (
          <div className="mt-2">
            <span className="text-sm text-gray-400">Moves: {moveCount}</span>
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 mb-6 max-w-xs mx-auto">
        {gameState.board.map((cell, index) => (
          <button
            key={index}
            onClick={() => makeMove(index)}
            disabled={cell !== null || gameState.isGameOver || isLoading || gameState.currentPlayer === 'ai'}
            className="aspect-square bg-white/10 border-2 border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {cell === 'X' && <X className="w-8 h-8 text-blue-400" />}
            {cell === 'O' && <Circle className="w-8 h-8 text-red-400" />}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        <button
          onClick={resetGame}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          New Game
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-white">AI is thinking...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini game component for embedding in chat
interface MiniTicTacToeProps {
  onGameComplete?: (result: string) => void;
  className?: string;
}

export function MiniTicTacToe({ onGameComplete, className = '' }: MiniTicTacToeProps) {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'user',
    winner: null,
    isGameOver: false,
  });
  const [isMinimized, setIsMinimized] = useState(false);

  const makeMove = useCallback(async (index: number) => {
    if (gameState.board[index] || gameState.isGameOver) return;

    const newBoard = [...gameState.board];
    newBoard[index] = 'X';

    const winner = checkWinner(newBoard);

    if (winner) {
      setGameState({
        board: newBoard,
        currentPlayer: 'ai',
        winner,
        isGameOver: true,
      });
      onGameComplete?.(winner === 'user' ? 'You won! 🎉' : winner === 'draw' ? 'Draw! 🤝' : 'AI won! 🤖');
      return;
    }

    setGameState({
      board: newBoard,
      currentPlayer: 'ai',
      winner: null,
      isGameOver: false,
    });

    // Simulate AI move (simplified)
    setTimeout(() => {
      const emptyCells = newBoard.map((cell, i) => cell === null ? i : null).filter(i => i !== null);
      const aiMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];

      if (aiMove !== undefined) {
        const boardWithAIMove = [...newBoard];
        boardWithAIMove[aiMove] = 'O';

        const aiWinner = checkWinner(boardWithAIMove);

        setGameState({
          board: boardWithAIMove,
          currentPlayer: 'user',
          winner: aiWinner,
          isGameOver: !!aiWinner,
        });

        if (aiWinner) {
          onGameComplete?.(aiWinner === 'ai' ? 'AI won! 🤖' : 'Draw! 🤝');
        }
      }
    }, 1000);
  }, [gameState, onGameComplete]);

  if (isMinimized) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-3 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="text-white text-sm hover:text-blue-400"
        >
          🎮 Resume Tic Tac Toe
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold">Tic Tac Toe</h3>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 mb-3 max-w-32 mx-auto">
        {gameState.board.map((cell, index) => (
          <button
            key={index}
            onClick={() => makeMove(index)}
            disabled={cell !== null || gameState.isGameOver || gameState.currentPlayer === 'ai'}
            className="aspect-square bg-white/10 border border-white/20 rounded flex items-center justify-center hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {cell === 'X' && <X className="w-4 h-4 text-blue-400" />}
            {cell === 'O' && <Circle className="w-4 h-4 text-red-400" />}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400">
          {gameState.winner ? (
            gameState.winner === 'draw' ? 'Draw!' :
            gameState.winner === 'user' ? 'You win!' : 'AI wins!'
          ) : (
            gameState.currentPlayer === 'user' ? 'Your turn' : 'AI thinking...'
          )}
        </p>
      </div>
    </div>
  );
}

// Helper function for winner checking
function checkWinner(board: (string | null)[]): 'user' | 'ai' | 'draw' | null {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === 'X' ? 'user' : 'ai';
    }
  }

  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  return null;
}