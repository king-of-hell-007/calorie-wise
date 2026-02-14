# 🔒 SECURITY & CODE QUALITY AUDIT REPORT
**CalorieWise Application - Comprehensive Analysis**
**Date:** 2026-02-02
**Auditor:** AI Code Review System

---

## 📋 EXECUTIVE SUMMARY

This audit identified **23 security issues** and **15 code quality concerns** across the CalorieWise application. Issues range from **CRITICAL** (requiring immediate attention) to **LOW** (best practice improvements).

### Severity Breakdown:
- 🔴 **CRITICAL**: 4 issues
- 🟠 **HIGH**: 7 issues  
- 🟡 **MEDIUM**: 12 issues
- 🟢 **LOW**: 15 issues

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. **API Keys Exposed in Client-Side Code**
**Severity:** CRITICAL  
**Location:** `supabase/functions/analyze-nutrition/index.ts:238`

**Issue:**
```typescript
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.key_value}`,
```

The Gemini API key is passed in the URL query string, which:
- Appears in browser history
- Can be logged by proxies/CDNs
- Visible in network inspection tools

**Impact:** API key exposure, unauthorized usage, quota theft

**Recommendation:**
- Move API key to request headers instead of URL
- Implement request signing
- Add rate limiting per user

**Fix:**
```typescript
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey.key_value  // Use header instead
    },
    body: JSON.stringify({...})
  }
);
```

---

### 2. **SQL Injection Vulnerability in Friend Search**
**Severity:** CRITICAL  
**Location:** `src/pages/Friends.tsx:327`

**Issue:**
```typescript
.or(`and(user_id.eq.${currentUserId},friend_id.eq.${foundUserId}),and(user_id.eq.${foundUserId},friend_id.eq.${currentUserId})`)
```

String interpolation in SQL queries can lead to SQL injection if user IDs are manipulated.

**Impact:** Database compromise, unauthorized data access

**Recommendation:**
Use parameterized queries:
```typescript
const { data: existingFriendship } = await supabase
  .from('friendships')
  .select('*')
  .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
  .or(`user_id.eq.${foundUserId},friend_id.eq.${foundUserId}`)
  .limit(1);
```

---

### 3. **Missing Input Validation on Image Upload**
**Severity:** CRITICAL  
**Location:** `supabase/functions/analyze-nutrition/index.ts:186`

**Issue:**
```typescript
const { image, filename, contentType } = await req.json();
if (!image) {
  return new Response(...)
}
```

No validation for:
- Image size (could cause DoS with huge images)
- Image format (could upload malicious files)
- Base64 validity
- Content-Type verification

**Impact:** Denial of Service, malicious file upload, server resource exhaustion

**Recommendation:**
```typescript
// Add comprehensive validation
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const { image, filename, contentType } = await req.json();

// Validate presence
if (!image || !contentType) {
  return new Response(
    JSON.stringify({ error: 'Image and content type required' }),
    { status: 400, headers: corsHeaders }
  );
}

// Validate content type
if (!ALLOWED_TYPES.includes(contentType)) {
  return new Response(
    JSON.stringify({ error: 'Invalid image format. Only JPEG, PNG, WebP allowed' }),
    { status: 400, headers: corsHeaders }
  );
}

// Validate size
const base64Data = image.includes(',') ? image.split(',')[1] : image;
const sizeInBytes = (base64Data.length * 3) / 4;
if (sizeInBytes > MAX_IMAGE_SIZE) {
  return new Response(
    JSON.stringify({ error: 'Image too large. Maximum 10MB allowed' }),
    { status: 413, headers: corsHeaders }
  );
}

