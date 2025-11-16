'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useState } from 'react'

/**
 * Props for the useRealtimeChat hook.
 */
interface UseRealtimeChatProps {
  /** The name of the chat room. */
  roomName: string
  /** The username of the current user. */
  username: string
}

/**
 * Represents a single chat message.
 */
export interface ChatMessage {
  /** Unique ID of the message. */
  id: string
  /** Content of the message. */
  content: string
  /** User who sent the message. */
  user: {
    name: string
  }
  /** ISO string of when the message was created. */
  createdAt: string
  /** Optional reactions to the message, mapping emoji to a list of usernames. */
  reactions?: { [emoji: string]: string[] }
}

const EVENT_MESSAGE_TYPE = 'message'
const EVENT_MESSAGE_UPDATE_TYPE = 'message_update'
const EVENT_MESSAGE_REACTION_TYPE = 'message_reaction'

/**
 * A custom React hook for managing real-time chat functionality using Supabase Realtime.
 * It handles sending, receiving, updating messages, and managing reactions.
 *
 * @param {UseRealtimeChatProps} { roomName, username } - The chat room name and current username.
 * @returns {{
 *   messages: ChatMessage[],
 *   sendMessage: (content: string) => Promise<void>,
 *   isConnected: boolean,
 *   channel: ReturnType<typeof supabase.channel> | null,
 *   updateMessageContent: (messageId: string, newContent: string) => Promise<void>,
 *   addReaction: (messageId: string, emoji: string) => Promise<void>
 * }} The chat state and functions to interact with it.
 */
export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    const newChannel = supabase.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage])
      })
      .on('broadcast', { event: EVENT_MESSAGE_UPDATE_TYPE }, (payload) => {
        const { messageId, newContent } = payload.payload as { messageId: string; newContent: string };
        setMessages((current) =>
          current.map((msg) => (msg.id === messageId ? { ...msg, content: newContent } : msg))
        );
      })
      .on('broadcast', { event: EVENT_MESSAGE_REACTION_TYPE }, (payload) => {
        const { messageId, emoji, reactor } = payload.payload as { messageId: string; emoji: string; reactor: string };
        setMessages((current) =>
          current.map((msg) => {
            if (msg.id === messageId) {
              const newReactions = { ...msg.reactions };
              if (!newReactions[emoji]) {
                newReactions[emoji] = [];
              }
              if (!newReactions[emoji].includes(reactor)) {
                newReactions[emoji].push(reactor);
              } else {
                // Remove reaction if already present (toggle)
                newReactions[emoji] = newReactions[emoji].filter(name => name !== reactor);
                if (newReactions[emoji].length === 0) {
                  delete newReactions[emoji];
                }
              }
              return { ...msg, reactions: newReactions };
            }
            return msg;
          })
        );
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [roomName, username, supabase])

  /**
   * Sends a new chat message to the channel.
   * @param {string} content - The content of the message.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!channel || !isConnected) return

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          name: username,
        },
        createdAt: new Date().toISOString(),
        reactions: {}, // Initialize reactions
      }

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, username]
  )

  /**
   * Updates the content of an existing message and broadcasts the change.
   * @param {string} messageId - The ID of the message to update.
   * @param {string} newContent - The new content for the message.
   */
  const updateMessageContent = useCallback(
    async (messageId: string, newContent: string): Promise<void> => {
      if (!channel || !isConnected) return;

      // Update local state immediately
      setMessages((current) =>
        current.map((msg) => (msg.id === messageId ? { ...msg, content: newContent } : msg))
      );

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_UPDATE_TYPE,
        payload: { messageId, newContent },
      });
    },
    [channel, isConnected]
  );

  /**
   * Adds or removes a reaction to a message and broadcasts the change.
   * @param {string} messageId - The ID of the message to react to.
   * @param {string} emoji - The emoji to add or remove.
   */
  const addReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!channel || !isConnected) return;

      // Update local state immediately (optimistic update)
      setMessages((current) =>
        current.map((msg) => {
          if (msg.id === messageId) {
            const newReactions = { ...msg.reactions };
            if (!newReactions[emoji]) {
              newReactions[emoji] = [];
            }
            if (!newReactions[emoji].includes(username)) {
              newReactions[emoji].push(username);
            } else {
              // Remove reaction if already present (toggle)
              newReactions[emoji] = newReactions[emoji].filter(name => name !== username);
              if (newReactions[emoji].length === 0) {
                delete newReactions[emoji];
              }
            }
            return { ...msg, reactions: newReactions };
          }
          return msg;
        })
      );

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_REACTION_TYPE,
        payload: { messageId, emoji, reactor: username },
      });
    },
    [channel, isConnected, username]
  );

  return { messages, sendMessage, isConnected, channel, updateMessageContent, addReaction }
}
