# ✅ POST-SECURITY-FIX CHECKLIST
**CalorieWise Application - Action Items**

---

## 🚨 CRITICAL - DO THESE FIRST

### ☐ 1. Run SQL Scripts in Supabase
**Priority:** CRITICAL  
**Time Required:** 5 minutes

1. Open Supabase Dashboard → SQL Editor
2. Run `CREATE_FRIENDSHIPS_TABLE.sql` first
3. Run `SECURITY_ENHANCEMENTS.sql` second
4. Verify no errors in the output

**Why:** These scripts create essential security infrastructure (RLS policies, audit logging, rate limiting)

---

### ☐ 2. Install Missing Dependencies
**Priority:** CRITICAL  
**Time Required:** 2 minutes

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**Why:** Required for XSS prevention and input sanitization

---

### ☐ 3. Update Production Domain
**Priority:** CRITICAL (before deployment)  
**Time Required:** 2 minutes

Replace `https://your-production-domain.com` in:
- `src/lib/constants.ts` (line 186)
- `supabase/functions/analyze-nutrition/index.ts` (line 6)

**Why:** CORS and redirect validation will fail without correct domain

---

## 🔧 IMPORTANT - DO BEFORE DEPLOYMENT

### ☐ 4. Set Environment Variables
**Priority:** HIGH  
**Time Required:** 3 minutes

Create/update `.env` file:
```bash
VITE_REDIRECT_URL_LOCALHOST=http://localhost:5173
VITE_REDIRECT_URL_PROD=https://your-actual-domain.com
```

**Why:** OAuth redirects and CORS validation need these

---

### ☐ 5. Deploy Edge Function Updates
**Priority:** HIGH  
**Time Required:** 5 minutes

```bash
# Deploy the updated analyze-nutrition function
supabase functions deploy analyze-nutrition
```

**Why:** Security fixes in the Edge Function need to be deployed

---

### ☐ 6. Test Core Functionality
**Priority:** HIGH  
**Time Required:** 10 minutes

Test these critical flows:
- ☐ Sign up with weak password (should fail with helpful message)
- ☐ Sign up with strong password (should succeed)
- ☐ Log in with valid credentials
- ☐ Upload and analyze a meal image
- ☐ Send a friend request
- ☐ Access admin panel (if you're admin)

**Why:** Ensure security fixes didn't break functionality

---

## 📋 RECOMMENDED - DO SOON

### ☐ 7. Create Admin User
**Priority:** MEDIUM  
**Time Required:** 3 minutes

Run in Supabase SQL Editor:
```sql
-- Replace with your actual user ID
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT DO NOTHING;
```

**Why:** You need an admin user to manage API keys

---

### ☐ 8. Review Security Audit Report
**Priority:** MEDIUM  
**Time Required:** 15 minutes

Read `SECURITY_AUDIT_REPORT.md` to understand:
- What vulnerabilities were found
- How they were fixed
- Best practices going forward

**Why:** Understanding security is crucial for maintenance

---

### ☐ 9. Set Up Monitoring
**Priority:** MEDIUM  
**Time Required:** 10 minutes

1. Check the `admin_security_dashboard` view in Supabase
2. Set up alerts for:
   - Failed login attempts
   - Rate limit violations
   - Password reset attempts

**Why:** Early detection of security incidents

---

### ☐ 10. Update Documentation
**Priority:** LOW  
**Time Required:** 5 minutes

Document:
- New password requirements for users
- Rate limits for API usage
- Security best practices for your team

**Why:** Helps users and developers understand the system

---

## 🧪 TESTING CHECKLIST

### Authentication & Authorization:
- ☐ Sign up with password < 12 chars (should fail)
- ☐ Sign up with password missing uppercase (should fail)
- ☐ Sign up with password missing number (should fail)
- ☐ Sign up with password missing special char (should fail)
- ☐ Sign up with valid strong password (should succeed)
- ☐ Sign in with invalid email format (should fail)
- ☐ Sign in with valid credentials (should succeed)
- ☐ Try to access admin panel without admin role (should fail)
- ☐ Access admin panel with admin role (should succeed)

### Image Upload & Analysis:
- ☐ Upload image > 10MB (should fail with clear error)
- ☐ Upload non-image file (should fail)
- ☐ Upload valid JPEG image (should succeed)
- ☐ Upload valid PNG image (should succeed)
- ☐ Upload valid WebP image (should succeed)
- ☐ Analyze uploaded image (should get nutrition data)

### Friends Feature:
- ☐ Send friend request to existing user (should succeed)
- ☐ Send 11 friend requests in 1 hour (11th should fail - rate limit)
- ☐ Try to add yourself as friend (should fail)
- ☐ Accept friend request (should succeed)
- ☐ Remove friend (should succeed)

### Data Protection:
- ☐ Check browser console in production (should not see sensitive data)
- ☐ Check network tab for API keys in URLs (should not see any)
- ☐ Try SQL injection in friend search (should be prevented)
- ☐ Try XSS in profile name (should be sanitized)

---

## 🔍 VERIFICATION QUERIES

Run these in Supabase SQL Editor to verify everything is set up:

### Check RLS is enabled:
```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
-- Should return 0 rows (all tables should have RLS enabled)
```

### Check security tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'security_audit_log',
    'rate_limits',
    'password_reset_attempts',
    'friendships'
  );