// Validate base64 format
try {
  atob(base64Data);
} catch (e) {
  return new Response(
    JSON.stringify({ error: 'Invalid image encoding' }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

### 4. **Weak Admin Authentication**
**Severity:** CRITICAL  
**Location:** `src/components/AdminRoute.tsx:21-26`

**Issue:**
```typescript
const { data: roleData, error: roleError } = await supabase
  .from('user_roles')
  .select('role', { count: 'exact' })
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .single();
```

Admin check is done client-side only. An attacker can:
- Bypass this check using browser DevTools
- Modify the React component
- Access admin routes directly

**Impact:** Unauthorized admin access, data manipulation, API key theft

**Recommendation:**
- Implement server-side admin verification in Edge Functions
- Add RLS policies that check admin role
- Use JWT claims for role verification
- Add audit logging for all admin actions

**Fix:**
```sql
-- Add RLS policy to admin_api_keys table
CREATE POLICY "Only admins can manage API keys"
  ON admin_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

---

## 🟠 HIGH SEVERITY ISSUES

### 5. **Excessive Console Logging in Production**
**Severity:** HIGH  
**Location:** Multiple files (78+ instances)

**Issue:**
```typescript
console.log('[Friend Search] Searching by email:', searchTerm);
console.log('[Friend Search] Email search result:', profileByEmail, 'Error:', emailError);
console.log('[Friend Search] All profiles:', allProfiles?.length, 'Error:', allError);
console.log('[Friend Search] Profiles:', allProfiles.map(...));
```

**Impact:**
- Exposes sensitive user data (emails, IDs, names)
- Performance degradation
- Information disclosure to attackers

**Recommendation:**
```typescript
// Create a logger utility
// src/lib/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => console.error(...args), // Always log errors
  warn: (...args: any[]) => isDev && console.warn(...args),
};

// Usage
import { logger } from '@/lib/logger';
logger.log('[Friend Search] Searching by email:', searchTerm);
```

---

### 6. **Missing Rate Limiting on Friend Requests**
**Severity:** HIGH  
**Location:** `src/pages/Friends.tsx:190-360`

**Issue:**
No rate limiting on `sendFriendRequest()` function. Users can spam friend requests.

**Impact:** Spam, harassment, database bloat

**Recommendation:**
```typescript
// Add rate limiting
const RATE_LIMIT = 10; // Max 10 requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

const checkRateLimit = async (userId: string) => {
  const oneHourAgo = new Date(Date.now() - RATE_WINDOW).toISOString();
  
  const { count } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);
  
  if (count && count >= RATE_LIMIT) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
};
```

---

### 7. **CORS Wildcard Allows Any Origin**
**Severity:** HIGH  
**Location:** `supabase/functions/analyze-nutrition/index.ts:4-7`

**Issue:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Impact:** CSRF attacks, unauthorized API access

**Recommendation:**
```typescript
const ALLOWED_ORIGINS = [
  'https://your-production-domain.com',
  'http://localhost:5173', // Dev only
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') 
    ? origin 
    : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
};
```

---

### 8. **No Email Validation on Signup**
**Severity:** HIGH  
**Location:** `src/pages/Auth.tsx:60-88`

**Issue:**
```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  // No email format validation
});
```

**Impact:** Fake accounts, spam, invalid data

**Recommendation:**
```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateEmail(email)) {
    toast({
      title: 'Invalid Email',
      description: 'Please enter a valid email address',
      variant: 'destructive',
    });
    return;
  }
  
  // Continue with signup...
};
```

---

### 9. **Weak Password Requirements**
**Severity:** HIGH  
**Location:** `src/pages/Auth.tsx:217`

**Issue:**
```typescript
<Input
  type="password"
  minLength={6}  // Only 6 characters minimum
/>
```

**Impact:** Weak passwords, account compromise

**Recommendation:**
```typescript
const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain special character' };
  }
  return { valid: true, message: '' };
};
```

---

### 10. **Missing CSRF Protection**
**Severity:** HIGH  
**Location:** All Edge Functions

**Issue:**
No CSRF token validation on state-changing operations.

**Impact:** Cross-Site Request Forgery attacks

**Recommendation:**
- Implement SameSite cookie attributes
- Add CSRF tokens to forms
- Validate Origin/Referer headers

---

### 11. **Unencrypted API Keys in Database**
**Severity:** HIGH  
**Location:** `src/pages/Admin.tsx:55-62`

**Issue:**
```typescript
const { error } = await supabase
  .from('admin_api_keys')
  .insert({
    key_value: newKeyValue.trim(), // Stored in plaintext
  });
