"use client";

interface ChatMessage {
  id: string; // Add a unique ID for each message
  role: "user" | "assistant";
  content: string;
}

export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <div
          key={message.id} // Use the unique ID as the key
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`p-3 rounded-lg max-w-xs ${
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <p>{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

