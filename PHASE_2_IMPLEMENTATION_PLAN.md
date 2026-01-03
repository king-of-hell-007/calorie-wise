# 🚀 CalorieWise - Phase 2 Implementation Plan

## 📋 Phase 1 Recap (✅ COMPLETED)

### Core Features Implemented:
- ✅ AI-powered meal analysis (Gemini 2.5 Flash)
- ✅ User authentication and profiles
- ✅ Streak tracking system
- ✅ Badge and points gamification
- ✅ Dashboard with daily stats
- ✅ Progress tracking
- ✅ API key rotation and failover
- ✅ Mobile-optimized camera interface
- ✅ Settings and profile management
- ✅ Admin panel for API keys

---

## 🎯 Phase 2: Advanced Features & Analytics

### Overview
Phase 2 focuses on enhancing user experience with advanced analytics, social features, meal planning capabilities, and improved data visualization.

---

## 📊 Feature Set

### 1. **Advanced Analytics Dashboard** 🔥
**Priority**: HIGH

#### Features:
- **Weekly/Monthly Trends**
  - Calorie intake trends over time
  - Macro distribution charts (protein, carbs, fats)
  - Weight progress tracking
  - Streak performance visualization

- **Meal Pattern Analysis**
  - Most frequently logged foods
  - Meal timing patterns (breakfast, lunch, dinner distribution)
  - Calorie distribution by meal slot
  - Nutritional quality score

- **Goal Progress Tracking**
  - Visual progress towards weight goals
  - Macro target achievement rates
  - Calorie deficit/surplus tracking
  - Estimated time to goal

#### Technical Implementation:
- New components: `AdvancedAnalytics.tsx`, `TrendChart.tsx`, `MacroDistribution.tsx`
- Database: New `analytics_cache` table for performance
- Charts: Enhanced Recharts integration with custom tooltips

---

### 2. **Meal Planning & Templates** 📅
**Priority**: HIGH

#### Features:
- **Meal Templates**
  - Save frequently eaten meals as templates
  - Quick-log from saved templates
  - Edit and update templates
  - Share templates with friends (future)

- **Weekly Meal Planner**
  - Plan meals for the week ahead
  - Drag-and-drop meal scheduling
  - Shopping list generation
  - Nutritional summary for planned week

- **Recipe Database**
  - Save custom recipes with ingredients
  - Calculate nutrition per serving
  - Scale recipes (1x, 2x, 4x servings)
  - Tag recipes (breakfast, lunch, dinner, snack)

#### Technical Implementation:
- New tables: `meal_templates`, `recipes`, `recipe_ingredients`, `meal_plans`
- Components: `MealPlanner.tsx`, `RecipeBuilder.tsx`, `TemplateManager.tsx`
- Features: Drag-and-drop calendar interface

---

### 3. **Social & Community Features** 👥
**Priority**: MEDIUM

#### Features:
- **Friends System**
  - Add friends by username/email
  - View friends' public progress
  - Streak competitions
  - Leaderboards (weekly, monthly, all-time)

- **Challenges**
  - Join community challenges (e.g., "30-day protein challenge")
  - Create custom challenges
  - Track challenge progress
  - Earn special badges for challenge completion

- **Community Feed** (Optional)
  - Share meal photos (opt-in)
  - Like and comment on meals
  - Follow other users
  - Discover new healthy meals

#### Technical Implementation:
- New tables: `friendships`, `challenges`, `challenge_participants`, `community_posts`
- Components: `FriendsPage.tsx`, `Leaderboard.tsx`, `ChallengesPage.tsx`
- Real-time: Supabase Realtime for live updates

---

### 4. **Smart Recommendations** 🤖
**Priority**: MEDIUM

#### Features:
- **Personalized Suggestions**
  - Meal suggestions based on remaining calories
  - Macro-balanced meal recommendations
  - Time-based suggestions (breakfast ideas in morning)
  - Nutritional gap analysis (e.g., "You're low on protein today")

- **Smart Alerts**
  - Reminder to log meals
  - Warning when approaching calorie limit
  - Celebration when hitting goals
  - Streak reminder notifications

- **AI Insights**
  - Weekly nutrition summary
  - Patterns and trends analysis
  - Personalized tips based on eating habits
  - Goal adjustment recommendations

#### Technical Implementation:
- Edge Function: `generate-recommendations`
- Components: `SmartInsights.tsx`, `RecommendationCard.tsx`
- Notifications: Browser Push API integration

---

### 5. **Enhanced Data Export & Reports** 📈
**Priority**: LOW

#### Features:
- **Comprehensive Reports**
  - Weekly nutrition report (PDF)
  - Monthly progress summary
  - Custom date range reports
  - Shareable progress cards

- **Advanced Export Options**
  - Export to CSV/Excel
  - Export to Google Sheets
  - Export to MyFitnessPal format
  - Backup all data (JSON)

- **Print-Friendly Views**
  - Meal log printouts
  - Progress charts for doctor visits
  - Shopping lists

#### Technical Implementation:
- Libraries: `jsPDF`, `xlsx`, `html2canvas`
- Components: `ReportGenerator.tsx`, `ExportManager.tsx`
- Edge Function: `generate-pdf-report`

---

### 6. **Barcode Scanner** 📷
**Priority**: MEDIUM

#### Features:
- **Packaged Food Scanning**
  - Scan barcodes for instant nutrition data
  - Integration with Open Food Facts API (free)
  - Save scanned items for quick re-logging
  - Manual entry fallback

- **Barcode Database**
  - Cache scanned items locally
  - User-contributed barcode data
  - Verify and edit barcode nutrition info

