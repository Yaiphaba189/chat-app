// lib/crypto.ts

export async function generateKeyPair() {
    return window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", key); // Public key
    return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
    return window.crypto.subtle.exportKey("jwk", key);
}

export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
    const binaryDer = base64ToArrayBuffer(base64Key);
    return window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
}

export async function generateSessionKey() {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptMessage(
    message: string,
    sessionKey: CryptoKey,
    recipientPublicKey: CryptoKey
) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt content with AES-GCM
    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        sessionKey,
        data
    );

    // Export session key to raw bytes
    const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);

    // Encrypt session key with RSA-OAEP
    const encryptedKey = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        recipientPublicKey,
        rawSessionKey
    );

    return {
        content: arrayBufferToBase64(encryptedContent),
        encryptedKey: arrayBufferToBase64(encryptedKey),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

export async function decryptMessage(
    encryptedContentBase64: string,
    encryptedKeyBase64: string,
    ivBase64: string,
    privateKey: CryptoKey
) {
    const encryptedKey = base64ToArrayBuffer(encryptedKeyBase64);
    const encryptedContent = base64ToArrayBuffer(encryptedContentBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    // Decrypt session key
    const rawSessionKey = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
        },
        privateKey,
        encryptedKey
    );

    // Import session key
    const sessionKey = await window.crypto.subtle.importKey(
        "raw",
        rawSessionKey,
        {
            name: "AES-GCM",
        },
        true,
        ["decrypt"]
    );

    // Decrypt content
    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        sessionKey,
        encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
}

// Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
