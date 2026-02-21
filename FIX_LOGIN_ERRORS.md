# 🔧 Fix Login Errors - Setup Guide

## ❌ Current Error

```
Login error: AuthApiError: Invalid login credentials
```

---

## 🔍 Root Cause

The database is **missing the `user_profiles` table** and the trigger that auto-creates profiles when users register.

When you register, Supabase creates the user in `auth.users`, but the `user_profiles` table doesn't exist yet, so the login fails because it can't find the user's profile.

---

## ✅ **Solution: Run Database Migration**

You need to run the SQL migration to create the database table and trigger.

---

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar (icon looks like `</>`)

---

### **Step 2: Create New Query**

1. Click **"+ New query"** button (top right)
2. You'll see an empty SQL editor

---

### **Step 3: Copy and Paste This SQL**

Copy the **entire SQL code** below and paste it into the editor:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON user_profiles(approval_status);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Users can update their own username only
CREATE POLICY "Users can update own username"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    approval_status = (SELECT approval_status FROM user_profiles WHERE id = auth.uid()) AND
    is_admin = (SELECT is_admin FROM user_profiles WHERE id = auth.uid())
  );

-- Policy: Admins can update any profile (for approvals)
CREATE POLICY "Admins can update any profile"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: New users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, email, approval_status, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'pending',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

### **Step 4: Run the Migration**

1. Click **"Run"** button (bottom right of the SQL editor)
2. Wait for it to complete (should take 1-2 seconds)
3. You should see: **"Success. No rows returned"**

---

### **Step 5: Verify Table Was Created**

1. Click **"Table Editor"** in the left sidebar
2. Look for **`user_profiles`** table in the list
3. Click on it to see the columns

**Expected columns:**
- `id` (UUID)
- `username` (TEXT)
- `email` (TEXT)
- `approval_status` (TEXT) - defaults to 'pending'
- `is_admin` (BOOLEAN) - defaults to false
- `created_at` (TIMESTAMPTZ)
- `approved_at` (TIMESTAMPTZ)
- `approved_by` (UUID)
- `last_login` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

### **Step 6: Create Admin User (Optional)**

If you want to create an admin user for testing:

1. First, register a new user normally through your app
2. Verify their email
3. Then run this SQL in the SQL Editor:

```sql
-- Replace 'admin@example.com' with your actual admin email
UPDATE user_profiles
SET is_admin = true,
    approval_status = 'approved'
WHERE email = 'admin@example.com';
```

This will:
- ✅ Make the user an admin
- ✅ Approve their account immediately

---

## 🧪 **Test the Fix**

Now that the database is set up:

### **Test 1: Register New User**

1. Go to your app
2. Click "Sign up"
3. Fill in registration form:
   ```
  Username: example_user
   Email: test@example.com
  Password: <TEST_ACCOUNT_PASSWORD>
   ```
4. Click "Create Account"

**Expected Result:**
- ✅ Toast: "Account created! Please check your email..."
- ✅ Redirected to verification screen
- ✅ No console errors

---

### **Test 2: Check Database**

1. Go to Supabase → Table Editor → `user_profiles`
2. You should see a new row with:
  - `username`: example_user
   - `email`: test@example.com
   - `approval_status`: pending
   - `is_admin`: false

---

### **Test 3: Verify Email**

1. Check your email inbox (and spam!)
2. Click the verification link
3. You should be redirected back to your app
4. Green banner should show: "Email Verified! ✓"

---

### **Test 4: Try Login (Before Approval)**

1. Go to login page
2. Enter email and password
3. Click "Sign In"

**Expected Result:**
- ℹ️ Toast: "Your account is pending admin approval..."
- ❌ Can't login yet (this is correct!)

---

### **Test 5: Approve User**

1. Go to Supabase → Table Editor → `user_profiles`
2. Find your test user
3. Click to edit the row
4. Change `approval_status` from `'pending'` to `'approved'`
5. Click "Save"

---

### **Test 6: Login (After Approval)**

1. Go to login page
2. Enter email and password
3. Click "Sign In"

**Expected Result:**
- ✅ Toast: "Welcome back, example_user!"
- ✅ Successfully logged in
- ✅ Redirected to converter page
- 🎉 **IT WORKS!**

---

## 🔍 **Troubleshooting**

### **Error: "relation 'user_profiles' does not exist"**

**Cause:** Migration didn't run successfully

**Fix:**
1. Go back to SQL Editor
2. Re-run the migration SQL
3. Check for any error messages in red
4. Make sure you selected the correct project

---

### **Error: "permission denied for table user_profiles"**

**Cause:** RLS policies not applied

**Fix:**
1. Check if RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public' AND tablename = 'user_profiles';
   ```
2. Should show `rowsecurity = true`
3. If false, run: `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`

---

### **Error: "User profile not found"**

**Cause:** User exists in `auth.users` but not in `user_profiles`

**Fix:**
1. Check `auth.users` table for the user
2. Manually insert profile:
   ```sql
   -- Replace with actual user ID and email
   INSERT INTO user_profiles (id, username, email, approval_status)
   VALUES (
     'user-uuid-from-auth-users',
     'username',
     'email@example.com',
     'pending'
   );
   ```

---

### **"Invalid login credentials" - Still Getting This?**

**Possible causes:**

1. **Wrong email/password**
   - Make sure you're using the correct credentials
   - Password is case-sensitive

2. **Email not verified**
   - Check if user's `email_confirmed_at` is set in `auth.users`
   - If not, click the verification link in email

3. **User doesn't exist**
   - Check Supabase → Authentication → Users
   - Look for the user you're trying to login with

4. **Trying to login with username**
   - The app supports this! Enter username and it will look up the email
   - Make sure the username exists in `user_profiles` table

---

## 📋 **Quick Checklist**

After running migration, verify:

```
Database Setup:
[ ] user_profiles table exists
[ ] Table has all required columns
[ ] RLS is enabled
[ ] Policies are created
[ ] Trigger on_auth_user_created exists
[ ] Function handle_new_user exists

Testing:
[ ] Can register new user
[ ] Profile auto-created in database
[ ] Email verification works
[ ] Login blocked when pending
[ ] Login works when approved
[ ] Admin dashboard accessible (if admin)
```

---

## 🎯 **What the Migration Does**

### **1. Creates `user_profiles` Table**
- Stores user metadata
- Links to `auth.users` via foreign key
- Stores approval status, admin flag, etc.

### **2. Sets Up Row Level Security (RLS)**
- Users can only see their own profile
- Admins can see all profiles
- Protects sensitive data

### **3. Creates Auto-Profile Trigger**
- Runs automatically when user registers
- Creates profile row in `user_profiles`
- Sets default values (pending, not admin)

### **4. Adds Helper Functions**
- `handle_new_user()` - Creates profile on signup
- `handle_updated_at()` - Updates timestamp on changes

---

## ✅ **Summary**

**Before Migration:**
- ❌ No `user_profiles` table
- ❌ Login fails: "Invalid credentials"
- ❌ Can't check approval status

**After Migration:**
- ✅ `user_profiles` table created
- ✅ Auto-profile creation on signup
- ✅ Login works with email/username
- ✅ Dual-gating security (email + approval)
- ✅ Admin dashboard functional

---

## 🚀 **Next Steps**

Once migration is complete:

1. ✅ Test registration flow
2. ✅ Test email verification
3. ✅ Test login (before/after approval)
4. ✅ Create admin user
5. ✅ Test admin dashboard
6. ✅ Configure SMTP for production emails

---

**Run the migration now and test the complete flow!** 🎉

All login errors should be resolved after this.
