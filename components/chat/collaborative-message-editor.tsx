'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as Y from 'yjs';
import 'quill/dist/quill.bubble.css'; // Using bubble theme without toolbar
import { Button } from '@/components/ui/button';

const Quill = dynamic(() => import('quill').then((mod) => mod.default || mod), { ssr: false });

interface CollaborativeMessageEditorProps {
  /** The initial content of the message to be edited. */
  initialContent: string;
  /** The unique ID of the message being edited. */
  messageId: string;
  /** The Supabase Realtime Channel instance for broadcasting updates. */
  channel: any;
  /** The ID of the current sender. */
  senderId: string;
  /** Callback function to be called when the edited content is saved. */
  onSave: (content: string) => void;
  /** Callback function to be called when the editing is canceled. */
  onCancel: () => void;
}

/**
 * A collaborative text editor component for editing chat messages in real-time.
 * It uses Quill for the rich text editor and YJS for CRDT-based synchronization
 * via Supabase Realtime broadcast channel.
 */
export const CollaborativeMessageEditor = ({
  initialContent,
  messageId,
  channel,
  senderId,
  onSave,
  onCancel,
}: CollaborativeMessageEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<typeof Quill | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isLocalChangeRef = useRef<boolean>(false);
  const [currentContent, setCurrentContent] = useState<string>(initialContent);

  /**
   * Handles incoming broadcast updates for the document.
   * @param {any} payload - The payload containing the update.
   */
  const handleBroadcast = useCallback((payload: any): void => {
    if (payload.payload.messageId !== messageId || payload.payload.sender === senderId) return;

    const ydoc = ydocRef.current;
    const quill = quillRef.current;
    if (!ydoc || !quill) return;

    const update = new Uint8Array(Object.values(payload.payload.update));
    isLocalChangeRef.current = true;
    Y.applyUpdate(ydoc, update);
    
    const ytext = ydoc.getText('quill');
    const newContent = ytext.toString();
    if (newContent !== quill.getText()) {
      quill.setText(newContent);
    }
    isLocalChangeRef.current = false;
  }, [messageId, senderId]); // Dependencies for useCallback

  useEffect(() => {
    if (!editorRef.current) return;

    const quill = new (Quill as any)(editorRef.current, {
      placeholder: 'Edit your message...',
      theme: 'bubble',
      formats: [],
      modules: {
        clipboard: true,
        toolbar: false,
      },
    });

    // Apply dark theme styles to Quill editor
    editorRef.current.style.color = 'rgb(229, 229, 229)'; // text-neutral-200
    const editorElement = editorRef.current.querySelector('.ql-editor');
    if (editorElement instanceof HTMLElement) {
      editorElement.style.cssText = `
        height: 100%;
        min-height: 80px;
        font-size: 16px;
        padding: 1rem;
        font-family: 'Inter', sans-serif;
      `;
    }

    quill.setText(initialContent);
    quillRef.current = quill;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText('quill');

    channel.on('broadcast', { event: `message-update-${messageId}` }, handleBroadcast);

    // Listen for Quill text changes and broadcast them
    quill.on('text-change', (delta: any, oldDelta: any, source: string) => {
      if (source !== 'user' || isLocalChangeRef.current) return;

      ytext.delete(0, ytext.length);
      ytext.insert(0, quill.getText());

      const update = Y.encodeStateAsUpdate(ydoc);
      const updateObj: { [key: number]: number } = {};
      update.forEach((value, index) => {
        updateObj[index] = value;
      });

      channel.send({
        type: 'broadcast',
        event: `message-update-${messageId}`,
        payload: {
          update: updateObj,
          sender: senderId,
          messageId: messageId,
        },
      });
      setCurrentContent(quill.getText());
    });

    return () => {
      channel.off('broadcast', { event: `message-update-${messageId}` }, handleBroadcast);
    };
  }, [initialContent, messageId, channel, senderId, handleBroadcast]); // Added handleBroadcast to dependencies

  /** Handles saving the current content. */
  const handleSave = useCallback((): void => {
    onSave(currentContent);
  }, [currentContent, onSave]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div ref={editorRef} className="w-full bg-background text-foreground border border-border rounded-md"></div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="default" size="sm" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};
