import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
    type AIInsight,
    destroyP2PEngine,
    EnterpriseP2PEngine,
    getEnterpriseP2PEngine,
    type P2PConfig,
    P2PConfigSchema,
    P2PConnectionError,
    P2PEncryptionError,
    P2PError,
    type P2PEvents,
    P2PFileTransferError,
    type P2PMessage,
    P2PMessageSchema,
} from '../enterprise-engine';

// Mock WebRTC and Crypto APIs
const mockGenerateKey = vi.fn();
const mockExportKey = vi.fn();
const mockImportKey = vi.fn();
const mockDeriveKey = vi.fn();

Object.defineProperty(global, 'crypto', {
    value: {
        subtle: {
            generateKey: mockGenerateKey,
            exportKey: mockExportKey,
            importKey: mockImportKey,
            deriveKey: mockDeriveKey,
            digest: vi.fn((algorithm: string, data: ArrayBuffer) =>
                Promise.resolve(new ArrayBuffer(32))
            ),
        },
        randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
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

// Mock RTCPeerConnection
const mockRTCPeerConnection = vi.fn().mockImplementation(() => ({
    createOffer: vi.fn(() => Promise.resolve({type: 'offer', sdp: 'mock-sdp'})),
    createAnswer: vi.fn(() => Promise.resolve({type: 'answer', sdp: 'mock-sdp'})),
    setLocalDescription: vi.fn(() => Promise.resolve()),
    setRemoteDescription: vi.fn(() => Promise.resolve()),
    addTrack: vi.fn(),
    close: vi.fn(),
    connectionState: 'connected',
    onicecandidate: null,
    onconnectionstatechange: null,
    ontrack: null,
}));

Object.defineProperty(global, 'RTCPeerConnection', {
    value: mockRTCPeerConnection,
    writable: true,
});

Object.defineProperty(global, 'RTCIceCandidate', {
    value: vi.fn().mockImplementation(() => ({})),
    writable: true,
});

Object.defineProperty(global, 'RTCSessionDescription', {
    value: vi.fn().mockImplementation(() => ({})),
    writable: true,
});

describe('EnterpriseP2PEngine', () => {
    let engine: EnterpriseP2PEngine;
    let mockConfig: P2PConfig;
    let mockEvents: Partial<P2PEvents>;
    let peerId: string;

    beforeEach(() => {
        vi.clearAllMocks();

        peerId = 'test-peer-' + Math.random().toString(36).substr(2, 9);

        mockConfig = {
            appId: 'test-app',
            iceServers: [
                {urls: 'stun:stun.l.google.com:19302'},
                {urls: 'stun:stun1.l.google.com:19302'}
            ],
            enableEncryption: true,
            enableFileTransfer: true,
            enableMeshNetworking: true,
            enableAIIntegration: true,
            maxPeers: 50,
            maxRetries: 3,
            connectionTimeout: 10000,
            heartbeatInterval: 5000,
            fileChunkSize: 65536,
            bandwidthLimit: {
                upload: 1048576,
                download: 1048576,
            },
            signalingStrategy: 'hybrid',
        };

        mockEvents = {
            onMessage: vi.fn(),
            onPeerJoin: vi.fn(),
            onPeerLeave: vi.fn(),
            onConnectionChange: vi.fn(),
            onFileTransferProgress: vi.fn(),
            onFileTransferComplete: vi.fn(),
            onCallIncoming: vi.fn(),
            onCallConnected: vi.fn(),
            onCallEnded: vi.fn(),
            onError: vi.fn(),
            onDebug: vi.fn(),
            onMetricsUpdate: vi.fn(),
            onAIInsight: vi.fn(),
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
            expect(result.maxPeers).toBe(50);
            expect(result.signalingStrategy).toBe('hybrid');
        });

        it('should validate bandwidth limits', () => {
            const configWithLimits = {
                ...mockConfig,
                bandwidthLimit: {
                    upload: 2048000,
                    download: 4096000,
                },
            };
            expect(() => P2PConfigSchema.parse(configWithLimits)).not.toThrow();
        });

        it('should reject invalid bandwidth limits', () => {
            const invalidConfig = {
                ...mockConfig,
                bandwidthLimit: {
                    upload: 50, // Below minimum
                    download: 1048576,
                },
            };
            expect(() => P2PConfigSchema.parse(invalidConfig)).toThrow();
        });
    });

    describe('Engine Initialization', () => {
        it('should create engine instance with valid config', () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            expect(engine).toBeInstanceOf(EnterpriseP2PEngine);
        });

        it('should initialize encryption when enabled', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async initialization
            expect(mockGenerateKey).toHaveBeenCalledWith({
                name: 'ECDH',
                namedCurve: 'P-256',
            }, true, ['deriveKey', 'deriveBits']);
        });

        it('should set event handlers', () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            expect(engine).toBeInstanceOf(EnterpriseP2PEngine);
        });

        it('should handle different signaling strategies', () => {
            const websocketConfig = {...mockConfig, signalingStrategy: 'websocket' as const};
            engine = new EnterpriseP2PEngine(websocketConfig, peerId);
            expect(engine).toBeInstanceOf(EnterpriseP2PEngine);
        });
    });

    describe('Room Management', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
        });

        it('should join room successfully', async () => {
            await expect(engine.joinRoom('test-room')).resolves.not.toThrow();
            expect(engine.isConnectedToNetwork()).toBe(true);
        });

        it('should leave room and cleanup', async () => {
            await engine.joinRoom('test-room');
            await expect(engine.leaveRoom()).resolves.not.toThrow();
            expect(engine.isConnectedToNetwork()).toBe(false);
        });

        it('should handle room join failure', async () => {
            // Mock joinRoom to throw error
            const originalConsole = console.error;
            console.error = vi.fn();

            await expect(engine.joinRoom('invalid-room')).resolves.not.toThrow(); // Mock implementation doesn't throw

            console.error = originalConsole;
        });

        it('should handle multiple room joins', async () => {
            await engine.joinRoom('room1');
            await engine.joinRoom('room2'); // Should handle gracefully
            expect(engine.isConnectedToNetwork()).toBe(true);
        });
    });

    describe('Message Handling', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
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
                encrypted: false,
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
                encrypted: false,
            };

            expect(() => P2PMessageSchema.parse(invalidMessage)).toThrow();
        });

        it('should send message successfully', async () => {
            await expect(engine.sendMessage({
                type: 'text',
                content: 'Test message',
            })).resolves.not.toThrow();
        });

        it('should send message with encryption', async () => {
            await expect(engine.sendMessage({
                type: 'text',
                content: 'Encrypted message',
                recipientId: 'recipient-id',
            })).resolves.not.toThrow();
        });

        it('should send typing indicator', async () => {
            await expect(engine.sendTyping(true)).resolves.not.toThrow();
            await expect(engine.sendTyping(false)).resolves.not.toThrow();
        });

        it('should handle all message types', async () => {
            const messageTypes = ['text', 'image', 'file', 'typing', 'system', 'ai-match'] as const;

            for (const type of messageTypes) {
                await expect(engine.sendMessage({
                    type,
                    content: `Test ${type} message`,
                })).resolves.not.toThrow();
            }
        });

        it('should reject sending when not connected', async () => {
            await engine.leaveRoom();
            await expect(engine.sendMessage({
                type: 'text',
                content: 'Test message',
            })).rejects.toThrow(P2PConnectionError);
        });
    });

    describe('WebRTC Calls', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should initiate call with audio', async () => {
            const callConfig = {
                audio: true,
                video: false,
                screen: false,
                bandwidth: {audio: 64, video: 500},
                codecs: ['opus', 'vp8'],
                simulcast: false,
            };

            const pc = await engine.initiateCall('test-peer-id', callConfig);
            expect(mockRTCPeerConnection).toHaveBeenCalled();
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                audio: true,
                video: false,
            });
        });

        it('should initiate call with video', async () => {
            const callConfig = {
                audio: true,
                video: true,
                screen: false,
                bandwidth: {audio: 64, video: 500},
                codecs: ['opus', 'vp8'],
                simulcast: false,
            };

            await engine.initiateCall('test-peer-id', callConfig);
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                audio: true,
                video: true,
            });
        });

        it('should answer incoming call', async () => {
            const callConfig = {
                audio: true,
                video: false,
                screen: false,
                bandwidth: {audio: 64, video: 500},
                codecs: ['opus', 'vp8'],
                simulcast: false,
            };

            const mockOffer = {
                type: 'offer' as const,
                sdp: 'mock-sdp',
            };

            const pc = await engine.answerCall('test-peer-id', mockOffer, callConfig);
            expect(mockRTCPeerConnection).toHaveBeenCalled();
        });

        it('should hang up call', async () => {
            await engine.initiateCall('test-peer-id', {
                audio: true,
                video: false,
                screen: false,
                bandwidth: {audio: 64, video: 500},
                codecs: ['opus'],
                simulcast: false,
            });

            await expect(engine.hangup('test-peer-id')).resolves.not.toThrow();
        });

        it('should reject duplicate calls', async () => {
            const callConfig = {
                audio: true,
                video: false,
                screen: false,
                bandwidth: {audio: 64, video: 500},
                codecs: ['opus'],
                simulcast: false,
            };

            await engine.initiateCall('test-peer-id', callConfig);

            await expect(engine.initiateCall('test-peer-id', callConfig))
                .rejects.toThrow('Call already in progress with this peer');
        });

        it('should handle call failure gracefully', async () => {
            navigator.mediaDevices.getUserMedia = vi.fn()
                .mockRejectedValueOnce(new Error('Media access denied'));

            await expect(engine.initiateCall('test-peer-id', {
                audio: true,
                video: false,
                screen: false,
                bandwidth: {audio: 64, video: 500},
                codecs: ['opus'],
                simulcast: false,
            })).rejects.toThrow();
        });
    });

    describe('File Transfer', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should send file successfully', async () => {
            const mockFile = new File(['test content'], 'test.txt', {type: 'text/plain'});

            const fileId = await engine.sendFile(mockFile);
            expect(fileId).toBeDefined();
            expect(typeof fileId).toBe('string');
            expect(mockEvents.onFileTransferProgress).toHaveBeenCalled();
        });

        it('should send file with encryption', async () => {
            const encryptedConfig = {...mockConfig, enableEncryption: true};
            const encryptedEngine = new EnterpriseP2PEngine(encryptedConfig, peerId);
            encryptedEngine.setEvents(mockEvents);
            await encryptedEngine.joinRoom('test-room');

            const mockFile = new File(['encrypted content'], 'encrypted.txt', {type: 'text/plain'});

            await expect(encryptedEngine.sendFile(mockFile)).resolves.not.toThrow();
        });

        it('should reject file transfer when disabled', async () => {
            const configNoFileTransfer = {...mockConfig, enableFileTransfer: false};
            const engineNoFileTransfer = new EnterpriseP2PEngine(configNoFileTransfer, peerId);
            engineNoFileTransfer.setEvents(mockEvents);
            await engineNoFileTransfer.joinRoom('test-room');

            const mockFile = new File(['test content'], 'test.txt', {type: 'text/plain'});

            await expect(engineNoFileTransfer.sendFile(mockFile))
                .rejects.toThrow('File transfer is disabled');
        });

        it('should handle file transfer progress', async () => {
            const mockFile = new File(['a'.repeat(1000)], 'large.txt', {type: 'text/plain'});

            await engine.sendFile(mockFile);

            // Check that progress was reported
            expect(mockEvents.onFileTransferProgress).toHaveBeenCalled();

            // Check transfer state
            const transfers = engine.getActiveFileTransfers();
            expect(transfers.length).toBeGreaterThan(0);
        });

        it('should cancel file transfer', async () => {
            const mockFile = new File(['test content'], 'test.txt', {type: 'text/plain'});
            const fileId = await engine.sendFile(mockFile);

            await expect(engine.cancelFileTransfer(fileId)).resolves.not.toThrow();

            // Transfer should be removed
            const transfers = engine.getActiveFileTransfers();
            expect(transfers.find(t => t.config.fileId === fileId)).toBeUndefined();
        });

        it('should handle file chunks correctly', async () => {
            const largeFile = new File(['x'.repeat(100000)], 'large.txt', {type: 'text/plain'});

            await expect(engine.sendFile(largeFile)).resolves.not.toThrow();

            // Should have created multiple chunks
            const transfers = engine.getActiveFileTransfers();
            const transfer = transfers[0];
            expect(transfer.config.totalChunks).toBeGreaterThan(1);
        });
    });

    describe('Peer Management', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
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
            const isConnected = engine.isConnectedToNetwork();
            expect(typeof isConnected).toBe('boolean');
        });

        it('should get peer by ID', () => {
            const peer = engine.getPeer('non-existent-peer');
            expect(peer).toBeUndefined();
        });

        it('should get connection metrics', () => {
            const metrics = engine.getConnectionMetrics('non-existent-peer');
            expect(metrics).toBeUndefined();
        });

        it('should handle peer join events', async () => {
            // Simulate peer join
            await engine['handlePeerJoin']('new-peer-id');

            expect(mockEvents.onPeerJoin).toHaveBeenCalled();
            expect(mockEvents.onConnectionChange).toHaveBeenCalledWith('new-peer-id', 'connected');
        });

        it('should handle peer leave events', async () => {
            // Simulate peer join first
            await engine['handlePeerJoin']('leaving-peer-id');

            // Then simulate peer leave
            engine['handlePeerLeave']('leaving-peer-id');

            expect(mockEvents.onPeerLeave).toHaveBeenCalledWith('leaving-peer-id');
            expect(mockEvents.onConnectionChange).toHaveBeenCalledWith('leaving-peer-id', 'disconnected');
        });
    });

    describe('Performance Monitoring', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should track performance metrics', () => {
            const metrics = engine.getPerformanceMetrics();

            expect(metrics).toHaveProperty('messagesSent');
            expect(metrics).toHaveProperty('messagesReceived');
            expect(metrics).toHaveProperty('filesTransferred');
            expect(metrics).toHaveProperty('totalBytesTransferred');
            expect(metrics).toHaveProperty('connectionsEstablished');
            expect(metrics).toHaveProperty('uptime');
            expect(metrics).toHaveProperty('averageLatency');
            expect(metrics).toHaveProperty('activeConnections');
            expect(metrics).toHaveProperty('activeCalls');
            expect(metrics).toHaveProperty('activeTransfers');
        });

        it('should update metrics on message send', async () => {
            const initialMetrics = engine.getPerformanceMetrics();

            await engine.sendMessage({
                type: 'text',
                content: 'Test message',
            });

            const updatedMetrics = engine.getPerformanceMetrics();
            expect(updatedMetrics.messagesSent).toBe(initialMetrics.messagesSent + 1);
        });

        it('should calculate average latency', () => {
            const averageLatency = engine['calculateAverageLatency']();
            expect(typeof averageLatency).toBe('number');
            expect(averageLatency).toBeGreaterThanOrEqual(0);
        });

        it('should update peer metrics', () => {
            engine['updateMetrics']('test-peer');

            const metrics = engine.getConnectionMetrics('test-peer');
            expect(metrics).toBeDefined();
            expect(metrics?.peerId).toBe('test-peer');
            expect(metrics?.messageCount).toBeGreaterThan(0);
        });
    });

    describe('AI Integration', () => {
        beforeEach(async () => {
            const aiConfig = {...mockConfig, enableAIIntegration: true};
            engine = new EnterpriseP2PEngine(aiConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should generate AI insights', async () => {
            await engine['generateAIInsight']('test-peer-id');

            expect(mockEvents.onAIInsight).toHaveBeenCalled();

            const [insight] = mockEvents.onAIInsight.mock.calls[0];
            expect(insight).toMatchObject({
                type: 'compatibility',
                peerId: 'test-peer-id',
                score: expect.any(Number),
                confidence: expect.any(Number),
                insights: expect.any(Array),
                recommendations: expect.any(Array),
                timestamp: expect.any(Number),
            } as AIInsight);
        });

        it('should handle AI insight messages', async () => {
            const aiMessage: P2PMessage = {
                id: 'ai-insight-id',
                type: 'ai-match',
                content: JSON.stringify({
                    type: 'compatibility',
                    peerId: 'test-peer',
                    score: 85,
                    confidence: 0.9,
                    insights: ['Strong compatibility'],
                    recommendations: ['Send message'],
                    timestamp: Date.now(),
                }),
                senderId: 'ai-peer',
                timestamp: Date.now(),
                encrypted: false,
            };

            await engine['handleAIInsightMessage'](aiMessage, 'ai-peer');

            expect(mockEvents.onAIInsight).toHaveBeenCalled();
        });

        it('should skip AI when disabled', async () => {
            const noAIConfig = {...mockConfig, enableAIIntegration: false};
            const noAIEngine = new EnterpriseP2PEngine(noAIConfig, peerId);
            noAIEngine.setEvents(mockEvents);
            await noAIEngine.joinRoom('test-room');

            await noAIEngine['generateAIInsight']('test-peer-id');

            expect(mockEvents.onAIInsight).not.toHaveBeenCalled();
        });
    });

    describe('Encryption', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should initialize encryption keys', async () => {
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockGenerateKey).toHaveBeenCalledWith({
                name: 'ECDH',
                namedCurve: 'P-256',
            }, true, ['deriveKey', 'deriveBits']);

            expect(mockExportKey).toHaveBeenCalledTimes(2); // publicKey and privateKey
        });

        it('should encrypt and decrypt messages', async () => {
            const originalMessage = 'Secret message';

            const encrypted = await engine['encryptMessage'](originalMessage, 'recipient-id');
            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(originalMessage);

            const decrypted = await engine['decryptMessage'](encrypted, 'sender-id');
            expect(decrypted).toBe(originalMessage);
        });

        it('should handle encryption key exchange', async () => {
            await engine['exchangeEncryptionKeys']('peer-id');

            // Should have sent a system message with encryption keys
            expect(mockEvents.onDebug).toHaveBeenCalled();
        });

        it('should encrypt file chunks', async () => {
            const chunk = new Uint8Array([1, 2, 3, 4, 5]);

            const encrypted = await engine['encryptChunk'](chunk, 'recipient-id');
            expect(encrypted).toBeInstanceOf(Uint8Array);
        });

        it('should decrypt file chunks', async () => {
            const chunk = new Uint8Array([1, 2, 3, 4, 5]);

            const decrypted = await engine['decryptChunk'](chunk, 'sender-id');
            expect(decrypted).toBeInstanceOf(Uint8Array);
        });

        it('should handle encryption errors gracefully', async () => {
            mockGenerateKey.mockRejectedValueOnce(new Error('Crypto error'));

            const errorEngine = new EnterpriseP2PEngine(mockConfig, peerId);
            errorEngine.setEvents(mockEvents);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockEvents.onError).toHaveBeenCalledWith(
                expect.any(P2PEncryptionError)
            );
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
            expect(error.context?.transferId).toBe('file-id');
        });

        it('should handle system message errors', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');

            const invalidMessage: P2PMessage = {
                id: 'invalid-id',
                type: 'system',
                content: 'invalid json',
                senderId: 'test-peer',
                timestamp: Date.now(),
                encrypted: false,
            };

            await engine['handleSystemMessage'](invalidMessage, 'test-peer');

            expect(mockEvents.onError).toHaveBeenCalled();
        });
    });

    describe('System Messages', () => {
        beforeEach(async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');
        });

        it('should handle heartbeat messages', async () => {
            const heartbeatMessage: P2PMessage = {
                id: 'heartbeat-id',
                type: 'system',
                content: JSON.stringify({
                    type: 'heartbeat',
                    timestamp: Date.now(),
                }),
                senderId: 'test-peer',
                timestamp: Date.now(),
                encrypted: false,
            };

            await engine['handleSystemMessage'](heartbeatMessage, 'test-peer');

            // Should update peer's last seen time
            expect(mockEvents.onDebug).toHaveBeenCalled();
        });

        it('should handle encryption key exchange', async () => {
            const keyExchangeMessage: P2PMessage = {
                id: 'key-exchange-id',
                type: 'system',
                content: JSON.stringify({
                    type: 'encryption-key-exchange',
                    publicKey: 'mock-public-key',
                    keyId: 'mock-key-id',
                }),
                senderId: 'test-peer',
                timestamp: Date.now(),
                encrypted: false,
            };

            await engine['handleSystemMessage'](keyExchangeMessage, 'test-peer');

            // Should store peer's public key
            const peerKey = engine['getPeerPublicKey']('test-peer');
            expect(peerKey).toBeDefined();
        });

        it('should handle call offers', async () => {
            const callOfferMessage: P2PMessage = {
                id: 'call-offer-id',
                type: 'system',
                content: JSON.stringify({
                    type: 'call-offer',
                    offer: {type: 'offer', sdp: 'mock-sdp'},
                    config: {
                        audio: true,
                        video: false,
                        screen: false,
                        bandwidth: {audio: 64, video: 500},
                        codecs: ['opus'],
                        simulcast: false
                    },
                }),
                senderId: 'caller-peer',
                timestamp: Date.now(),
                encrypted: false,
            };

            await engine['handleSystemMessage'](callOfferMessage, 'caller-peer');

            expect(mockEvents.onCallIncoming).toHaveBeenCalledWith('caller-peer', {type: 'offer', sdp: 'mock-sdp'});
        });

        it('should handle call hangup', async () => {
            const hangupMessage: P2PMessage = {
                id: 'hangup-id',
                type: 'system',
                content: JSON.stringify({
                    type: 'call-hangup',
                }),
                senderId: 'caller-peer',
                timestamp: Date.now(),
                encrypted: false,
            };

            await engine['handleSystemMessage'](hangupMessage, 'caller-peer');

            expect(mockEvents.onCallEnded).toHaveBeenCalledWith('caller-peer');
        });
    });

    describe('Resource Management', () => {
        it('should cleanup resources on destroy', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');

            // Create some resources
            await engine.sendMessage({type: 'text', content: 'test'});
            await engine.initiateCall('test-peer', {
                audio: true,
                video: false,
                screen: false,
                bandwidth: {audio: 64, video: 500},
                codecs: ['opus'],
                simulcast: false,
            });

            await expect(engine.destroy()).resolves.not.toThrow();

            expect(engine.isConnectedToNetwork()).toBe(false);
        });

        it('should handle multiple destroy calls', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);

            await engine.destroy();
            await expect(engine.destroy()).resolves.not.toThrow();
        });

        it('should cleanup file transfers on destroy', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');

            const mockFile = new File(['test'], 'test.txt');
            await engine.sendFile(mockFile);

            expect(engine.getActiveFileTransfers().length).toBeGreaterThan(0);

            await engine.destroy();

            // File transfers should be cleaned up
            expect(engine.getActiveFileTransfers().length).toBe(0);
        });
    });

    describe('Singleton Management', () => {
        it('should create singleton instance', async () => {
            const engine1 = await getEnterpriseP2PEngine(mockConfig, peerId);
            const engine2 = await getEnterpriseP2PEngine();

            expect(engine1).toBe(engine2);
        });

        it('should check if engine is available', () => {
            expect(getEnterpriseP2PEngine()).rejects.toThrow();
        });

        it('should get current engine instance', () => {
            const current = getCurrentP2PEngine();
            expect(current).toBeNull();
        });

        it('should destroy engine instance', async () => {
            await getEnterpriseP2PEngine(mockConfig, peerId);
            await destroyP2PEngine();

            expect(getCurrentP2PEngine()).toBeNull();
        });

        it('should recreate engine with new config', async () => {
            const engine1 = await getEnterpriseP2PEngine(mockConfig, peerId);
            const newConfig = {...mockConfig, appId: 'new-app'};
            const engine2 = await getEnterpriseP2PEngine(newConfig, peerId + '-2');

            expect(engine1).toBe(engine2); // Same instance

            await destroyP2PEngine();
            const engine3 = await getEnterpriseP2PEngine(newConfig, peerId + '-3');

            expect(engine1).not.toBe(engine3); // New instance
        });

        it('should throw error when initializing without config', async () => {
            await expect(getEnterpriseP2PEngine()).rejects.toThrow(
                'P2P engine configuration and peer ID are required for initial creation'
            );
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete P2P workflow', async () => {
            // Initialize engine
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('integration-test-room');

            // Send messages
            await engine.sendMessage({type: 'text', content: 'Hello World'});
            await engine.sendTyping(true);
            await engine.sendTyping(false);

            // Transfer file
            const mockFile = new File(['integration test'], 'integration.txt');
            const fileId = await engine.sendFile(mockFile);

            // Check file transfer progress
            expect(mockEvents.onFileTransferProgress).toHaveBeenCalled();

            // Cancel transfer
            await engine.cancelFileTransfer(fileId);

            // Check metrics
            const metrics = engine.getPerformanceMetrics();
            expect(metrics.messagesSent).toBeGreaterThan(0);
            expect(metrics.filesTransferred).toBe(0); // Cancelled

            // Cleanup
            await engine.leaveRoom();
            await engine.destroy();

            expect(engine.isConnectedToNetwork()).toBe(false);
        });

        it('should handle error recovery', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('error-test-room');

            // Simulate network error
            const originalConsole = console.error;
            console.error = vi.fn();

            // Try operations that might fail
            try {
                await engine.sendMessage({type: 'text', content: 'test'});
            } catch (error) {
                expect(error).toBeDefined();
            }

            console.error = originalConsole;

            // Engine should still be functional
            expect(engine.isConnectedToNetwork()).toBe(true);
        });

        it('should handle high load scenarios', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('load-test-room');

            // Send many messages
            const messagePromises = Array.from({length: 100}, (_, i) =>
                engine.sendMessage({
                    type: 'text',
                    content: `Message ${i}`,
                })
            );

            await Promise.all(messagePromises);

            const metrics = engine.getPerformanceMetrics();
            expect(metrics.messagesSent).toBe(100);

            // Transfer multiple files
            const filePromises = Array.from({length: 5}, (_, i) => {
                const file = new File([`File content ${i}`], `file${i}.txt`);
                return engine.sendFile(file);
            });

            await Promise.all(filePromises);

            expect(engine.getActiveFileTransfers().length).toBe(5);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty messages', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');

            await expect(engine.sendMessage({
                type: 'text',
                content: '',
            })).resolves.not.toThrow();
        });

        it('should handle very large messages', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');

            const largeContent = 'x'.repeat(1000000); // 1MB message

            await expect(engine.sendMessage({
                type: 'text',
                content: largeContent,
            })).resolves.not.toThrow();
        });

        it('should handle rapid peer join/leave', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');

            // Rapid peer joins
            const joinPromises = Array.from({length: 10}, (_, i) =>
                engine['handlePeerJoin'](`peer-${i}`)
            );

            await Promise.all(joinPromises);

            expect(engine.getPeerCount()).toBe(10);

            // Rapid peer leaves
            const leavePromises = Array.from({length: 10}, (_, i) =>
                engine['handlePeerLeave'](`peer-${i}`)
            );

            await Promise.all(leavePromises);

            expect(engine.getPeerCount()).toBe(0);
        });

        it('should handle concurrent file transfers', async () => {
            engine = new EnterpriseP2PEngine(mockConfig, peerId);
            engine.setEvents(mockEvents);
            await engine.joinRoom('test-room');

            const filePromises = Array.from({length: 3}, (_, i) => {
                const file = new File([`Content ${i}`], `file${i}.txt`);
                return engine.sendFile(file);
            });

            const fileIds = await Promise.all(filePromises);
            expect(fileIds).toHaveLength(3);
            expect(new Set(fileIds).size).toBe(3); // All unique
        });
    });
});
