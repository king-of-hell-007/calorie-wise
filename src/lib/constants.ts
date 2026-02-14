/**
 * Application Constants
 * Centralized configuration to eliminate magic numbers
 */

// ============================================
// MEAL TIMING CONSTANTS
// ============================================

export const MEAL_TIMES = {
    BREAKFAST_START: 6,
    BREAKFAST_END: 11,
    LUNCH_START: 11,
    LUNCH_END: 15,
    DINNER_START: 15,
    DINNER_END: 21,
} as const;

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const getMealSlot = (hour: number): MealSlot => {
    if (hour >= MEAL_TIMES.BREAKFAST_START && hour < MEAL_TIMES.BREAKFAST_END) {
        return 'breakfast';
    }
    if (hour >= MEAL_TIMES.LUNCH_START && hour < MEAL_TIMES.LUNCH_END) {
        return 'lunch';
    }
    if (hour >= MEAL_TIMES.DINNER_START && hour < MEAL_TIMES.DINNER_END) {
        return 'dinner';
    }
    return 'snack';
};

// ============================================
// POINTS SYSTEM
// ============================================

export const POINTS = {
    MEAL_LOGGED: 10,
    WATER_LOGGED: 5,
    STREAK_MILESTONE: 50,
    FRIEND_JOINED: 50,
    RECIPE_CREATED: 15,
    CHALLENGE_COMPLETED: 100,
} as const;

// ============================================
// RATE LIMITING
// ============================================

export const RATE_LIMITS = {
    FRIEND_REQUESTS: {
        MAX_ATTEMPTS: 10,
        WINDOW_MINUTES: 60,
    },
    PASSWORD_RESET: {
        MAX_ATTEMPTS: 3,
        WINDOW_MINUTES: 60,
    },
    LOGIN_ATTEMPTS: {
        MAX_ATTEMPTS: 5,
        WINDOW_MINUTES: 15,
    },
    IMAGE_UPLOAD: {
        MAX_ATTEMPTS: 20,
        WINDOW_MINUTES: 60,
    },
} as const;

// ============================================
// FILE UPLOAD CONSTRAINTS
// ============================================

export const FILE_UPLOAD = {
    MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    MAX_SIZE_MB: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'],
} as const;

// ============================================
// PASSWORD REQUIREMENTS
// ============================================

export const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

// ============================================
// SESSION & AUTH
// ============================================

export const AUTH = {
    SESSION_TIMEOUT_HOURS: 24,
    REFRESH_TOKEN_DAYS: 30,
    EMAIL_VERIFICATION_TIMEOUT_HOURS: 24,
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    LEADERBOARD_SIZE: 50,
    ACTIVITY_FEED_SIZE: 30,
} as const;

// ============================================
// STREAK SYSTEM
// ============================================

export const STREAKS = {
    SHIELD_COST: 100, // points
    MAX_SHIELDS: 3,
    MILESTONE_DAYS: [7, 14, 30, 60, 90, 180, 365],
} as const;

// ============================================
// WATER TRACKING
// ============================================

export const WATER = {
    DEFAULT_GOAL_ML: 2000,
    MIN_GOAL_ML: 500,
    MAX_GOAL_ML: 5000,
    STANDARD_SERVING_ML: 250,
} as const;

// ============================================
// NUTRITION GOALS
// ============================================

export const NUTRITION_GOALS = {
    DEFAULT_CALORIES: 2000,
    MIN_CALORIES: 1200,
    MAX_CALORIES: 4000,
    DEFAULT_PROTEIN_PERCENT: 30,
    DEFAULT_CARBS_PERCENT: 40,
    DEFAULT_FAT_PERCENT: 30,
} as const;

// ============================================
// API TIMEOUTS
// ============================================

export const API_TIMEOUTS = {
    GEMINI_REQUEST_MS: 30000, // 30 seconds
    SUPABASE_QUERY_MS: 10000, // 10 seconds
    IMAGE_UPLOAD_MS: 60000, // 60 seconds
} as const;

// ============================================
// CACHE DURATIONS
// ============================================

export const CACHE_DURATION = {
    ANALYTICS_MINUTES: 15,
    LEADERBOARD_MINUTES: 5,
    PROFILE_MINUTES: 10,
    RECIPES_MINUTES: 30,
} as const;

// ============================================
// UI CONSTANTS
// ============================================

export const UI = {
    TOAST_DURATION_MS: 3000,
    DEBOUNCE_SEARCH_MS: 300,
    ANIMATION_DURATION_MS: 200,
    MAX_TOAST_STACK: 3,
} as const;

// ============================================
// ALLOWED DOMAINS (for redirects, CORS, etc.)
// ============================================

export const ALLOWED_DOMAINS = {
    PRODUCTION: ['https://your-production-domain.com'],
    DEVELOPMENT: ['http://localhost:5173', 'http://localhost:3000'],
} as const;

export const getAllowedOrigins = (): string[] => {
    const isDev = import.meta.env.DEV;
    return isDev
        ? [...ALLOWED_DOMAINS.DEVELOPMENT, ...ALLOWED_DOMAINS.PRODUCTION]
        : [...ALLOWED_DOMAINS.PRODUCTION];
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
    INVALID_INPUT: 'Invalid input. Please check your data.',
    SERVER_ERROR: 'Server error. Please try again later.',
    IMAGE_TOO_LARGE: `Image too large. Maximum size is ${FILE_UPLOAD.MAX_SIZE_MB}MB.`,
    INVALID_IMAGE_FORMAT: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.',
    WEAK_PASSWORD: 'Password does not meet security requirements.',
    INVALID_EMAIL: 'Please enter a valid email address.',
} as const;

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
    MEAL_LOGGED: 'Meal logged successfully!',
    WATER_LOGGED: 'Water intake logged!',
    FRIEND_ADDED: 'Friend request sent!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    RECIPE_SAVED: 'Recipe saved!',
    SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
    ENABLE_SOCIAL: true,
    ENABLE_CHALLENGES: true,
    ENABLE_RECIPES: true,
    ENABLE_MEAL_PLANNER: true,
    ENABLE_FITBIT_INTEGRATION: false, // Not implemented yet
    ENABLE_BARCODE_SCANNER: false, // Not implemented yet
} as const;

// ============================================
// ANALYTICS EVENTS
// ============================================

export const ANALYTICS_EVENTS = {
    MEAL_LOGGED: 'meal_logged',
    WATER_LOGGED: 'water_logged',
    FRIEND_ADDED: 'friend_added',
    RECIPE_CREATED: 'recipe_created',
    CHALLENGE_JOINED: 'challenge_joined',
    STREAK_MILESTONE: 'streak_milestone',
    SHIELD_PURCHASED: 'shield_purchased',
} as const;

// ============================================
// EXPORT ALL
// ============================================

export const CONSTANTS = {
    MEAL_TIMES,
    POINTS,
    RATE_LIMITS,
    FILE_UPLOAD,
    PASSWORD_REQUIREMENTS,
    AUTH,
    PAGINATION,
    STREAKS,
    WATER,
    NUTRITION_GOALS,
    API_TIMEOUTS,
    CACHE_DURATION,
    UI,
    ALLOWED_DOMAINS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    FEATURES,
    ANALYTICS_EVENTS,
} as const;

export default CONSTANTS;