-- Should return 4 rows
```

### Check admin policies exist:
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'admin_api_keys';
-- Should return 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

### Check security functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_rate_limit',
    'log_security_event',
    'cleanup_old_rate_limits'
  );
-- Should return 3 rows
```

---

## 📊 SUCCESS CRITERIA

You'll know everything is working when:

✅ Build completes without errors  
✅ All SQL scripts run without errors  
✅ Weak passwords are rejected with helpful messages  
✅ Strong passwords are accepted  
✅ Image uploads validate size and format  
✅ Friend requests work without SQL injection  
✅ Admin panel requires proper authentication  
✅ No sensitive data appears in browser console (production)  
✅ API keys are not visible in network requests  
✅ Rate limiting prevents spam  

---

## 🆘 TROUBLESHOOTING

### Issue: "Cannot find module 'dompurify'"
**Solution:** Run `npm install dompurify`

### Issue: "RLS policy error" when accessing data
**Solution:** Run `SECURITY_ENHANCEMENTS.sql` in Supabase

### Issue: "CORS error" when uploading images
**Solution:** Update production domain in constants.ts and redeploy

### Issue: "Admin panel shows 'Access Denied'"
**Solution:** Add your user to `user_roles` table with role='admin'

### Issue: Build fails with TypeScript errors
**Solution:** Run `npm install` to ensure all dependencies are installed

### Issue: "Rate limit exceeded" during testing
**Solution:** Wait 1 hour or manually delete from `rate_limits` table

---

## 📞 SUPPORT

If you encounter issues:

1. Check `SECURITY_FIXES_SUMMARY.md` for implementation details
2. Review `SECURITY_AUDIT_REPORT.md` for context
3. Check browser console for error messages
4. Check Supabase logs for backend errors
5. Verify all SQL scripts ran successfully

---

## 🎯 FINAL NOTES

### What Changed:
- **Security:** Significantly improved
- **Code Quality:** Much better
- **Maintainability:** Easier to maintain
- **Performance:** Slightly improved (better indexes)
- **User Experience:** Better error messages

### What Stayed the Same:
- **Analyzer Prompts:** Completely preserved (as requested)
- **Core Functionality:** All features still work
- **UI/UX:** No visual changes
- **Database Schema:** Only additions, no breaking changes

### Next Steps After Deployment:
1. Monitor security_audit_log for suspicious activity
2. Review rate_limits table weekly
3. Check admin_security_dashboard regularly
4. Keep dependencies updated
5. Run cleanup_old_rate_limits() monthly

---

**Status:** Ready for deployment after completing critical items ✅

**Last Updated:** 2026-02-02
