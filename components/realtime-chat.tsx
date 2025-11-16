import { cn } from '@/lib/utils'
import { ChatMessageItem } from '@/components/chat-message' // Import ChatMessageItem
import { useChatScroll } from '@/hooks/use-chat-scroll'
import {
  type ChatMessage,
  useRealtimeChat,
} from '@/hooks/use-realtime-chat'
import { Button } from '@/components/ui/button' // Import Button
import { Input } from '@/components/ui/input' // Import Input
import { Send, Gamepad2 } from 'lucide-react' // Import Gamepad2 icon
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RealtimeAvatarStack } from './realtime-avatar-stack'
import { TicTacToeGame } from './chat/tic-tac-toe-game' // Import TicTacToeGame

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll()

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    channel, // Access the channel from the hook
    updateMessageContent, // New function to update message content
    addReaction, // New function to add reactions
  } = useRealtimeChat({
    roomName,
    username,
  })
  const [newMessage, setNewMessage] = useState('')
  const [isGameActive, setIsGameActive] = useState(false) // State to manage game activity

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages]
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    return sortedMessages
  }, [initialMessages, realtimeMessages])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom()
  }, [allMessages, scrollToBottom])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !isConnected) return

      sendMessage(newMessage)
      setNewMessage('')
    },
    [newMessage, isConnected, sendMessage]
  )

  const handleMessageUpdate = useCallback(
    (messageId: string, newContent: string) => {
      if (!isConnected || !channel) return;
      updateMessageContent(messageId, newContent);
    },
    [isConnected, channel, updateMessageContent]
  );

  const handleAddReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!isConnected || !channel) return;
      addReaction(messageId, emoji);
    },
    [isConnected, channel, addReaction]
  );

  const handleInitiateGame = useCallback(() => {
    if (!isConnected || !channel) return;
    setIsGameActive(true);
    // Optionally broadcast game initiation to other users
    channel.send({
      type: 'broadcast',
      event: 'tictactoe_game_initiate',
      payload: {
        initiator: username,
        room: roomName,
      },
    });
  }, [isConnected, channel, username, roomName]);

  const handleGameEnd = useCallback(() => {
    setIsGameActive(false);
    // Optionally broadcast game end
    channel.send({
      type: 'broadcast',
      event: 'tictactoe_game_end',
      payload: {
        room: roomName,
      },
    });
  }, [channel, roomName]);

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground antialiased">
      {/* Header with online users */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Chat Room: {roomName}</h2>
        <RealtimeAvatarStack roomName={roomName} />
      </div>

      {/* Messages or Game */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isGameActive ? (
          <TicTacToeGame
            channel={channel}
            username={username}
            roomName={roomName}
            onGameEnd={handleGameEnd}
          />
        ) : (
          <>
            {allMessages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : null}
            <div className="space-y-1">
              {allMessages.map((message, index) => {
                const prevMessage = index > 0 ? allMessages[index - 1] : null
                const showHeader = !prevMessage || prevMessage.user.name !== message.user.name

                return (
                  <div
                    key={message.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                  >
                    <ChatMessageItem
                      message={message}
                      isOwnMessage={message.user.name === username}
                      showHeader={showHeader}
                      channel={channel} // Pass channel
                      senderId={username} // Pass username as senderId
                      onMessageUpdate={handleMessageUpdate} // Pass update handler
                      onAddReaction={handleAddReaction} // Pass addReaction handler
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-border p-4">
        {!isGameActive && ( // Only show input if game is not active
          <Input
            className={cn(
              'rounded-full bg-background text-sm transition-all duration-300',
              isConnected && newMessage.trim() ? 'w-[calc(100%-36px)]' : 'w-full'
            )}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
        )}
        {isConnected && newMessage.trim() && !isGameActive && ( // Only show send button if game is not active
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
            disabled={!isConnected}
          >
            <Send className="size-4" />
          </Button>
        )}
        {!isGameActive && ( // Show game initiate button if game is not active
          <Button
            className="aspect-square rounded-full"
            type="button"
            onClick={handleInitiateGame}
            disabled={!isConnected}
            title="Start Tic Tac Toe Game"
          >
            <Gamepad2 className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
