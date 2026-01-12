# 🚀 Phase 3 Implementation Plan - Advanced Features & PWA

## Overview

Phase 3 transforms CalorieWise into a **Progressive Web App (PWA)** with advanced features, offline capabilities, and enhanced user experience.

**Timeline:** Weeks 9-12 (4 weeks)
**Status:** 🔄 In Progress

---

## Phase 3A: PWA Foundation (Weeks 9-10)

### 1. Service Worker & Offline Support 📱
**Priority:** High
**Complexity:** Medium

**Features:**
- Service worker registration
- Offline page caching
- API response caching
- Background sync for meal logs
- Offline indicator UI
- Cache management

**Files to Create:**
- `public/sw.js` - Service worker
- `src/hooks/useOnlineStatus.ts` - Online/offline detection
- `src/components/OfflineIndicator.tsx` - Offline banner
- `vite.config.ts` - PWA plugin configuration

**Database:**
- No new tables needed
- Use IndexedDB for offline storage

---

### 2. Install Prompt & App Manifest 📲
**Priority:** High
**Complexity:** Low

**Features:**
- Web app manifest
- Install prompt component
- App icons (multiple sizes)
- Splash screens
- Theme colors
- Display modes

**Files to Create:**
- `public/manifest.json` - PWA manifest
- `src/components/InstallPrompt.tsx` - Install banner
- `public/icons/` - App icons (192x192, 512x512)

**Assets Needed:**
- App icon (SVG/PNG)
- Splash screen images
- Favicon variations

---

### 3. Push Notifications 🔔
**Priority:** Medium
**Complexity:** High

**Features:**
- Notification permission request
- Meal reminder notifications
- Streak reminder notifications
- Challenge update notifications
- Friend activity notifications
- Water reminder notifications

**Files to Create:**
- `src/hooks/useNotifications.ts` - Notification hook
- `src/components/NotificationSettings.tsx` - Settings UI
- `supabase/functions/send-notification/index.ts` - Edge function

**Database:**
- `notification_preferences` table
- `notification_tokens` table
- `scheduled_notifications` table

---

## Phase 3B: Advanced Analytics (Week 11)

### 4. Enhanced Analytics Dashboard 📊
**Priority:** High
**Complexity:** Medium

**Features:**
- Custom date range selection
- Comparison views (week vs week)
- Trend predictions
- Goal forecasting
- Macro ratio optimization
- Meal timing analysis
- Export to PDF/CSV

**Files to Create:**
- `src/pages/AdvancedAnalytics.tsx` - Enhanced analytics
- `src/components/DateRangePicker.tsx` - Date selector
- `src/components/ComparisonChart.tsx` - Comparison views
- `src/lib/analytics.ts` - Analytics calculations
- `src/lib/exportPDF.ts` - PDF export

**Database:**
- Use existing `meal_entries` and `analytics_cache`
- Add indexes for date range queries

---

### 5. Meal Planning & Scheduling 📅
**Priority:** Medium
**Complexity:** Medium

**Features:**
- Weekly meal planner
- Drag-and-drop meal scheduling
- Recipe to meal plan conversion
- Template to meal plan
- Shopping list generation
- Meal prep reminders

**Files to Create:**
- `src/pages/MealPlanner.tsx` - Meal planning UI
- `src/components/WeeklyCalendar.tsx` - Calendar view
- `src/components/ShoppingList.tsx` - Shopping list
- `src/lib/mealPlanning.ts` - Planning logic

**Database:**
- Use existing `meal_plans` table
- `shopping_lists` table
- `meal_plan_items` table

---

## Phase 3C: Social & Sharing (Week 12)

### 6. Activity Feed 📰
**Priority:** Medium
**Complexity:** Medium

**Features:**
- Friend activity feed
- Meal photo sharing
- Achievement sharing
- Comment system
- Like/reaction system
- Privacy controls

**Files to Create:**
- `src/pages/ActivityFeed.tsx` - Social feed
- `src/components/FeedItem.tsx` - Feed card
- `src/components/CommentSection.tsx` - Comments
- `src/hooks/useFeed.ts` - Feed data hook

**Database:**
- `activity_feed` table
- `feed_comments` table
- `feed_reactions` table
- `privacy_settings` table

---

### 7. Recipe Sharing & Discovery 🍳
**Priority:** Medium
**Complexity:** Medium

**Features:**
- Public recipe gallery
- Recipe search & filters
- Recipe ratings & reviews
- Save/favorite recipes
- Recipe collections
- Import from URL

**Files to Create:**
- `src/pages/RecipeGallery.tsx` - Recipe discovery
- `src/components/RecipeCard.tsx` - Recipe display
- `src/components/RecipeReview.tsx` - Reviews
- `src/lib/recipeImport.ts` - URL import

**Database:**
- Use existing `recipes` table
- `recipe_reviews` table
- `recipe_favorites` table
- `recipe_collections` table

