# 📊 PHASE 3 DATABASE MIGRATION - QUICK REFERENCE

## ✅ COMPLETE SQL FILE CREATED

**File:** `PHASE_3_COMPLETE_DATABASE_MIGRATION.sql`

This file contains **ALL** Phase 3 database changes in one complete migration.

---

## 📋 WHAT'S INCLUDED

### **14 New Tables:**

1. **notification_preferences** - User notification settings
2. **notification_tokens** - Push notification device tokens
3. **scheduled_notifications** - Scheduled notification queue
4. **activity_feed** - Social activity posts
5. **feed_reactions** - Likes on activity posts
6. **feed_comments** - Comments on activity posts
7. **privacy_settings** - User privacy preferences
8. **shopping_lists** - Meal plan shopping lists
9. **meal_plan_templates** - Reusable meal plans
10. **recipe_reviews** - Recipe ratings and reviews
11. **recipe_favorites** - User favorite recipes
12. **recipe_collections** - User recipe collections
13. **fitbit_connections** - Fitbit OAuth tokens
14. **fitbit_daily_data** - Fitbit activity data
15. **user_preferences** - Dietary preferences
16. **meal_recommendations** - AI recommendations
17. **referrals** - Referral tracking

### **5 New Profile Columns:**

- `fitbit_connected` - Fitbit connection status
- `use_dynamic_calories` - Dynamic calorie tracking flag
- `referral_code` - User's referral code
- `total_referrals` - Referral count
- `referral_bonus_points` - Referral bonus points

### **Security:**

- ✅ Full RLS policies for all tables
- ✅ User-specific data access
- ✅ Privacy-aware feed visibility
- ✅ Secure token storage

### **Performance:**

- ✅ 30+ indexes for fast queries
- ✅ Optimized for common queries
- ✅ Efficient joins

### **Automation:**

- ✅ Updated_at triggers
- ✅ Referral bonus automation
- ✅ Referral code generation

---

## 🚀 HOW TO RUN

### **Option 1: Supabase Dashboard (Recommended)**

1. Go to your Supabase project
2. Click "SQL Editor" in sidebar
3. Click "New Query"
4. Copy entire contents of `PHASE_3_COMPLETE_DATABASE_MIGRATION.sql`
5. Paste into editor
6. Click "Run" button
7. Wait for completion (should take 10-30 seconds)

### **Option 2: Supabase CLI**

```bash
supabase db push
```

Or:

```bash
supabase db execute --file PHASE_3_COMPLETE_DATABASE_MIGRATION.sql
```

---

## ✅ VERIFICATION

### **After Running Migration:**

1. **Check Tables Created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'notification_preferences',
     'activity_feed',
     'fitbit_connections',
     'fitbit_daily_data',
     'referrals'
   );
   ```

2. **Check Profile Columns:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN (
     'fitbit_connected',
     'use_dynamic_calories',
     'referral_code'
   );
   ```

3. **Check RLS Policies:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN (
     'notification_preferences',
     'activity_feed',
     'fitbit_connections'
   );
   ```

---

## 🔄 REGENERATE TYPES

**After migration, regenerate TypeScript types:**

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

**Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.**

---

## 📊 TABLE BREAKDOWN

### **Notifications (3 tables):**
- notification_preferences
- notification_tokens
- scheduled_notifications

### **Social/Activity Feed (4 tables):**
- activity_feed
- feed_reactions
- feed_comments
- privacy_settings

### **Meal Planning (2 tables):**
- shopping_lists
- meal_plan_templates

### **Recipe Social (3 tables):**
- recipe_reviews
- recipe_favorites
- recipe_collections

### **Fitbit (2 tables):**
- fitbit_connections
- fitbit_daily_data

### **AI/Recommendations (2 tables):**
- user_preferences
- meal_recommendations

### **Referrals (1 table):**
- referrals

---

## 🔐 SECURITY FEATURES

### **RLS Policies Applied:**

✅ **notification_preferences** - Users can only see/edit their own
✅ **activity_feed** - Privacy-aware (public/friends/private)
✅ **feed_reactions** - Anyone can view, users can add/remove own
✅ **feed_comments** - Anyone can view, users can manage own
✅ **shopping_lists** - Users can only see/edit their own
✅ **meal_plan_templates** - Public templates visible to all, private to owner
✅ **recipe_reviews** - All can view, users can manage own
✅ **recipe_favorites** - All can view, users can manage own
✅ **fitbit_connections** - Users can only see/edit their own
✅ **fitbit_daily_data** - Users can only see/edit their own
✅ **referrals** - Users can see referrals they made or received

---

## ⚡ PERFORMANCE INDEXES

**30+ indexes created for:**
- User lookups
- Date range queries
- Feed sorting
- Recipe searches
- Fitbit data retrieval
- Referral tracking

---

## 🎯 TRIGGERS & FUNCTIONS

### **Triggers:**
1. **update_updated_at** - Auto-update timestamps
2. **award_referral_bonus** - Auto-award referral bonuses

### **Functions:**
1. **update_updated_at_column()** - Update timestamp helper
2. **generate_referral_code()** - Generate unique referral codes
3. **award_referral_bonus()** - Process referral rewards

---

## 🐛 TROUBLESHOOTING

### **If migration fails:**

1. **Check for existing tables:**
   - Migration uses `CREATE TABLE IF NOT EXISTS`
   - Safe to run multiple times

2. **Check for missing dependencies:**
   - Ensure Phase 1 & 2 tables exist (profiles, recipes, meal_plans, etc.)

3. **Check permissions:**
   - Ensure you have admin access to Supabase project

4. **Run in parts:**
   - Can run each PART separately if needed
   - Parts are numbered 1-12

---

## 📝 MIGRATION CHECKLIST

**Before Running:**
- [ ] Backup existing database (optional but recommended)
- [ ] Have Supabase project ID ready
- [ ] Have admin access to Supabase

**During Migration:**
- [ ] Copy entire SQL file
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run"
- [ ] Wait for completion

**After Migration:**
- [ ] Verify tables created
- [ ] Verify columns added to profiles
- [ ] Regenerate TypeScript types
- [ ] Restart dev server
- [ ] Test Phase 3 features

---

## 🎉 WHAT YOU GET

After running this migration:

✅ **Notification System** - Full notification preferences and scheduling
✅ **Activity Feed** - Social feed with likes and comments
✅ **Meal Planning** - Shopping lists and templates
✅ **Recipe Social** - Reviews, favorites, collections
✅ **Fitbit Integration** - Connection and daily data storage
✅ **Referral System** - Track invites and award bonuses
✅ **Privacy Controls** - User privacy settings
✅ **AI Recommendations** - User preferences and recommendations

---

## 📞 SUPPORT

**If you encounter issues:**

1. Check Supabase logs for error messages
2. Verify all Phase 1 & 2 tables exist
3. Ensure proper permissions
4. Run verification queries above

---

**File:** `PHASE_3_COMPLETE_DATABASE_MIGRATION.sql`
**Tables:** 17 new tables
**Columns:** 5 new profile columns
**Policies:** 40+ RLS policies
**Indexes:** 30+ performance indexes
**Triggers:** 8 automated triggers
**Functions:** 3 helper functions

**Ready to run! Just copy and paste into Supabase SQL Editor.** 🚀