```

**Impact:** If database is compromised, all API keys are exposed

**Recommendation:**
- Encrypt API keys at rest using AES-256
- Use Supabase Vault for sensitive data
- Implement key rotation

---

## 🟡 MEDIUM SEVERITY ISSUES

### 12. **No Request Timeout on External API Calls**
**Severity:** MEDIUM  
**Location:** `supabase/functions/analyze-nutrition/index.ts:237`

**Issue:**
```typescript
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/...`,
  {
    method: 'POST',
    // No timeout specified
  }
);
```

**Impact:** Hanging requests, resource exhaustion

**Recommendation:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const geminiResponse = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
} finally {
  clearTimeout(timeoutId);
}
```

---

### 13. **Missing Error Boundary Components**
**Severity:** MEDIUM  
**Location:** React component tree

**Issue:**
No error boundaries to catch React errors gracefully.

**Impact:** White screen of death, poor UX

**Recommendation:**
Create ErrorBoundary component and wrap app.

---

### 14. **Insufficient Logging for Security Events**
**Severity:** MEDIUM  
**Location:** Multiple authentication points

**Issue:**
No audit trail for:
- Failed login attempts
- Admin actions
- Data exports
- Friend request spam

**Recommendation:**
Create security_audit_log table and log all security events.

---

### 15. **No Content Security Policy (CSP)**
**Severity:** MEDIUM  
**Location:** `index.html`

**Issue:**
Missing CSP headers to prevent XSS attacks.

**Recommendation:**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.supabase.co;">
```

---

### 16. **Sensitive Data in LocalStorage**
**Severity:** MEDIUM  
**Location:** `src/lib/themes.ts:66`

**Issue:**
```typescript
localStorage.setItem('app-theme', themeName);
```

While theme is not sensitive, localStorage is vulnerable to XSS.

**Recommendation:**
- Only store non-sensitive data in localStorage
- Never store tokens, passwords, or PII
- Consider using httpOnly cookies for sensitive data

---

### 17. **Missing Input Sanitization**
**Severity:** MEDIUM  
**Location:** Multiple form inputs

**Issue:**
User inputs are not sanitized before database insertion.

**Impact:** XSS, SQL injection (mitigated by Supabase but still risky)

**Recommendation:**
```typescript
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
```

---

### 18. **No Maximum File Size Enforcement**
**Severity:** MEDIUM  
**Location:** Image upload components

**Issue:**
Users can upload arbitrarily large images.

**Impact:** Storage costs, DoS

