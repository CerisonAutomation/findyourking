'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TicTacToeGameProps {
  /** The Supabase Realtime Channel instance for broadcasting game updates. */
  channel: any;
  /** The username of the current player. */
  username: string;
  /** The name of the chat room where the game is being played. */
  roomName: string;
  /** Callback function to be called when the game ends. */
  onGameEnd: () => void;
}

const EVENT_GAME_UPDATE = 'tictactoe_game_update';
const EVENT_GAME_RESET = 'tictactoe_game_reset';
// EVENT_GAME_INITIATE is handled by RealtimeChat, not directly here.

/**
 * A multiplayer Tic Tac Toe game component that uses Supabase Realtime
 * for synchronizing game state and player turns.
 */
export const TicTacToeGame = ({ channel, username, roomName, onGameEnd }: TicTacToeGameProps) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerSymbol, setPlayerSymbol] = useState<string | null>(null); // 'X' or 'O'
  const [players, setPlayers] = useState<any[]>([]); // List of players in the game
  const userIdRef = useRef<string>(Math.random().toString(36).substring(2, 15)); // Unique ID for this game instance

  /**
   * Calculates the winner of the Tic Tac Toe game.
   * @param {(string | null)[]} squares - The current state of the game board.
   * @returns {string | null} The symbol of the winner ('X' or 'O'), or null if no winner.
   */
  const calculateWinner = useCallback((squares: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
    }, []);

  useEffect(() => {
    const currentUserId = userIdRef.current; // Capture userId.current for cleanup

    /** Handles presence synchronization for game players. */
    const handlePresenceSync = (): void => {
      const state = channel.presenceState();
      const currentPlayers: any[] = [];
      Object.keys(state).forEach(key => {
        const presences = state[key];
        currentPlayers.push(...presences);
      });
      currentPlayers.sort((a, b) => a.joined_at - b.joined_at);
      setPlayers(currentPlayers);

      if (currentPlayers.length > 0) {
        if (currentPlayers[0].userId === currentUserId) {
          setPlayerSymbol('X');
        } else if (currentPlayers.length > 1 && currentPlayers[1].userId === currentUserId) {
          setPlayerSymbol('O');
        } else {
          setPlayerSymbol(null); // Spectator
        }
      }
    };

    /**
     * Handles incoming game state updates.
     * @param {any} payload - The payload containing the updated game state.
     */
    const handleGameUpdate = (payload: any): void => {
      const { board: newBoard, isXNext: newIsXNext, winner: newWinner } = payload.payload;
      setBoard(newBoard);
      setIsXNext(newIsXNext);
      setWinner(newWinner);
    };

    /** Handles incoming game reset requests. */
    const handleGameReset = (): void => {
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setWinner(null);
    };

    channel.on('presence', { event: 'sync' }, handlePresenceSync);
    channel.on('broadcast', { event: EVENT_GAME_UPDATE }, handleGameUpdate);
    channel.on('broadcast', { event: EVENT_GAME_RESET }, handleGameReset);

    // Track presence for this game instance
    channel.track({
      userId: currentUserId,
      username: username,
      joined_at: new Date().getTime()
    });

    return () => {
      channel.untrack({ userId: currentUserId }); // Use captured userId for untrack
      channel.off('presence', { event: 'sync' }, handlePresenceSync);
      channel.off('broadcast', { event: EVENT_GAME_UPDATE }, handleGameUpdate);
      channel.off('broadcast', { event: EVENT_GAME_RESET }, handleGameReset);
    };
  }, [channel, username, calculateWinner]); // Added calculateWinner to dependencies

  /**
   * Handles a click on a square of the game board.
   * @param {number} index - The index of the clicked square.
   */
  const handleClick = useCallback((index: number): void => {
    if (
      board[index] ||
      (isXNext && playerSymbol !== 'X') ||
      (!isXNext && playerSymbol !== 'O') ||
      winner ||
      players.length < 2
    ) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    const newWinner = calculateWinner(newBoard);

    // Optimistic update
    setBoard(newBoard);
    setIsXNext(!isXNext);
    if (newWinner) {
      setWinner(newWinner);
    }

    channel.send({
      type: 'broadcast',
      event: EVENT_GAME_UPDATE,
      payload: {
        board: newBoard,
        isXNext: !isXNext,
        winner: newWinner,
      },
    });
  }, [board, isXNext, playerSymbol, winner, players.length, channel, calculateWinner]);

  /** Resets the game to its initial state. */
  const resetGame = useCallback((): void => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    channel.send({
      type: 'broadcast',
      event: EVENT_GAME_RESET,
      payload: {},
    });
  }, [channel]);

  /**
   * Returns the current status message of the game.
   * @returns {string} The status message.
   */
  const getStatusMessage = useCallback((): string => {
    if (winner) {
      return `Winner: ${winner}`;
    } else if (board.every(square => square !== null)) {
      return 'Draw!';
    } else if (players.length < 2) {
      return 'Waiting for another player...';
    } else {
      return `Next player: ${isXNext ? 'X' : 'O'}${
        ((isXNext && playerSymbol === 'X') || (!isXNext && playerSymbol === 'O'))
          ? ' (Your turn)'
          : ''
      }`;
    }
  }, [winner, board, players.length, isXNext, playerSymbol]);

  return (
    <div className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Tic Tac Toe</h3>
      <div className="flex gap-2 mb-4 w-full justify-center">
        {players.map((player, index) => (
          <div
            key={player.userId}
            className={`
              flex flex-1 items-center justify-center gap-2 px-4 py-2
              ${(isXNext && index === 0) || (!isXNext && index === 1)
                ? 'bg-neutral-700'
                : 'bg-neutral-800'
              }
              rounded-md w-full text-neutral-300 text-sm transition-all
            `}
          >
            <span className="truncate">{player.userId === userIdRef.current ? 'You' : player.username}</span>
            <span className={`${index === 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {index === 0 ? (
                <X className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </span>
          </div>
        ))}
      </div>

      {(winner || board.every(square => square !== null)) && (
        <div className="mb-6 text-neutral-300 text-lg font-medium">
          {getStatusMessage()}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-lg">
        {board.map((square, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`
              w-20 h-20 flex items-center justify-center text-4xl font-bold
              bg-neutral-800 hover:bg-neutral-700
              border border-neutral-700
              ${
                ((isXNext && playerSymbol === 'X') || (!isXNext && playerSymbol === 'O')) &&
                !square &&
                !winner
                  ? 'cursor-pointer'
                  : 'cursor-not-allowed'
              }
              ${square === 'X' ? 'text-blue-400' : square === 'O' ? 'text-red-400' : 'text-neutral-700'}
              ${index === 0 ? 'rounded-tl-lg' : ''}
              ${index === 2 ? 'rounded-tr-lg' : ''}
              ${index === 6 ? 'rounded-bl-lg' : ''}
              ${index === 8 ? 'rounded-br-lg' : ''}
            `}
            disabled={
              !!square ||
              (isXNext && playerSymbol !== 'X') ||
              (!isXNext && playerSymbol !== 'O') ||
              !!winner ||
              players.length < 2
            }
          >
            {square === 'X' ? (
              <X className="w-12 h-12" />
            ) : square === 'O' ? (
              <Circle className="w-12 h-12" />
            ) : null}
          </button>
        ))}
      </div>

      <Button
        onClick={resetGame}
        className="px-6 mt-4 w-full py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-md transition-colors"
      >
        Reset Game
      </Button>
      <Button
        onClick={onGameEnd}
        className="px-6 mt-2 w-full py-2 bg-red-600 hover:bg-red-700 text-neutral-100 rounded-md transition-colors"
      >
        End Game
      </Button>
    </div>
  );
};
