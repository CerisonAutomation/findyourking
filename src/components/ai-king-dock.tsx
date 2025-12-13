'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useChat } from 'ai/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CrownIcon } from './logo';

export function AiKingDock() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  const orbVariants = {
    closed: {
      scale: 1,
      boxShadow: '0 0 20px 0px hsl(var(--primary) / 0.6)',
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
    open: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const panelVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: '5vh',
      transition: { duration: 0.3, ease: 'easeIn' },
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  };

  return (
    <>
      {/* Floating Action Button / Orb */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            variants={orbVariants}
            initial="closed"
            animate="closed"
            exit="open"
          >
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-primary/80 backdrop-blur-md shadow-king-lg"
              onClick={() => setIsOpen(true)}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 10,
                  ease: 'linear',
                }}
              >
                <CrownIcon className="size-8 text-primary-foreground" />
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative flex h-[90vh] w-[90vw] max-w-2xl flex-col rounded-2xl border border-primary/20 bg-black/50 shadow-2xl shadow-primary/20"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-primary/20 p-4">
                <div className="flex items-center gap-3">
                  <Bot className="text-primary" />
                  <h2 className="text-lg font-bold">Counsel with the King</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X />
                </Button>
              </div>

              {/* Chat Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {messages.map((m, i) => (
                    <motion.div
                      key={m.id}
                      className={cn(
                        'flex items-start gap-3',
                        m.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {m.role === 'assistant' && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CrownIcon className="size-5" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-md rounded-lg p-3 text-sm',
                          m.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                     <div className="flex items-start gap-3">
                         <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <CrownIcon className="size-5" />
                        </div>
                        <div className="max-w-md bg-muted rounded-lg p-3 flex items-center">
                            <Loader2 className="animate-spin size-5"/>
                        </div>
                     </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Form */}
              <div className="border-t border-primary/20 p-4">
                <form
                  onSubmit={handleSubmit}
                  className="relative flex items-center"
                >
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask your King..."
                    className="h-12 flex-1 pr-14"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
                    disabled={isLoading}
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