---

### 8. Group Challenges 👥
**Priority:** Low
**Complexity:** Medium

**Features:**
- Create private group challenges
- Invite friends to challenges
- Group leaderboards
- Team challenges
- Challenge chat
- Challenge photos

**Files to Create:**
- `src/pages/GroupChallenge.tsx` - Group challenge UI
- `src/components/ChallengeChat.tsx` - Chat component
- `src/components/TeamLeaderboard.tsx` - Team rankings

**Database:**
- `challenge_groups` table
- `challenge_invites` table
- `challenge_messages` table

---

## Phase 3D: Smart Features (Week 12)

### 9. Voice Input 🎤
**Priority:** Low
**Complexity:** Medium

**Features:**
- Voice meal logging
- Voice search
- Voice commands
- Speech-to-text for notes

**Files to Create:**
- `src/hooks/useVoiceInput.ts` - Voice recognition
- `src/components/VoiceButton.tsx` - Voice UI

**Dependencies:**
- Web Speech API (built-in)

---

### 10. AI Meal Recommendations 🤖
**Priority:** Medium
**Complexity:** High

**Features:**
- Personalized meal suggestions
- Based on nutrition gaps
- Based on preferences
- Based on time of day
- Recipe recommendations
- Restaurant suggestions

**Files to Create:**
- `src/pages/Recommendations.tsx` - Recommendations UI
- `src/lib/recommendations.ts` - Recommendation engine
- `supabase/functions/generate-recommendations/index.ts` - AI function

**Database:**
- `user_preferences` table
- `meal_recommendations` table
- `recommendation_feedback` table

---

## Implementation Priority

### Must Have (Week 9-10):
1. ✅ Service Worker & Offline Support
2. ✅ Install Prompt & Manifest
3. ✅ Enhanced Analytics

### Should Have (Week 11):
4. ✅ Push Notifications
5. ✅ Meal Planning
6. ✅ Activity Feed

### Nice to Have (Week 12):
7. ⏳ Recipe Sharing
8. ⏳ Group Challenges
9. ⏳ Voice Input
10. ⏳ AI Recommendations

---

## Technical Stack

### PWA:
- **Workbox** - Service worker library
- **vite-plugin-pwa** - Vite PWA plugin
- **IndexedDB** - Offline storage

### Notifications:
- **Web Push API** - Browser notifications
- **Firebase Cloud Messaging** - Push delivery
- **Supabase Edge Functions** - Notification triggers

### Analytics:
- **Recharts** - Charts (existing)
- **jsPDF** - PDF export
- **date-fns** - Date handling (existing)

### Social:
- **React Query** - Data fetching
- **Supabase Realtime** - Live updates

---

## Database Schema (New Tables)

```sql
-- Notifications
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  meal_reminders BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  friend_activity BOOLEAN DEFAULT true,
  water_reminders BOOLEAN DEFAULT true
);

CREATE TABLE notification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Feed
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL,
  content JSONB NOT NULL,
  privacy TEXT DEFAULT 'friends',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feed_reactions (
  id UUID PRIMARY KEY,
  feed_id UUID REFERENCES activity_feed(id),
  user_id UUID REFERENCES profiles(id),
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping Lists
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Reviews
CREATE TABLE recipe_reviews (
  id UUID PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id),
  user_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Success Metrics

### PWA:
- [ ] App installable on mobile/desktop
- [ ] Offline mode functional
- [ ] Service worker caching works
- [ ] Install prompt shows correctly

### Notifications:
- [ ] Push notifications delivered
- [ ] Reminder notifications work
- [ ] User can customize preferences

### Analytics:
- [ ] Custom date ranges work
- [ ] PDF export functional
- [ ] Comparison views accurate

### Social:
- [ ] Activity feed updates in real-time
- [ ] Recipe sharing works
- [ ] Comments and reactions functional

---

## Testing Checklist

- [ ] PWA manifest validates
- [ ] Service worker registers
- [ ] Offline mode works
- [ ] Install prompt appears
- [ ] Notifications permission requested
- [ ] Notifications delivered
- [ ] Analytics export works
- [ ] Meal planner functional
- [ ] Activity feed loads
- [ ] Recipe sharing works

---

## Documentation

- [ ] PWA setup guide
- [ ] Notification setup guide
- [ ] Analytics user guide
- [ ] API documentation
- [ ] Deployment guide

---

## Next Steps

1. Start with PWA foundation (Service Worker)
2. Add install prompt and manifest
3. Implement push notifications
4. Enhance analytics dashboard
5. Add meal planning features
6. Implement social features
7. Test thoroughly
8. Deploy to production

---

**Total Estimated Time:** 4 weeks
**Features:** 10 major features
**New Tables:** 8+ tables
**Complexity:** High
**Impact:** Transforms app into full-featured PWA

Let's build Phase 3! 🚀
