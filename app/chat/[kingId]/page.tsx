"use client";

import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ChatPage({
  params,
}: {
  params: { kingId: string };
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          kingId: params.kingId,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to send message");
      
      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Chat with King {params.kingId} {/* Display kingId */}
        </h1>
        <Link href="/kings">
          <Button variant="outline" className="text-primary-foreground border-primary-foreground">
            Back to Kings
          </Button>
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessages messages={messages} />
        {error && ( // Display error message
          <div className="text-red-500 p-4">
            Error: {error.message}
          </div>
        )}
      </div>
      <footer className="p-4 border-t">
        <form onSubmit={handleSubmit}>
          <ChatInput
            value={input}
            onChange={handleInputChange}
            isLoading={isLoading}
          />
        </form>
      </footer>
    </div>
  );
}
