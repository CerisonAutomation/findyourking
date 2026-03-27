import "@testing-library/jest-dom";
import {vi} from "vitest";

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
}

Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: MockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock geolocation
const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, "geolocation", {
    value: mockGeolocation,
    writable: true,
});

// Mock WebRTC
class MockRTCPeerConnection {
    localDescription: RTCSessionDescription | null = null;
    remoteDescription: RTCSessionDescription | null = null;
    connectionState: RTCPeerConnectionState = "new";
    iceConnectionState: RTCIceConnectionState = "new";
    iceGatheringState: RTCIceGatheringState = "new";
    signalingState: RTCSignalingState = "stable";

    onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
    ontrack: ((event: RTCTrackEvent) => void) | null = null;
    onconnectionstatechange: (() => void) | null = null;
    oniceconnectionstatechange: (() => void) | null = null;
    onicegatheringstatechange: (() => void) | null = null;
    onsignalingstatechange: (() => void) | null = null;

    addTrack = vi.fn().mockReturnValue(new MockMediaStreamTrack());
    removeTrack = vi.fn();
    addIceCandidate = vi.fn().mockResolvedValue(undefined);
    createOffer = vi.fn().mockResolvedValue({type: "offer", sdp: "mock-sdp"});
    createAnswer = vi.fn().mockResolvedValue({type: "answer", sdp: "mock-sdp"});
    setLocalDescription = vi.fn().mockResolvedValue(undefined);
    setRemoteDescription = vi.fn().mockResolvedValue(undefined);
    close = vi.fn();
    getStats = vi.fn().mockResolvedValue(new Map());
}

class MockMediaStreamTrack {
    kind = "audio";
    id = "mock-track-id";
    label = "Mock Track";
    enabled = true;
    muted = false;
    readyState: MediaStreamTrackState = "live";

    stop = vi.fn();
    clone = vi.fn().mockReturnValue(new MockMediaStreamTrack());
}

class MockMediaStream {
    id = "mock-stream-id";
    active = true;
    getTracks = vi.fn().mockReturnValue([new MockMediaStreamTrack()]);
    getAudioTracks = vi.fn().mockReturnValue([new MockMediaStreamTrack()]);
    getVideoTracks = vi.fn().mockReturnValue([]);
    addTrack = vi.fn();
    removeTrack = vi.fn();
    clone = vi.fn().mockReturnValue(new MockMediaStream());
}

Object.defineProperty(global, "RTCPeerConnection", {
    writable: true,
    value: MockRTCPeerConnection,
});

Object.defineProperty(global, "MediaStream", {
    writable: true,
    value: MockMediaStream,
});

// Mock mediaDevices
Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
        getUserMedia: vi.fn().mockResolvedValue(new MockMediaStream()),
        getDisplayMedia: vi.fn().mockResolvedValue(new MockMediaStream()),
        enumerateDevices: vi.fn().mockResolvedValue([]),
    },
    writable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
    value: {
        randomUUID: vi.fn(() => "mock-uuid-1234-5678"),
        getRandomValues: vi.fn((arr: Uint8Array) => arr),
    },
    writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};

Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
});

// Mock sessionStorage
Object.defineProperty(global, "sessionStorage", {
    value: localStorageMock,
    writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(global.URL, "createObjectURL", {
    value: vi.fn(() => "mock-object-url"),
    writable: true,
});

Object.defineProperty(global.URL, "revokeObjectURL", {
    value: vi.fn(),
    writable: true,
});

// Export mocks for use in tests
export {
    MockIntersectionObserver,
    MockResizeObserver,
    MockRTCPeerConnection,
    MockMediaStream,
    MockMediaStreamTrack,
    mockGeolocation,
    localStorageMock,
};