"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react"; // Import React for React.ChangeEvent

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

export function ChatInput({ value, onChange, isLoading }: ChatInputProps) {
  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Type your message..."
        value={value}
        onChange={onChange}
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}

