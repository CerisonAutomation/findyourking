// Web Crypto API utilities for end-to-end message encryption
export class MessageCrypto {
  private static readonly algorithm = {
    name: 'AES-GCM',
    length: 256
  };

  // Generate a new encryption key for a conversation
  static async generateConversationKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      this.algorithm,
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  // Export key for storage (base64 encoded)
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  // Import key from storage
  static async importKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      this.algorithm,
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt a message
  static async encryptMessage(message: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm.name,
        iv: iv
      },
      key,
      data
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer)
    };
  }

  // Decrypt a message
  static async decryptMessage(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
    const encrypted = this.base64ToArrayBuffer(encryptedData);
    const ivBuffer = this.base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm.name,
        iv: ivBuffer
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Generate key pair for asymmetric encryption (for key exchange)
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['deriveKey', 'deriveBits']
    );
  }

  // Derive shared secret from private key and public key
  static async deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: publicKey
      },
      privateKey,
      256
    );

    // Import as AES key
    return await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      this.algorithm,
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Export public key
  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', key);
    return this.arrayBufferToBase64(exported);
  }

  // Import public key
  static async importPublicKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    return await crypto.subtle.importKey(
      'spki',
      keyBuffer,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      []
    );
  }

  // Utility functions
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Hash function for message integrity
  static async hashMessage(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hash);
  }

  // Verify message integrity
  static async verifyMessageIntegrity(message: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.hashMessage(message);
    return actualHash === expectedHash;
  }
}

// Conversation key management
export class ConversationKeyManager {
  private static readonly STORAGE_KEY_PREFIX = 'conversation_key_';

  // Store conversation key securely
  static async storeConversationKey(conversationId: string, key: CryptoKey): Promise<void> {
    const keyData = await MessageCrypto.exportKey(key);
    const storageKey = this.STORAGE_KEY_PREFIX + conversationId;

    // In a real app, this should use a secure storage mechanism
    // For now, we'll use localStorage with a warning
    console.warn('Using localStorage for encryption keys - this is not secure for production!');
    localStorage.setItem(storageKey, keyData);
  }

  // Retrieve conversation key
  static async getConversationKey(conversationId: string): Promise<CryptoKey | null> {
    const storageKey = this.STORAGE_KEY_PREFIX + conversationId;
    const keyData = localStorage.getItem(storageKey);

    if (!keyData) return null;

    try {
      return await MessageCrypto.importKey(keyData);
    } catch (error) {
      console.error('Failed to import conversation key:', error);
      return null;
    }
  }

  // Generate and store key for new conversation
  static async initializeConversationKey(conversationId: string): Promise<CryptoKey> {
    const key = await MessageCrypto.generateConversationKey();
    await this.storeConversationKey(conversationId, key);
    return key;
  }

  // Get or create conversation key
  static async getOrCreateConversationKey(conversationId: string): Promise<CryptoKey> {
    let key = await this.getConversationKey(conversationId);
    if (!key) {
      key = await this.initializeConversationKey(conversationId);
    }
    return key;
  }
}

// Encrypted message structure
export interface EncryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  encryptedContent: string;
  iv: string;
  hash: string;
  createdAt: string;
  messageType: 'text' | 'image' | 'voice';
  metadata?: any;
}

// Message encryption/decryption utilities
export class MessageEncryption {
  static async encrypt(message: string, conversationId: string): Promise<{ encryptedContent: string; iv: string; hash: string }> {
    const key = await ConversationKeyManager.getOrCreateConversationKey(conversationId);
    const { encrypted, iv } = await MessageCrypto.encryptMessage(message, key);
    const hash = await MessageCrypto.hashMessage(message);

    return {
      encryptedContent: encrypted,
      iv,
      hash
    };
  }

  static async decrypt(encryptedContent: string, iv: string, hash: string, conversationId: string): Promise<string> {
    const key = await ConversationKeyManager.getConversationKey(conversationId);
    if (!key) {
      throw new Error('Conversation key not found');
    }

    const decrypted = await MessageCrypto.decryptMessage(encryptedContent, iv, key);

    // Verify integrity
    const isValid = await MessageCrypto.verifyMessageIntegrity(decrypted, hash);
    if (!isValid) {
      throw new Error('Message integrity check failed');
    }

    return decrypted;
  }
}