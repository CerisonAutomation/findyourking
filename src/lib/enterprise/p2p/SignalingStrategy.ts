/**
 * P2P Signaling Strategy
 * Handles signaling for peer-to-peer connections
 */

export type SignalingMethod = 'webrtc' | 'nostr' | 'mqtt';

export interface SignalingConfig {
    method: SignalingMethod;
    servers?: string[];
    timeout?: number;
}

export interface SignalingMessage {
    type: 'offer' | 'answer' | 'ice-candidate';
    payload: any;
    from: string;
    to: string;
    timestamp: number;
}

export interface ConnectionState {
    status: 'disconnected' | 'connecting' | 'connected' | 'failed';
    latency?: number;
    lastSeen?: Date;
}

export interface SignalingStrategy {
    connect(config: SignalingConfig): Promise<void>;
    disconnect(): Promise<void>;
    send(message: SignalingMessage): Promise<void>;
    onMessage(callback: (message: SignalingMessage) => void): void;
    getState(): ConnectionState;
}

export function getSignalingStrategy(method: SignalingMethod): SignalingStrategy {
    switch (method) {
        case 'webrtc':
            return new WebRTCStrategy();
        case 'nostr':
            return new NostrStrategy();
        case 'mqtt':
            return new MQTTStrategy();
        default:
            throw new Error(`Unknown signaling method: ${method}`);
    }
}

export function destroySignalingStrategy(strategy: SignalingStrategy): void {
    strategy.disconnect();
}

class WebRTCStrategy implements SignalingStrategy {
    private state: ConnectionState = { status: 'disconnected' };
    private messageCallback?: (message: SignalingMessage) => void;

    async connect(config: SignalingConfig): Promise<void> {
        this.state.status = 'connecting';
        // WebRTC connection logic
        this.state.status = 'connected';
    }

    async disconnect(): Promise<void> {
        this.state.status = 'disconnected';
    }

    async send(message: SignalingMessage): Promise<void> {
        // WebRTC send logic
    }

    onMessage(callback: (message: SignalingMessage) => void): void {
        this.messageCallback = callback;
    }

    getState(): ConnectionState {
        return this.state;
    }
}

class NostrStrategy implements SignalingStrategy {
    private state: ConnectionState = { status: 'disconnected' };
    private messageCallback?: (message: SignalingMessage) => void;

    async connect(config: SignalingConfig): Promise<void> {
        this.state.status = 'connecting';
        // Nostr connection logic
        this.state.status = 'connected';
    }

    async disconnect(): Promise<void> {
        this.state.status = 'disconnected';
    }

    async send(message: SignalingMessage): Promise<void> {
        // Nostr send logic
    }

    onMessage(callback: (message: SignalingMessage) => void): void {
        this.messageCallback = callback;
    }

    getState(): ConnectionState {
        return this.state;
    }
}

class MQTTStrategy implements SignalingStrategy {
    private state: ConnectionState = { status: 'disconnected' };
    private messageCallback?: (message: SignalingMessage) => void;

    async connect(config: SignalingConfig): Promise<void> {
        this.state.status = 'connecting';
        // MQTT connection logic
        this.state.status = 'connected';
    }

    async disconnect(): Promise<void> {
        this.state.status = 'disconnected';
    }

    async send(message: SignalingMessage): Promise<void> {
        // MQTT send logic
    }

    onMessage(callback: (message: SignalingMessage) => void): void {
        this.messageCallback = callback;
    }

    getState(): ConnectionState {
        return this.state;
    }
}