#### Technical Implementation:
- Library: `quagga2` or `@zxing/browser` (free barcode scanners)
- API: Open Food Facts API (free, open-source)
- Components: `BarcodeScanner.tsx`
- Table: `barcode_cache`

---

### 7. **Offline Mode & PWA** 📱
**Priority**: MEDIUM

#### Features:
- **Progressive Web App**
  - Install as native app
  - Offline functionality
  - Background sync
  - Push notifications

- **Offline Capabilities**
  - Cache recent meals
  - Queue meals for upload when online
  - Offline meal templates
  - Local analytics

#### Technical Implementation:
- Service Worker configuration
- IndexedDB for local storage
- Background Sync API
- Manifest.json updates

---

### 8. **Water & Micronutrient Tracking** 💧
**Priority**: LOW

#### Features:
- **Water Intake Tracking**
  - Quick-log water (glasses, ml, oz)
  - Daily water goal
  - Hydration reminders
  - Water intake trends

- **Micronutrient Tracking**
  - Vitamins (A, C, D, E, K, B-complex)
  - Minerals (Iron, Calcium, Magnesium, Zinc)
  - Daily recommended intake (DRI)
  - Deficiency warnings

#### Technical Implementation:
- Tables: `water_log`, `micronutrient_targets`
- Components: `WaterTracker.tsx`, `MicronutrientDashboard.tsx`
- Enhanced Gemini prompt to extract micronutrients

---

## 🗓️ Implementation Timeline

### Week 1-2: Advanced Analytics Dashboard
- Day 1-3: Design analytics components
- Day 4-7: Implement trend charts
- Day 8-10: Meal pattern analysis
- Day 11-14: Goal progress tracking, testing

### Week 3-4: Meal Planning & Templates
- Day 15-18: Meal templates system
- Day 19-22: Weekly meal planner
- Day 23-26: Recipe database
- Day 27-28: Testing and refinement

### Week 5-6: Social & Community Features
- Day 29-32: Friends system
- Day 33-36: Challenges implementation
- Day 37-40: Leaderboards
- Day 41-42: Testing

### Week 7-8: Smart Recommendations & Barcode Scanner
- Day 43-46: Recommendation engine
- Day 47-50: Barcode scanner
- Day 51-54: Smart alerts
- Day 55-56: Testing

### Week 9-10: Polish & Optimization
- Day 57-60: PWA implementation
- Day 61-64: Water & micronutrient tracking
- Day 65-68: Enhanced export features
- Day 69-70: Final testing, bug fixes, deployment

---

## 📐 Database Schema Additions

### New Tables:

```sql
-- Meal Templates
CREATE TABLE meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meal_slot TEXT CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  nutrition_data JSONB NOT NULL,
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER DEFAULT 1,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL,
  unit TEXT,
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL
);

-- Meal Plans
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_slot TEXT CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_template_id UUID REFERENCES meal_templates(id),
  recipe_id UUID REFERENCES recipes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, meal_slot)
);

-- Friendships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('streak', 'calories', 'protein', 'steps', 'custom')),
  target_value INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Water Tracking
CREATE TABLE water_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barcode Cache
CREATE TABLE barcode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  nutrition_data JSONB NOT NULL,
  image_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Cache (for performance)
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cache_key)
);
```

---

## 🎨 UI/UX Enhancements

### New Pages:
1. `/analytics` - Advanced analytics dashboard
2. `/meal-planner` - Weekly meal planning interface
3. `/recipes` - Recipe management
4. `/friends` - Friends and social features
5. `/challenges` - Community challenges
6. `/reports` - Generate and export reports

### Enhanced Components:
- Interactive charts with drill-down
- Drag-and-drop meal planner
- Real-time leaderboards
- Animated progress indicators
- Smart notification system

---

## 🔧 Technical Requirements

### Dependencies to Add:
```json
{
  "react-beautiful-dnd": "^13.1.1",  // Drag-and-drop
  "quagga2": "^1.8.0",               // Barcode scanning
  "jspdf": "^2.5.1",                 // PDF generation
  "xlsx": "^0.18.5",                 // Excel export
  "date-fns": "^2.30.0",             // Date utilities
  "react-calendar": "^4.6.0",        // Calendar component
  "workbox-webpack-plugin": "^7.0.0" // PWA/Service Worker
}
```

### API Integrations:
- Open Food Facts API (free, for barcode data)
- Browser Push API (for notifications)
- Service Worker API (for PWA)

---

## ✅ Success Metrics

### User Engagement:
- 30% increase in daily active users
- 50% increase in average session time
- 40% increase in meal logging frequency

### Feature Adoption:
- 60% of users create at least one meal template
- 40% of users use meal planner weekly
- 30% of users add at least one friend
- 50% of users join at least one challenge

### Retention:
- 20% increase in 7-day retention
- 30% increase in 30-day retention
- 25% increase in average streak length

---

## 🚀 Deployment Strategy

### Phase 2A (Weeks 1-4):
- Advanced Analytics
- Meal Planning & Templates
- Deploy to staging
- User testing

### Phase 2B (Weeks 5-8):
- Social Features
- Smart Recommendations
- Barcode Scanner
- Deploy to staging
- User testing

### Phase 2C (Weeks 9-10):
- PWA & Offline Mode
- Water & Micronutrient Tracking
- Final polish
- Production deployment

---

## 📝 Notes

- All features are designed to work with the free tier of Supabase
- No paid APIs required (using Open Food Facts for barcode data)
- Progressive enhancement approach (features degrade gracefully)
- Mobile-first design maintained throughout
- Accessibility (a11y) compliance for all new features

---

**Ready to begin Phase 2 implementation!** 🎉
