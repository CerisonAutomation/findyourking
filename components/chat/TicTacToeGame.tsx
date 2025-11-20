'use client';

/**
 * TIC-TAC-TOE IN-CHAT GAME - ENGAGEMENT FEATURE
 * Per Supabase Realtime Broadcast: https://supabase.com/docs/guides/realtime/broadcast
 * Features: Real-time multiplayer, game state sync, win detection
 */

import { useState, useEffect, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Trophy, RotateCcw, X } from 'lucide-react';

interface TicTacToeGameProps {
  channel: RealtimeChannel;
  username: string;
  roomName: string;
  onGameEnd: () => void;
}

type Cell = 'X' | 'O' | null;
type Board = Cell[];

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6],           // Diagonals
];

export default function TicTacToeGame({
  channel,
  username,
  roomName,
  onGameEnd,
}: TicTacToeGameProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O' | null>(null);
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);

  // Check for winner
  const checkWinner = useCallback((board: Board): 'X' | 'O' | 'draw' | null => {
    // Check winning combinations
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    // Check for draw
    if (board.every((cell) => cell !== null)) {
      return 'draw';
    }

    return null;
  }, []);

  // Setup game synchronization
  useEffect(() => {
    if (!channel) return;

    // Listen for moves
    const moveSub = channel.on('broadcast', { event: 'tictactoe_move' }, (payload: any) => {
      if (payload.payload.room === roomName) {
        setBoard(payload.payload.board);
        setCurrentPlayer(payload.payload.nextPlayer);
        
        const result = checkWinner(payload.payload.board);
        if (result) {
          setWinner(result);
        }
      }
    });

    // Listen for opponent joining
    const joinSub = channel.on('broadcast', { event: 'tictactoe_join' }, (payload: any) => {
      if (payload.payload.room === roomName && payload.payload.username !== username) {
        setOpponent(payload.payload.username);
        
        // Assign symbols
        if (!playerSymbol) {
          setPlayerSymbol('X');
          channel.send({
            type: 'broadcast',
            event: 'tictactoe_assign',
            payload: {
              room: roomName,
              player: payload.payload.username,
              symbol: 'O',
            },
          });
        }
      }
    });

    // Listen for symbol assignment
    const assignSub = channel.on('broadcast', { event: 'tictactoe_assign' }, (payload: any) => {
      if (payload.payload.room === roomName && payload.payload.player === username) {
        setPlayerSymbol(payload.payload.symbol);
      }
    });

    // Listen for game reset
    const resetSub = channel.on('broadcast', { event: 'tictactoe_reset' }, (payload: any) => {
      if (payload.payload.room === roomName) {
        setBoard(Array(9).fill(null));
        setCurrentPlayer('X');
        setWinner(null);
      }
    });

    // Announce joining
    channel.send({
      type: 'broadcast',
      event: 'tictactoe_join',
      payload: {
        room: roomName,
        username,
      },
    });

    return () => {
      moveSub.unsubscribe();
      joinSub.unsubscribe();
      assignSub.unsubscribe();
      resetSub.unsubscribe();
    };
  }, [channel, roomName, username, playerSymbol, checkWinner]);

  // Make a move
  const makeMove = (index: number) => {
    if (board[index] || winner || currentPlayer !== playerSymbol || !opponent) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';

    setBoard(newBoard);
    setCurrentPlayer(nextPlayer);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
    }

    // Broadcast move
    channel.send({
      type: 'broadcast',
      event: 'tictactoe_move',
      payload: {
        room: roomName,
        board: newBoard,
        nextPlayer,
      },
    });
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);

    channel.send({
      type: 'broadcast',
      event: 'tictactoe_reset',
      payload: { room: roomName },
    });
  };

  const isMyTurn = currentPlayer === playerSymbol;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Tic Tac Toe
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {opponent ? (
              <>
                You: {playerSymbol} vs {opponent}: {playerSymbol === 'X' ? 'O' : 'X'}
              </>
            ) : (
              'Waiting for opponent...'
            )}
          </p>
        </div>
        <button
          onClick={onGameEnd}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Close game"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => makeMove(index)}
            disabled={!!cell || !!winner || !isMyTurn || !opponent}
            className={`w-20 h-20 flex items-center justify-center text-3xl font-bold rounded-lg transition-all ${
              cell
                ? cell === 'X'
                  ? 'bg-blue-500 text-white'
                  : 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        {winner ? (
          <div className="flex flex-col items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {winner === 'draw'
                ? "It's a draw!"
                : winner === playerSymbol
                ? 'You won! 🎉'
                : `${opponent} won!`}
            </p>
          </div>
        ) : opponent ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isMyTurn ? "Your turn! 🎮" : `${opponent}'s turn...`}
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Waiting for opponent to join...
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </button>
        <button
          onClick={onGameEnd}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}
