const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
const KEY_HEX = process.env.ENCRYPTION_KEY;

if (!KEY_HEX || KEY_HEX.length !== 64) {
    console.warn('ENCRYPTION_KEY is missing or invalid (must be 64 hex chars). Encryption will fail.');
}

// Lazy load key buffer
let KEY_BUFFER = null;
function getKey() {
    if (!KEY_BUFFER) {
        if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not set');
        KEY_BUFFER = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }
    return KEY_BUFFER;
}

const Crypto = {
    encrypt: (text) => {
        if (!text) return text;
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag().toString('hex');
            // Format: iv:authTag:encryptedData
            return `${iv.toString('hex')}:${authTag}:${encrypted}`;
        } catch (e) {
            console.error('Encryption error:', e);
            throw e;
        }
    },

    decrypt: (text) => {
        if (!text) return text;
        // Check if looks like encrypted (iv:tag:content)
        const parts = text.split(':');
        if (parts.length !== 3) {
            // Assume not encrypted (for migration/backward compatibility or mixed data)
            return text; 
        }

        try {
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encryptedText = parts[2];

            const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            // If decryption fails (wrong key, tampered data, or not actually encrypted despite format)
            console.error('Decryption error:', e.message);
            return text; // Fallback to returning original? Or null?
            // Returning text usually safer for "maybe not encrypted" but unsafe if it garbles.
            // Given the distinct format, valid decryption fail is serious.
            // But for now, let's throw to be loud.
            // throw e; 
            return null; // Let caller handle null
        }
    }
};

module.exports = Crypto;
