import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Save, X, Smile } from 'lucide-react'
import { CollaborativeMessageEditor } from './chat/collaborative-message-editor'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EMOJIS } from '@/lib/constants'

interface ChatMessageItemProps {
  /** The chat message object. */
  message: ChatMessage
  /** True if the message was sent by the current user. */
  isOwnMessage: boolean
  /** True if the message header (sender name and timestamp) should be shown. */
  showHeader: boolean
  /** The Supabase Realtime Channel instance. */
  channel: any;
  /** The ID of the current sender. */
  senderId: string;
  /** Callback function to update a message's content. */
  onMessageUpdate: (messageId: string, newContent: string) => void;
  /** Callback function to add a reaction to a message. */
  onAddReaction: (messageId: string, emoji: string) => void;
}

/**
 * Renders a single chat message, with options for editing and reactions.
 */
export const ChatMessageItem = ({ message, isOwnMessage, showHeader, channel, senderId, onMessageUpdate, onAddReaction }: ChatMessageItemProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)

  /** Handles clicking the edit button. */
  const handleEditClick = useCallback((): void => {
    setIsEditing(true)
  }, []);

  /**
   * Handles saving the edited message content.
   * @param {string} newContent - The new content of the message.
   */
  const handleSave = useCallback((newContent: string): void => {
    onMessageUpdate(message.id, newContent);
    setIsEditing(false)
  }, [message.id, onMessageUpdate]);

  /** Handles canceling the edit operation. */
  const handleCancel = useCallback((): void => {
    setIsEditing(false)
  }, []);

  /**
   * Handles clicking an emoji to add a reaction.
   * @param {string} emoji - The emoji to add.
   */
  const handleEmojiClick = useCallback((emoji: string): void => {
    onAddReaction(message.id, emoji);
  }, [message.id, onAddReaction]);

  return (
    <div className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn('max-w-[75%] w-fit flex flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn('flex items-center gap-2 text-xs px-3', {
              'justify-end flex-row-reverse': isOwnMessage,
            })}
          >
            <span className={'font-medium'}>{message.user.name}</span>
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
            {isOwnMessage && !isEditing && (
              <Button variant="ghost" size="icon" onClick={handleEditClick} className="h-6 w-6">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <div
          className={cn(
            'py-2 px-3 rounded-xl text-sm w-fit relative', // Added relative for absolute positioning of reactions
            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          )}
        >
          {isEditing ? (
            <CollaborativeMessageEditor
              initialContent={message.content}
              messageId={message.id}
              channel={channel}
              senderId={senderId}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <p>{message.content}</p>
          )}

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="absolute -bottom-3 right-2 flex gap-1 bg-background rounded-full px-2 py-0.5 shadow-md border border-border">
              {Object.entries(message.reactions).map(([emoji, reactors]) => (
                <div key={emoji} className="flex items-center text-xs">
                  <span>{emoji}</span>
                  <span className="ml-1 text-muted-foreground">{reactors.length}</span>
                </div>
              ))}
            </div>
          )}

          {/* Emoji Picker Trigger */}
          {!isEditing && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-background border border-border shadow-md">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1 flex flex-wrap gap-1">
                {EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="text-lg p-2 h-auto"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  )
}
