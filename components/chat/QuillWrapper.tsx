import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css';

interface QuillWrapperProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export default function QuillWrapper({ initialContent, onChange }: QuillWrapperProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const quill = new Quill(editorRef.current, {
      placeholder: 'Edit your message...',
      theme: 'bubble',
      modules: { toolbar: false },
    });
    quill.setText(initialContent);
    quillRef.current = quill;

    quill.on('text-change', () => {
      onChange(quill.getText());
    });

    return () => {
      quill.off('text-change');
    };
  }, [initialContent, onChange]);

  return <div ref={editorRef} className="w-full" />;
}
