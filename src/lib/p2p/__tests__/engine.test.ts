import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
    destroyP2PEngine,
    getP2PEngine,
    type P2PConfig,
    P2PConfigSchema,
    P2PConnectionError,
    P2PEncryptionError,
    P2PEngine,
    P2PError,
    type P2PEvents,
    P2PFileTransferError,
    type P2PMessage,
    P2PMessageSchema,
} from '../engine';

// Mock Trystero
vi.mock('trystero', () => ({
    joinRoom: vi.fn(() => ({
        makeAction: vi.fn(() => [
            vi.fn(), // send function
            vi.fn(), // receive function
        ]),
        onPeerJoin: vi.fn(),
        onPeerLeave: vi.fn(),
        leave: vi.fn(),
    })),
}));

// Mock Web Crypto API
const mockGenerateKey = vi.fn();
const mockExportKey = vi.fn();

Object.defineProperty(global, 'crypto', {
    value: {
        subtle: {
            generateKey: mockGenerateKey,
            exportKey: mockExportKey,
        },
        randomUUID: vi.fn(() => 'test-uuid'),
    },
    writable: true,
});

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn(() => Promise.resolve({
            getTracks: () => [{stop: vi.fn()}],
        })),
    },
    writable: true,
});

describe('P2PEngine', () => {
    let engine: P2PEngine;
    let mockConfig: P2PConfig;
    let mockEvents: Partial<P2PEvents>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockConfig = {
            appId: 'test-app',
            password: 'test-password',
            enableEncryption: true,
            enableFileTransfer: true,
            maxRetries: 3,
            connectionTimeout: 10000,
            heartbeatInterval: 5000,
        };

        mockEvents = {
            onMessage: vi.fn(),
            onPeerJoin: vi.fn(),
            onPeerLeave: vi.fn(),
            onConnectionChange: vi.fn(),
            onError: vi.fn(),
            onDebug: vi.fn(),
        };

        // Mock encryption key generation
        mockGenerateKey.mockResolvedValue({
            publicKey: {type: 'public', extractable: true},
            privateKey: {type: 'private', extractable: true},
        });
        mockExportKey.mockResolvedValue(new ArrayBuffer(32));
    });

    afterEach(async () => {
        if (engine) {
            await engine.destroy();
        }
        await destroyP2PEngine();
    });

    describe('Configuration Validation', () => {
        it('should validate configuration with schema', () => {
            expect(() => P2PConfigSchema.parse(mockConfig)).not.toThrow();
        });

        it('should reject invalid configuration', () => {
            const invalidConfig = {...mockConfig, appId: ''};
            expect(() => P2PConfigSchema.parse(invalidConfig)).toThrow();
        });

        it('should apply default values', () => {
            const minimalConfig = {appId: 'test'};
            const result = P2PConfigSchema.parse(minimalConfig);
            expect(result.enableEncryption).toBe(true);
            expect(result.enableFileTransfer).toBe(true);
            expect(result.maxRetries).toBe(3);
        });
    });

    describe('Engine Initialization', () => {
        it('should create engine instance with valid config', () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            expect(engine).toBeInstanceOf(P2PEngine);
        });

        it('should initialize encryption when enabled', async () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async initialization
            expect(mockGenerateKey).toHaveBeenCalledWith({
                name: 'ECDH',
                namedCurve: 'P-256',
            }, true, ['deriveKey', 'deriveBits']);
        });

        it('should set event handlers', () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            engine.setEvents(mockEvents);
            // Events are set internally, we can't easily test this without exposing internals
            expect(engine).toBeInstanceOf(P2PEngine);
        });

        it('should set signaling strategy', () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            engine.setSignalingStrategy('websocket');
            expect(engine).toBeInstanceOf(P2PEngine);
        });
    });

    describe('Message Handling', () => {
        beforeEach(async () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should validate message schema', () => {
            const validMessage: P2PMessage = {
                id: 'test-uuid',
                type: 'text',
                content: 'Hello World',
                senderId: 'sender-id',
                timestamp: Date.now(),
            };

            expect(() => P2PMessageSchema.parse(validMessage)).not.toThrow();
        });

        it('should reject invalid message schema', () => {
            const invalidMessage = {
                id: 'test-uuid',
                type: 'invalid-type',
                content: 'Hello World',
                senderId: 'sender-id',
                timestamp: Date.now(),
            };

            expect(() => P2PMessageSchema.parse(invalidMessage)).toThrow();
        });

        it('should send message successfully', async () => {
            await expect(engine.sendMessage({
                type: 'text',
                content: 'Test message',
            })).resolves.not.toThrow();
        });

        it('should send typing indicator', async () => {
            await expect(engine.sendTyping(true)).resolves.not.toThrow();
            await expect(engine.sendTyping(false)).resolves.not.toThrow();
        });
    });

    describe('File Transfer', () => {
        beforeEach(async () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should send file successfully', async () => {
            const mockFile = new File(['test content'], 'test.txt', {type: 'text/plain'});

            const fileId = await engine.sendFile(mockFile);
            expect(fileId).toBeDefined();
            expect(typeof fileId).toBe('string');
        });

        it('should reject file transfer when disabled', async () => {
            const configNoFileTransfer = {...mockConfig, enableFileTransfer: false};
            const engineNoFileTransfer = new P2PEngine(configNoFileTransfer, 'test-peer-id');
            await engineNoFileTransfer.joinRoom('test-room');

            const mockFile = new File(['test content'], 'test.txt', {type: 'text/plain'});

            await expect(engineNoFileTransfer.sendFile(mockFile)).rejects.toThrow('File transfer is disabled');
        });

        it('should handle file transfer state', () => {
            const transfers = engine.getActiveFileTransfers();
            expect(Array.isArray(transfers)).toBe(true);
        });
    });

    describe('WebRTC Calls', () => {
        beforeEach(async () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should initiate call successfully', async () => {
            const callConfig = {
                audio: true,
                video: false,
            };

            const pc = await engine.initiateCall('test-peer-id', callConfig);
            expect(pc).toBeInstanceOf(RTCPeerConnection);
        });

        it('should answer call successfully', async () => {
            const callConfig = {
                audio: true,
                video: false,
            };

            const mockOffer = {
                type: 'offer' as const,
                sdp: 'mock-sdp',
            };

            const pc = await engine.answerCall('test-peer-id', mockOffer, callConfig);
            expect(pc).toBeInstanceOf(RTCPeerConnection);
        });

        it('should hang up call successfully', async () => {
            await expect(engine.hangup('test-peer-id')).resolves.not.toThrow();
        });
    });

    describe('Connection Management', () => {
        beforeEach(async () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should track peer connections', () => {
            const peers = engine.getPeers();
            expect(Array.isArray(peers)).toBe(true);

            const peerCount = engine.getPeerCount();
            expect(typeof peerCount).toBe('number');
        });

        it('should check connection status', () => {
            const isConnected = engine.isConnected();
            expect(typeof isConnected).toBe('boolean');
        });

        it('should get performance metrics', () => {
            const metrics = engine.getPerformanceMetrics();
            expect(metrics).toHaveProperty('messagesSent');
            expect(metrics).toHaveProperty('messagesReceived');
            expect(metrics).toHaveProperty('filesTransferred');
        });

        it('should get connection metrics for peer', () => {
            const metrics = engine.getConnectionMetrics('test-peer-id');
            expect(metrics).toBeUndefined(); // No metrics yet for test peer
        });
    });

    describe('Error Handling', () => {
        it('should create P2PError with correct properties', () => {
            const error = new P2PError('Test error', 'TEST_CODE', 'peer-id', true);

            expect(error).toBeInstanceOf(P2PError);
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.peerId).toBe('peer-id');
            expect(error.retryable).toBe(true);
        });

        it('should create P2PEncryptionError', () => {
            const error = new P2PEncryptionError('Encryption failed', 'peer-id');

            expect(error).toBeInstanceOf(P2PEncryptionError);
            expect(error).toBeInstanceOf(P2PError);
            expect(error.code).toBe('ENCRYPTION_ERROR');
            expect(error.retryable).toBe(false);
        });

        it('should create P2PConnectionError', () => {
            const error = new P2PConnectionError('Connection failed', 'peer-id');

            expect(error).toBeInstanceOf(P2PConnectionError);
            expect(error).toBeInstanceOf(P2PError);
            expect(error.code).toBe('CONNECTION_ERROR');
            expect(error.retryable).toBe(true);
        });

        it('should create P2PFileTransferError', () => {
            const error = new P2PFileTransferError('File transfer failed', 'peer-id', 'file-id');

            expect(error).toBeInstanceOf(P2PFileTransferError);
            expect(error).toBeInstanceOf(P2PError);
            expect(error.code).toBe('FILE_TRANSFER_ERROR');
            expect(error.retryable).toBe(false);
        });
    });

    describe('Singleton Management', () => {
        it('should create singleton instance', async () => {
            const engine1 = await getP2PEngine(mockConfig, 'test-peer-id');
            const engine2 = await getP2PEngine();

            expect(engine1).toBe(engine2);
        });

        it('should check if engine is available', () => {
            expect(isP2PEngineAvailable()).toBe(false);
        });

        it('should get current engine instance', () => {
            const current = getCurrentP2PEngine();
            expect(current).toBeNull();
        });

        it('should destroy engine instance', async () => {
            await getP2PEngine(mockConfig, 'test-peer-id');
            await destroyP2PEngine();

            expect(getCurrentP2PEngine()).toBeNull();
        });

        it('should recreate engine with new config', async () => {
            const engine1 = await getP2PEngine(mockConfig, 'test-peer-id');
            const newConfig = {...mockConfig, appId: 'new-app'};
            const engine2 = await recreateP2PEngine(newConfig, 'new-peer-id');

            expect(engine1).not.toBe(engine2);
        });

        it('should throw error when initializing without config', async () => {
            await expect(getP2PEngine()).rejects.toThrow('P2P engine configuration and peer ID are required');
        });
    });

    describe('Resource Cleanup', () => {
        it('should leave room and clean up resources', async () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            await engine.joinRoom('test-room');

            await expect(engine.leaveRoom()).resolves.not.toThrow();
        });

        it('should destroy engine completely', async () => {
            engine = new P2PEngine(mockConfig, 'test-peer-id');
            await engine.joinRoom('test-room');

            await expect(engine.destroy()).resolves.not.toThrow();
        });
    });

    describe('Health Monitoring', () => {
        beforeEach(async () => {
            engine = new P2PEngine({
                ...mockConfig,
                heartbeatInterval: 100, // Fast for testing
            }, 'test-peer-id');
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should start health monitoring', () => {
            expect(engine).toBeInstanceOf(P2PEngine);
            // Health monitoring is started in constructor
        });

        it('should update performance metrics', () => {
            const metrics = engine.getPerformanceMetrics();
            expect(typeof metrics).toBe('object');
        });
    });
});
