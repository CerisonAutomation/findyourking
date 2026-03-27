// ✅ CORRECT — Trystero v0.22 P2P Implementation
import {joinRoom, selfId} from 'trystero'

interface P2PConfig {
    appId: string;
    maxPeers?: number;
}

interface ChatAction {
    type: 'text' | 'image' | 'typing' | 'read' | 'reaction';
    payload: unknown;
    ts: number;
    msgId: string;
}

class P2PManager {
    private rooms = new Map<string, ReturnType<typeof joinRoom>>();
    private actions = new Map<string, any>();

    get selfId() {
        return selfId;
    }

    join(config: P2PConfig, roomId: string) {
        if (this.rooms.has(roomId)) return this.rooms.get(roomId)!;

        const room = joinRoom(
            {
                appId: config.appId,
            },
            roomId
        );

        const [sendChat, getChat] = room.makeAction<ChatAction>('chat');
        const [sendPresence, getPresence] = room.makeAction<{ status: 'online' | 'away'; name: string }>('presence');
        const [sendTyping, getTyping] = room.makeAction<{ peerId: string; isTyping: boolean }>('typing');

        this.rooms.set(roomId, room);
        this.actions.set(roomId, {sendChat, getChat, sendPresence, getPresence, sendTyping, getTyping});

        return {room, sendChat, getChat, sendPresence, getPresence, sendTyping, getTyping};
    }

    leave(roomId: string) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.leave();
            this.rooms.delete(roomId);
            this.actions.delete(roomId);
        }
    }
}

export const p2p = new P2PManager();
