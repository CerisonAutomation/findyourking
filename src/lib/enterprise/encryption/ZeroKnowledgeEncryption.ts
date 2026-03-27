export interface EncryptedPayload {
    iv: string
    ciphertext: string
    ephemeralPublicKey: string
}

export interface KeyPair {
    publicKey: string
    privateKey: string
}

export class ZeroKnowledgeEncryption {
    /**
     * Generate ECDH P-384 key pair for zero-knowledge encryption
     */
    static async generateKeyPair(): Promise<KeyPair> {
        const crypto = ZeroKnowledgeEncryption.getCrypto()

        try {
            const keyPair = await crypto.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: 'P-384',
                },
                true, // extractable
                ['deriveKey', 'deriveBits']
            )

            const publicKey = await crypto.exportKey('jwk', keyPair.publicKey)
            const privateKey = await crypto.exportKey('jwk', keyPair.privateKey)

            return {
                publicKey: JSON.stringify(publicKey),
                privateKey: JSON.stringify(privateKey),
            }
        } catch (error) {
            throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Encrypt plaintext using ECDH key derivation + AES-256-GCM
     */
    static async encrypt(
        plaintext: string,
        recipientPublicKey: string
    ): Promise<EncryptedPayload> {
        const crypto = ZeroKnowledgeEncryption.getCrypto()

        try {
            // Generate ephemeral key pair for this encryption
            const ephemeralKeyPair = await crypto.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: 'P-384',
                },
                true,
                ['deriveKey', 'deriveBits']
            )

            // Import recipient public key
            const recipientKey = await crypto.importKey(
                'jwk',
                JSON.parse(recipientPublicKey),
                {
                    name: 'ECDH',
                    namedCurve: 'P-384',
                },
                false,
                []
            )

            // Derive shared secret
            const sharedSecret = await crypto.deriveKey(
                {
                    name: 'ECDH',
                    public: recipientKey,
                },
                ephemeralKeyPair.privateKey,
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                false,
                ['encrypt']
            )

            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(12))

            // Encrypt the plaintext
            const encoder = new TextEncoder()
            const plaintextBytes = encoder.encode(plaintext)

            const ciphertext = await crypto.encrypt(
                {
                    name: 'AES-GCM',
                    iv,
                },
                sharedSecret,
                plaintextBytes
            )

            // Export ephemeral public key
            const ephemeralPublicKey = await crypto.exportKey('jwk', ephemeralKeyPair.publicKey)

            return {
                iv: ZeroKnowledgeEncryption.arrayBufferToBase64(iv),
                ciphertext: ZeroKnowledgeEncryption.arrayBufferToBase64(ciphertext),
                ephemeralPublicKey: JSON.stringify(ephemeralPublicKey),
            }
        } catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Decrypt payload using private key
     */
    static async decrypt(
        payload: EncryptedPayload,
        privateKey: string
    ): Promise<string> {
        const crypto = ZeroKnowledgeEncryption.getCrypto()

        try {
            // Import private key
            const privateKeyObj = await crypto.importKey(
                'jwk',
                JSON.parse(privateKey),
                {
                    name: 'ECDH',
                    namedCurve: 'P-384',
                },
                false,
                ['deriveKey', 'deriveBits']
            )

            // Import ephemeral public key
            const ephemeralPublicKey = await crypto.importKey(
                'jwk',
                JSON.parse(payload.ephemeralPublicKey),
                {
                    name: 'ECDH',
                    namedCurve: 'P-384',
                },
                false,
                []
            )

            // Derive shared secret
            const sharedSecret = await crypto.deriveKey(
                {
                    name: 'ECDH',
                    public: ephemeralPublicKey,
                },
                privateKeyObj,
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                false,
                ['decrypt']
            )

            // Decrypt the ciphertext
            const iv = ZeroKnowledgeEncryption.base64ToArrayBuffer(payload.iv)
            const ciphertext = ZeroKnowledgeEncryption.base64ToArrayBuffer(payload.ciphertext)

            const plaintext = await crypto.decrypt(
                {
                    name: 'AES-GCM',
                    iv,
                },
                sharedSecret,
                ciphertext
            )

            // Convert bytes back to string
            const decoder = new TextDecoder()
            return decoder.decode(plaintext)
        } catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Generate a secure random key for symmetric encryption
     */
    static async generateSymmetricKey(): Promise<string> {
        const crypto = ZeroKnowledgeEncryption.getCrypto()

        try {
            const key = await crypto.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                true,
                ['encrypt', 'decrypt']
            )

            const exportedKey = await crypto.exportKey('jwk', key)
            return JSON.stringify(exportedKey)
        } catch (error) {
            throw new Error(`Failed to generate symmetric key: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Encrypt with symmetric key
     */
    static async encryptSymmetric(
        plaintext: string,
        symmetricKey: string
    ): Promise<{ ciphertext: string; iv: string }> {
        const crypto = ZeroKnowledgeEncryption.getCrypto()

        try {
            const key = await crypto.importKey(
                'jwk',
                JSON.parse(symmetricKey),
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                false,
                ['encrypt']
            )

            const iv = crypto.getRandomValues(new Uint8Array(12))
            const encoder = new TextEncoder()
            const plaintextBytes = encoder.encode(plaintext)

            const ciphertext = await crypto.encrypt(
                {
                    name: 'AES-GCM',
                    iv,
                },
                key,
                plaintextBytes
            )

            return {
                ciphertext: ZeroKnowledgeEncryption.arrayBufferToBase64(ciphertext),
                iv: ZeroKnowledgeEncryption.arrayBufferToBase64(iv),
            }
        } catch (error) {
            throw new Error(`Symmetric encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Decrypt with symmetric key
     */
    static async decryptSymmetric(
        ciphertext: string,
        iv: string,
        symmetricKey: string
    ): Promise<string> {
        const crypto = ZeroKnowledgeEncryption.getCrypto()

        try {
            const key = await crypto.importKey(
                'jwk',
                JSON.parse(symmetricKey),
                {
                    name: 'AES-GCM',
                    length: 256,
                },
                false,
                ['decrypt']
            )

            const ivBuffer = ZeroKnowledgeEncryption.base64ToArrayBuffer(iv)
            const ciphertextBuffer = ZeroKnowledgeEncryption.base64ToArrayBuffer(ciphertext)

            const plaintext = await crypto.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivBuffer,
                },
                key,
                ciphertextBuffer
            )

            const decoder = new TextDecoder()
            return decoder.decode(plaintext)
        } catch (error) {
            throw new Error(`Symmetric decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Generate a secure random string for tokens or salts
     */
    static generateRandomString(length: number = 32): string {
        const crypto = ZeroKnowledgeEncryption.getCrypto()
        const array = new Uint8Array(length)
        crypto.getRandomValues(array)

        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    /**
     * Hash a string using SHA-256
     */
    static async hash(input: string): Promise<string> {
        const crypto = ZeroKnowledgeEncryption.getCrypto()

        try {
            const encoder = new TextEncoder()
            const data = encoder.encode(input)
            const hashBuffer = await crypto.digest('SHA-256', data)
            return ZeroKnowledgeEncryption.arrayBufferToBase64(hashBuffer)
        } catch (error) {
            throw new Error(`Hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Verify that two inputs match using constant-time comparison
     */
    static constantTimeCompare(a: string, b: string): boolean {
        if (a.length !== b.length) {
            return false
        }

        let result = 0
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i)
        }

        return result === 0
    }

    private static isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof window.crypto !== 'undefined'
    }

    private static getCrypto(): any {
        if (ZeroKnowledgeEncryption.isBrowser()) {
            return window.crypto.subtle
        }
        return require('crypto').webcrypto.subtle
    }

    /**
     * Utility: Convert ArrayBuffer to Base64 string
     */
    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }

    /**
     * Utility: Convert Base64 string to ArrayBuffer
     */
    private static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
        }
        return bytes.buffer
    }
}