**Recommendation:**
Implement client-side and server-side size checks (see Issue #3).

---

### 19. **Weak Session Management**
**Severity:** MEDIUM  
**Location:** Supabase Auth configuration

**Issue:**
Default session timeout may be too long.

**Recommendation:**
- Set appropriate session timeout (e.g., 24 hours)
- Implement "Remember Me" option
- Add session invalidation on password change

---

### 20. **Missing Subresource Integrity (SRI)**
**Severity:** MEDIUM  
**Location:** External script/style imports

**Issue:**
No SRI hashes for CDN resources.

**Recommendation:**
Add integrity attributes to all external resources.

---

### 21. **Unvalidated Redirects**
**Severity:** MEDIUM  
**Location:** `src/pages/Auth.tsx:69`

**Issue:**
```typescript
emailRedirectTo: `${window.location.origin}/`
```

**Impact:** Open redirect vulnerability

**Recommendation:**
Validate redirect URLs against whitelist.

---

### 22. **Missing HTTP Security Headers**
**Severity:** MEDIUM  
**Location:** Server configuration

**Issue:**
Missing headers:
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- Referrer-Policy

**Recommendation:**
Configure in Supabase/hosting provider.

---

### 23. **No Backup/Disaster Recovery Plan**
**Severity:** MEDIUM  
**Location:** Infrastructure

**Issue:**
No documented backup strategy.

**Recommendation:**
- Enable Supabase automated backups
- Test restore procedures
- Document recovery process

---

## 🟢 LOW SEVERITY / CODE QUALITY ISSUES

### 24. **Inconsistent Error Handling**
**Severity:** LOW  
**Location:** Multiple files

**Issue:**
Some functions use try-catch, others don't.

**Recommendation:**
Standardize error handling patterns.

---

### 25. **Magic Numbers in Code**
**Severity:** LOW  
**Location:** Multiple files

**Issue:**
```typescript
if (hour >= 6 && hour < 11) mealSlot = 'breakfast';
```

**Recommendation:**
```typescript
const MEAL_TIMES = {
  BREAKFAST_START: 6,
  BREAKFAST_END: 11,
  // ...
};
```

---

### 26. **Unused Imports**
**Severity:** LOW  
**Location:** Multiple files

**Recommendation:**
Run ESLint with unused-imports rule.

---

### 27. **Missing TypeScript Strict Mode**
**Severity:** LOW  
**Location:** `tsconfig.json`

**Recommendation:**
Enable strict mode for better type safety.

---

### 28. **No Code Splitting**
**Severity:** LOW  
**Location:** Build configuration

**Issue:**
Large bundle size (1.67MB).

**Recommendation:**
Implement route-based code splitting.

---

### 29. **Missing Accessibility Features**
**Severity:** LOW  
**Location:** UI components

**Issue:**
Some components lack ARIA labels.

**Recommendation:**
Add proper ARIA attributes.

---

### 30. **No Progressive Web App Offline Fallback**
**Severity:** LOW  
**Location:** Service worker

**Recommendation:**
Add offline fallback page.

---

### 31. **Hardcoded Strings (i18n)**
**Severity:** LOW  
**Location:** All UI components

**Recommendation:**
Implement internationalization for future expansion.

---

### 32. **Missing Unit Tests**
**Severity:** LOW  
**Location:** Entire codebase

**Recommendation:**
Add Jest/Vitest tests for critical functions.

---

### 33. **No Performance Monitoring**
**Severity:** LOW  
**Location:** Application

**Recommendation:**
Integrate Sentry or similar for error tracking.

---

### 34. **Inconsistent Naming Conventions**
**Severity:** LOW  
**Location:** Database schema

**Issue:**
Some columns use `snake_case`, others use `camelCase`.

**Recommendation:**
Standardize on `snake_case` for database.

---

### 35. **Missing API Documentation**
**Severity:** LOW  
**Location:** Edge Functions

**Recommendation:**
Add OpenAPI/Swagger documentation.

---

### 36. **No Dependency Vulnerability Scanning**
**Severity:** LOW  
**Location:** package.json

**Recommendation:**
```bash
npm audit
npm install -g snyk
snyk test
```

---

### 37. **Missing Git Hooks**
**Severity:** LOW  
**Location:** Repository

**Recommendation:**
Add Husky for pre-commit linting.

---

### 38. **No Environment Variable Validation**
**Severity:** LOW  
**Location:** Application startup

**Recommendation:**
Validate all required env vars on startup.

---

## 📊 SUMMARY & PRIORITY ACTIONS

### Immediate Actions (This Week):
1. ✅ Fix SQL injection in friend search (Issue #2)
2. ✅ Add input validation on image upload (Issue #3)
3. ✅ Implement server-side admin verification (Issue #4)
4. ✅ Remove production console.logs (Issue #5)
5. ✅ Fix CORS wildcard (Issue #7)

### Short-term (This Month):
6. Encrypt API keys in database (Issue #11)
7. Add rate limiting (Issue #6)
8. Implement password strength requirements (Issue #9)
9. Add request timeouts (Issue #12)
10. Add security headers (Issue #22)

### Long-term (Next Quarter):
11. Implement comprehensive audit logging (Issue #14)
12. Add unit tests (Issue #32)
13. Set up error monitoring (Issue #33)
14. Implement code splitting (Issue #28)
15. Add i18n support (Issue #31)

---

## 🛡️ SECURITY BEST PRACTICES CHECKLIST

- [ ] All user inputs validated and sanitized
- [ ] API keys encrypted at rest
- [ ] Rate limiting on all endpoints
- [ ] CSRF protection enabled
- [ ] CSP headers configured
- [ ] Security headers enabled
- [ ] Admin actions logged
- [ ] Failed login attempts tracked
- [ ] Regular security audits scheduled
- [ ] Dependency vulnerabilities monitored
- [ ] Backup/restore tested
- [ ] Incident response plan documented

---

**End of Report**
