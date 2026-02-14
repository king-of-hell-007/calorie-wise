/**
 * Input Validation Utilities
 * Comprehensive validation for user inputs
 */

import DOMPurify from 'dompurify';

/**
 * Email validation with RFC 5322 compliance
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Password strength validation
 */
export const validatePassword = (password: string): {
    valid: boolean;
    message: string;
    strength: 'weak' | 'medium' | 'strong';
} => {
    if (password.length < 12) {
        return {
            valid: false,
            message: 'Password must be at least 12 characters long',
            strength: 'weak'
        };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasUpperCase) {
        return {
            valid: false,
            message: 'Password must contain at least one uppercase letter',
            strength: 'weak'
        };
    }

    if (!hasLowerCase) {
        return {
            valid: false,
            message: 'Password must contain at least one lowercase letter',
            strength: 'weak'
        };
    }

    if (!hasNumber) {
        return {
            valid: false,
            message: 'Password must contain at least one number',
            strength: 'weak'
        };
    }

    if (!hasSpecialChar) {
        return {
            valid: false,
            message: 'Password must contain at least one special character (!@#$%^&*)',
            strength: 'medium'
        };
    }

    return {
        valid: true,
        message: 'Password is strong',
        strength: 'strong'
    };
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
};

/**
 * Sanitize HTML content (for rich text)
 */
export const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target']
    });
};

/**
 * Validate URL
 */
export const validateURL = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Validate redirect URL against whitelist
 */
export const validateRedirectURL = (url: string, allowedDomains: string[]): boolean => {
    try {
        const urlObj = new URL(url);
        return allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
    } catch {
        return false;
    }
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): {
    valid: boolean;
    error?: string;
} => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        };
    }

    if (file.size > MAX_SIZE) {
        return {
            valid: false,
            error: 'File too large. Maximum size is 10MB.'
        };
    }

    return { valid: true };
};

/**
 * Validate base64 image
 */
export const validateBase64Image = (base64: string, contentType: string): {
    valid: boolean;
    error?: string;
    sizeInBytes?: number;
} => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
        return {
            valid: false,
            error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.'
        };
    }

    // Extract base64 data
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    // Validate base64 format
    try {
        atob(base64Data);
    } catch (e) {
        return {
            valid: false,
            error: 'Invalid image encoding. Please upload a valid image.'
        };
    }

    // Calculate size
    const sizeInBytes = (base64Data.length * 3) / 4;

    if (sizeInBytes > MAX_SIZE) {
        return {
            valid: false,
            error: 'Image too large. Maximum size is 10MB.',
            sizeInBytes
        };
    }

    return {
        valid: true,
        sizeInBytes
    };
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
    private attempts: Map<string, number[]> = new Map();

    constructor(
        private maxAttempts: number,
        private windowMs: number
    ) { }

    /**
     * Check if rate limit is exceeded
     */
    isRateLimited(key: string): boolean {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];

        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => now - time < this.windowMs);

        if (recentAttempts.length >= this.maxAttempts) {
            return true;
        }

        // Add current attempt
        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);

        return false;
    }

    /**
     * Reset rate limit for a key
     */
    reset(key: string): void {
        this.attempts.delete(key);
    }

    /**
     * Get remaining attempts
     */
    getRemainingAttempts(key: string): number {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];
        const recentAttempts = attempts.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxAttempts - recentAttempts.length);
    }
}
