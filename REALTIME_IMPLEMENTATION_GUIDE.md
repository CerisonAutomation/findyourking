# Realtime Implementation Guide

## Overview

This guide documents the enhanced realtime system based on `@supabase/realtime-js` best practices. The implementation provides enterprise-grade realtime features including:

✅ Connection state management
✅ Automatic reconnection with exponential backoff
✅ Offline message queuing
✅ Presence tracking with CRDT sync
✅ Typing indicators
✅ Comprehensive error handling
✅ Connection health monitoring

---

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Usage Examples](#usage-examples)
4. [Best Practices](#best-practices)
5. [Migration Guide](#migration-guide)
6. [Troubleshooting](#troubleshooting)

---

## Architecture

### Component Hierarchy

```
┌─────────────────────────────────────┐
│  RealtimeConnectionManager          │  ← Singleton connection manager
│  - Connection state tracking        │
│  - Channel lifecycle management     │
│  - Message queue for offline mode   │
│  - Exponential backoff reconnection │
└──────────────┬──────────────────────┘
               │
               ├──► useRealtimeChat         ← Chat-specific hook
               ├──► useRealtimeSubscription ← Generic subscription hook
               └──► ConnectionStatus        ← UI component
```

### Connection States

```typescript
type ConnectionState =
  | 'disconnected'  // No connection
  | 'connecting'    // Initial connection attempt
  | 'connected'     // Successfully connected
  | 'reconnecting'  // Lost connection, retrying
  | 'error'         // Connection failed

type ChannelState =
  | 'closed'   // Channel not active
  | 'joining'  // Subscription in progress
  | 'joined'   // Successfully subscribed
  | 'leaving'  // Unsubscribing
  | 'errored'  // Subscription failed
```

---

## Core Components

### 1. RealtimeConnectionManager

**Location:** `lib/realtime/connection-manager.ts`

#### Features

- ✅ Singleton pattern for app-wide connection management
- ✅ Automatic channel reuse to prevent duplicate connections
- ✅ Message buffering for offline scenarios
- ✅ Exponential backoff: `[1s, 2s, 5s, 10s, 30s]`
- ✅ Heartbeat monitoring every 25 seconds
- ✅ Maximum 100 queued messages per channel
- ✅ State change event listeners

#### Basic Usage

```typescript
import { realtimeConnectionManager } from '@/lib/realtime/connection-manager';

// Subscribe to connection state changes
const unsubscribe = realtimeConnectionManager.onStateChange((state) => {
  console.log('Connection state:', state);
});

// Get or create a channel
const channel = await realtimeConnectionManager.getChannel('chat:room-123', {
  config: {
    broadcast: { self: false, ack: false },
    presence: { key: userId },
  },
});

// Send message with offline queue support
await realtimeConnectionManager.send(
  'chat:room-123',
  'new-message',
  { content: 'Hello' },
  { retry: true }
);

// Check connection status
const isConnected = realtimeConnectionManager.isConnected();
const pendingCount = realtimeConnectionManager.getPendingMessageCount('chat:room-123');

// Cleanup
await realtimeConnectionManager.cleanup();
```

---

### 2. useRealtimeChat Hook

**Location:** `hooks/useRealtimeChat.ts`

#### Features

- ✅ Complete chat functionality
- ✅ Typing indicators with auto-timeout
- ✅ Read receipts
- ✅ Presence tracking
- ✅ Offline message queue
- ✅ Automatic reconnection
- ✅ Duplicate message prevention

#### Example

```tsx
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { ConnectionStatus } from '@/components/realtime/ConnectionStatus';

function ChatPage({ matchId, currentUserId, otherUser }) {
  const {
    messages,
    loading,
    error,
    connectionState,
    typingUsers,
    isTyping,
    sendMessage,
    updateTypingStatus,
    retryConnection,
    isConnected,
    pendingMessageCount,
  } = useRealtimeChat({
    matchId,
    currentUserId,
    enablePresence: true,
    enableTypingIndicators: true,
  });

  return (
    <div>
      {/* Connection status banner */}
      <ConnectionStatus
        connectionState={connectionState}
        pendingMessageCount={pendingMessageCount}
        onRetry={retryConnection}
        error={error}
      />

      {/* Messages */}
      <div>
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div>{typingUsers[0].userName} is typing...</div>
      )}

      {/* Input */}
      <input
        onChange={(e) => {
          updateTypingStatus(true, 'Current User');
        }}
        onBlur={() => updateTypingStatus(false)}
      />

      <button
        onClick={() => sendMessage('Hello!', otherUser.id)}
        disabled={!isConnected}
      >
        Send {pendingMessageCount > 0 && `(${pendingMessageCount} queued)`}
      </button>
    </div>
  );
}
```

---

### 3. useRealtimeSubscription Hook

**Location:** `hooks/useRealtimeSubscription.ts`

#### Features

- ✅ Generic database subscription
- ✅ Event-specific callbacks (INSERT, UPDATE, DELETE)
- ✅ TypeScript generics for type safety
- ✅ Automatic retry logic
- ✅ State tracking
- ✅ Detailed logging option

#### Example

```tsx
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  is_active: boolean;
}

function MatchesPage({ userId }: { userId: string }) {
  const [matches, setMatches] = useState<Match[]>([]);

  const { isSubscribed, connectionState, retry } = useRealtimeSubscription<Match>(
    'matches',
    `user1_id=eq.${userId}`,
    {
      onInsert: (payload) => {
        setMatches(prev => [...prev, payload.new!]);
      },
      onUpdate: (payload) => {
        setMatches(prev =>
          prev.map(m => m.id === payload.new!.id ? payload.new! : m)
        );
      },
      onDelete: (payload) => {
        setMatches(prev => prev.filter(m => m.id !== payload.old!.id));
      },
      onError: (error) => {
        console.error('Subscription error:', error);
      },
      enableLogging: process.env.NODE_ENV === 'development',
    }
  );

  return (
    <div>
      <ConnectionDot connectionState={connectionState} />
      {!isSubscribed && <button onClick={retry}>Retry</button>}
      {/* Render matches */}
    </div>
  );
}
```

---

### 4. ConnectionStatus Component

**Location:** `components/realtime/ConnectionStatus.tsx`

#### Variants

**Full Banner (Error/Disconnected)**
```tsx
<ConnectionStatus
  connectionState={connectionState}
  error={error}
  pendingMessageCount={5}
  onRetry={retryConnection}
/>
```

**Compact Indicator**
```tsx
<ConnectionStatus
  connectionState={connectionState}
  minimal={false}
  showDetails={true}
  channelState={channelState}
/>
```

**Minimal Icon Only**
```tsx
<ConnectionStatus
  connectionState={connectionState}
  minimal={true}
/>
```

**Simple Dot Indicator**
```tsx
<ConnectionDot connectionState={connectionState} />
```

---

## Best Practices

### 1. Connection Management

✅ **DO**: Use the singleton `realtimeConnectionManager`
```typescript
import { realtimeConnectionManager } from '@/lib/realtime/connection-manager';
```

❌ **DON'T**: Create multiple connection managers
```typescript
// Bad - creates duplicate connections
const manager1 = new RealtimeConnectionManager();
const manager2 = new RealtimeConnectionManager();
```

### 2. Channel Naming

✅ **DO**: Use consistent, descriptive names
```typescript
const channelName = `chat:${matchId}`;
const channelName = `notifications:${userId}`;
const channelName = `presence:${roomId}`;
```

❌ **DON'T**: Use generic or random names
```typescript
const channelName = `channel-${Math.random()}`; // Bad
```

### 3. Cleanup

✅ **DO**: Clean up subscriptions on unmount
```tsx
useEffect(() => {
  const channel = setupChannel();

  return () => {
    realtimeConnectionManager.removeChannel(channelName);
  };
}, []);
```

❌ **DON'T**: Forget cleanup (causes memory leaks)

### 4. Error Handling

✅ **DO**: Handle all connection states
```tsx
if (connectionState === 'error') {
  return <ErrorView onRetry={retryConnection} />;
}
if (connectionState === 'reconnecting') {
  return <ReconnectingBanner />;
}
```

❌ **DON'T**: Assume always connected

### 5. Offline Support

✅ **DO**: Show pending message count
```tsx
<button disabled={!isConnected}>
  Send {pendingMessageCount > 0 && `(${pendingMessageCount} queued)`}
</button>
```

✅ **DO**: Inform users about queued messages
```tsx
{pendingMessageCount > 0 && (
  <Alert>Messages will be sent when connection is restored</Alert>
)}
```

---

## Migration Guide

### From Old Implementation

**Before:**
```typescript
// Old basic implementation
const channel = supabase.channel('chat')
  .on('postgres_changes', { event: 'INSERT', ... }, callback)
  .subscribe();

// No reconnection handling
// No state tracking
// No offline support
```

**After:**
```typescript
// New enhanced implementation
const { messages, connectionState, isConnected, pendingMessageCount } = useRealtimeChat({
  matchId,
  currentUserId,
  enablePresence: true,
});

// ✅ Automatic reconnection
// ✅ State tracking
// ✅ Offline message queue
// ✅ Typing indicators
```

### Step-by-Step Migration

1. **Replace direct Supabase calls**
   ```typescript
   // Before
   const supabase = createClient();
   const channel = supabase.channel('...');

   // After
   import { realtimeConnectionManager } from '@/lib/realtime/connection-manager';
   const channel = await realtimeConnectionManager.getChannel('...');
   ```

2. **Update state management**
   ```typescript
   // Before
   const [connected, setConnected] = useState(false);

   // After
   const { connectionState, isConnected } = useRealtimeChat({...});
   ```

3. **Add UI feedback**
   ```tsx
   // After
   <ConnectionStatus
     connectionState={connectionState}
     onRetry={retryConnection}
   />
   ```

---

## Troubleshooting

### Connection Not Establishing

**Symptoms:** `connectionState` stuck on `'connecting'`

**Solutions:**
1. Check Supabase Realtime is enabled in dashboard
2. Verify API key permissions
3. Check browser console for WebSocket errors
4. Ensure Supabase URL is correct

```typescript
// Enable logging to debug
const manager = new RealtimeConnectionManager({
  enableLogging: true
});
```

### Messages Not Appearing

**Symptoms:** `sendMessage` succeeds but messages don't appear

**Solutions:**
1. Verify channel subscription is active (`isSubscribed === true`)
2. Check Postgres changes are enabled for the table
3. Verify RLS policies allow SELECT
4. Check message filter matches

```typescript
// Check subscription status
console.log('Subscribed:', isSubscribed);
console.log('Channel state:', channelState);
```

### Rapid Reconnection Loops

**Symptoms:** Constant reconnection attempts

**Solutions:**
1. Check for authentication token expiration
2. Verify network stability
3. Increase reconnection intervals if needed

```typescript
const manager = new RealtimeConnectionManager({
  reconnectIntervals: [2000, 5000, 10000, 30000, 60000], // Longer intervals
});
```

### Memory Leaks

**Symptoms:** Performance degradation over time

**Solutions:**
1. Ensure cleanup functions are called
2. Remove event listeners on unmount
3. Use `realtimeConnectionManager.cleanup()` when done

```tsx
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    realtimeConnectionManager.removeChannel(channelName);
  };
}, [channelName]);
```

---

## Advanced Features

### Custom Reconnection Strategy

```typescript
const manager = new RealtimeConnectionManager({
  maxReconnectAttempts: 10,
  reconnectIntervals: [1000, 2000, 5000, 10000, 30000],
  heartbeatInterval: 30000,
  enableLogging: true,
});
```

### Multiple Channel Management

```typescript
// Chat channel
const chatChannel = await realtimeConnectionManager.getChannel('chat:123');

// Presence channel
const presenceChannel = await realtimeConnectionManager.getChannel('presence:123', {
  config: { presence: { key: userId } }
});

// Notifications channel
const notifChannel = await realtimeConnectionManager.getChannel('notifications:user-123');

// All channels share the same connection and benefit from reconnection logic
```

### Presence Tracking

```typescript
const { connectionState } = useRealtimeChat({
  matchId,
  currentUserId,
  enablePresence: true, // Enable presence tracking
});

// Access presence state via channel
const channel = await realtimeConnectionManager.getChannel(channelName);
const presenceState = channel.presenceState();

// Track user presence
await channel.track({
  userId: currentUserId,
  online: true,
  lastSeen: new Date().toISOString(),
});
```

---

## Performance Considerations

### Message Queue Size

The connection manager limits queued messages to **100 per channel**. Oldest messages are dropped if this limit is exceeded.

### Channel Reuse

Channels are automatically reused. Multiple subscriptions to the same channel name share a single WebSocket connection.

### Heartbeat Frequency

Default: 25 seconds. Adjust based on your needs:

```typescript
const manager = new RealtimeConnectionManager({
  heartbeatInterval: 15000, // More frequent (higher bandwidth)
  // OR
  heartbeatInterval: 60000, // Less frequent (lower bandwidth)
});
```

---

## Testing

### Unit Tests

```typescript
import { realtimeConnectionManager } from '@/lib/realtime/connection-manager';

describe('RealtimeConnectionManager', () => {
  it('should track connection state', async () => {
    let state: ConnectionState = 'disconnected';

    realtimeConnectionManager.onStateChange((newState) => {
      state = newState;
    });

    const channel = await realtimeConnectionManager.getChannel('test');
    expect(state).toBe('connecting');
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(state).toBe('connected');
  });
});
```

### Integration Tests

```typescript
describe('Chat Integration', () => {
  it('should handle offline message queue', async () => {
    const { sendMessage, pendingMessageCount } = useRealtimeChat({
      matchId: 'test-123',
      currentUserId: 'user-1',
    });

    // Simulate offline
    await realtimeConnectionManager.cleanup();

    // Send message while offline
    await sendMessage('Hello', 'user-2');

    // Check queue
    expect(pendingMessageCount).toBe(1);

    // Reconnect
    await realtimeConnectionManager.getChannel('chat:test-123');

    // Queue should flush
    await waitFor(() => {
      expect(pendingMessageCount).toBe(0);
    });
  });
});
```

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
3. Check browser console for detailed error logs (with `enableLogging: true`)

---

## Changelog

### v2.0.0 (Current)
- ✨ Enhanced connection manager with exponential backoff
- ✨ Offline message queue
- ✨ Comprehensive state tracking
- ✨ Presence system with CRDT sync
- ✨ Typing indicators
- ✨ Connection status UI components
- 🐛 Fixed memory leaks from improper cleanup
- 🐛 Fixed duplicate message issues
- 🐛 Fixed reconnection failures

### v1.0.0 (Legacy)
- Basic realtime subscriptions
- No reconnection handling
- No offline support
- Limited error handling

---

## License

This implementation follows @supabase/realtime-js patterns and is MIT licensed.
