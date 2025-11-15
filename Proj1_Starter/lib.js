"use strict";

/**
 * Converts a plaintext string into a buffer for use in SubtleCrypto functions.
 */
function stringToBuffer(str) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str);
    } else {
        // Browser fallback: use TextEncoder
        return new TextEncoder().encode(str);
    }
}

/**
 * Converts a buffer object representing string data back into a string
 */
function bufferToString(buf) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(buf).toString();
    } else {
        // Browser fallback: use TextDecoder
        return new TextDecoder().decode(buf);
    }
}

/**
 * Converts a buffer to a Base64 string
 */
function encodeBuffer(buf) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(buf).toString('base64');
    } else {
        // Browser fallback
        if (buf instanceof Uint8Array) {
            return btoa(String.fromCharCode(...buf));
        } else {
            return btoa(String.fromCharCode(...new Uint8Array(buf)));
        }
    }
}

/**
 * Converts a Base64 string back into a buffer
 */
function decodeBuffer(base64) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, "base64");
    } else {
        // Browser fallback
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
}

/**
 * Generates a buffer of random bytes
 */
function getRandomBytes(len) {
    if (typeof window !== 'undefined' && window.crypto) {
        return window.crypto.getRandomValues(new Uint8Array(len));
    } else if (typeof crypto !== 'undefined') {
        return crypto.getRandomValues(new Uint8Array(len));
    } else {
        throw new Error("Cryptographic randomness not available");
    }
}

module.exports = {
    stringToBuffer,
    bufferToString,
    encodeBuffer,
    decodeBuffer,
    getRandomBytes
}
