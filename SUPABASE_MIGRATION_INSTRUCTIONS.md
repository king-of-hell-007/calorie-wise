# CalorieWise Database Migration Instructions

This document provides step-by-step instructions for migrating your CalorieWise application from the original Supabase project to your own Supabase instance.

## 📋 Prerequisites

- A new Supabase project created
- Admin access to your new Supabase project
- The generated `calorie-wise-database-schema.sql` file

## 🚀 Migration Steps

### Step 1: Create Your New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `calorie-wise` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be fully provisioned (usually 2-3 minutes)

### Step 2: Access the SQL Editor

1. In your new Supabase project dashboard, navigate to the **SQL Editor** in the left sidebar
2. Click "New Query" to create a new SQL script

### Step 3: Import the Database Schema

1. Open the `calorie-wise-database-schema.sql` file in a text editor
2. Copy the entire contents of the file
3. Paste the SQL script into the Supabase SQL Editor
4. Click "Run" to execute the script

**⚠️ Important**: The script will take a few minutes to complete as it creates all tables, indexes, policies, and functions.

### Step 4: Verify the Migration

After running the script, verify that all components were created successfully:

1. **Check Tables**: Go to **Table Editor** and verify these tables exist:
   - `profiles`
   - `user_roles`
   - `meal_entries`
   - `meal_plans`
   - `badges`
   - `user_badges`
   - `points_history`
   - `admin_api_keys`

2. **Check Functions**: Go to **Database > Functions** and verify:
   - `has_role` function exists
   - `update_updated_at_column` function exists

3. **Check Policies**: Go to **Authentication > Policies** and verify RLS policies are active

4. **Check Default Data**: In the **Table Editor**, check the `badges` table - you should see 8 default badges inserted

### Step 5: Update Your Application Configuration

1. **Get Project Credentials**:
   - Go to **Settings > API** in your Supabase dashboard
   - Copy the following values:
     - Project URL
     - Project API Key (anon/public key)

2. **Update Environment Variables**:
   Create a `.env.local` file in your project root with:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
   ```

3. **Update Supabase Client** (if needed):
   The existing client configuration in `src/integrations/supabase/client.ts` should work as-is.

### Step 6: Deploy Edge Functions (Optional)

If you want to use the AI nutrition analysis features, you'll need to deploy the edge functions:

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link Your Project**:
   ```bash
   supabase link --project-ref your_project_id
   ```

4. **Deploy Functions**:
   ```bash
   supabase functions deploy analyze-nutrition-gemini
   supabase functions deploy check-badges
   ```
   
   **Note**: The application now uses `analyze-nutrition-gemini` instead of `analyze-nutrition` for better reliability with Gemini AI.

### Step 7: Set Up Admin User

To access the admin panel and manage API keys:

1. **Create a User Account**: Sign up through your application
2. **Grant Admin Role**: In the Supabase SQL Editor, run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('your_user_id_here', 'admin');
   ```
   Replace `your_user_id_here` with the actual user ID from the `auth.users` table.

### Step 8: Configure API Keys (For AI Features)

1. **Get Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key for Gemini 2.0 Flash

2. **Add API Key to Admin Panel**:
   - Log in to your application with the admin account
   - Navigate to the Admin panel
   - Add your Gemini API key

## 🔧 Additional Configuration

### Email Authentication Setup

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Configure your email settings:
   - **Site URL**: Your application's URL
   - **Redirect URLs**: Add your domain
   - **Email Templates**: Customize as needed

### Storage Setup (if using image uploads)

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `meal-images` (or similar)
3. Set appropriate policies for public access if needed

### Database Backups

1. Go to **Settings > Database** in your Supabase dashboard
2. Enable **Point-in-time Recovery** for production use
3. Set up regular backups

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   - Ensure RLS policies are properly set up
   - Check that user roles are correctly assigned

2. **Function Not Found Errors**:
   - Verify that the `has_role` function was created
   - Check function permissions

3. **API Key Issues**:
   - Ensure the admin user has the correct role
   - Verify API keys are properly formatted

4. **Edge Function Deployment Issues**:
   - Check that you're using the correct project reference
   - Verify your Supabase CLI is up to date

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the generated SQL schema for any custom modifications
- Test each feature individually to isolate issues

## ✅ Verification Checklist

- [ ] All tables created successfully
- [ ] RLS policies active
- [ ] Functions working
- [ ] Default badges inserted
- [ ] Admin user created
- [ ] Environment variables updated
- [ ] Edge functions deployed (if using AI features)
- [ ] API keys configured
- [ ] Application connects to new database
- [ ] All features working as expected

## 📝 Next Steps

After successful migration:

1. **Test All Features**: Thoroughly test user registration, meal logging, badge system, etc.
2. **Monitor Performance**: Keep an eye on database performance and query times
3. **Set Up Monitoring**: Consider setting up alerts for errors and performance issues
4. **Backup Strategy**: Implement regular backups and test restore procedures
5. **Security Review**: Review and update security policies as needed

---

**Note**: This migration preserves all the original functionality while giving you full control over your database. The schema includes comprehensive RLS policies, indexes for performance, and all the features needed for the CalorieWise application.
