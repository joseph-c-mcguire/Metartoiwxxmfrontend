# Supabase Email Verification Setup

Your app now uses **real Supabase email verification** for user registration and authentication with **full Supabase User API integration**!

## ✅ What's Been Implemented

### **Full Supabase Integration:**
- **user_metadata**: Stores username and profile information
- **app_metadata**: Stores approval_status, is_admin, and admin actions (approved_by, approved_at)
- **email_confirmed_at**: Tracks email verification status
- **KV Store**: Used as cache/backup for faster queries

### **Registration Flow:**
1. User fills out registration form (username, email, password)
2. Backend creates Supabase Auth user with:
   - `user_metadata`: { username, created_at }
   - `app_metadata`: { approval_status: 'pending', is_admin: false }
   - `email_confirm: false` (requires verification)
3. **Supabase automatically sends verification email** to the user
4. User profile also stored in KV store for caching

### **Email Verification:**
1. User clicks the verification link in their email
2. Supabase confirms the email automatically (updates `email_confirmed_at`)
3. User returns to app and clicks "I've Verified My Email"
4. App checks Supabase user object for:
   - ✅ `email_confirmed_at` (email verified)
   - ✅ `app_metadata.approval_status` (admin approved)
5. Both must be true to proceed

### **Login Flow:**
1. User enters email and password
2. `supabase.auth.signInWithPassword()` authenticates
3. App reads from Supabase user object:
   - Email verification status from `email_confirmed_at`
   - Approval status from `app_metadata.approval_status`
   - Admin status from `app_metadata.is_admin`
   - Username from `user_metadata.username`
4. Only allows login if both verified AND approved

### **Profile Management:**
- **GET /auth/profile**: Fetches user profile from Supabase user object
- **PUT /auth/profile**: Updates username in `user_metadata` or email
- Email changes require re-verification
- All changes sync to both Supabase Auth and KV store

### **Admin Operations:**
When admins approve/reject users or toggle admin status:
1. **Updates Supabase `app_metadata`** (source of truth)
2. **Updates KV store** (cache for faster queries)
3. **Sends email notifications** via Supabase
4. All future checks read from Supabase Auth API

---

## 🔧 Configuration Required

You need to configure email settings in your **Supabase Dashboard**:

### **Option 1: Use Supabase's Built-in Email Service (Easiest)**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Email Templates**
3. The default settings will work automatically!
4. Supabase handles email sending for you (limited to development/testing)

**Note:** Supabase's built-in email service has rate limits and is best for development. For production, use Option 2.

---

### **Option 2: Configure Custom SMTP (Recommended for Production)**

1. Go to **Settings → Authentication** in your Supabase dashboard
2. Scroll to **SMTP Settings**
3. Enable custom SMTP and configure:

   ```
   SMTP Host: smtp.your-email-provider.com
   SMTP Port: 587 (or 465 for SSL)
   SMTP User: your-email@example.com
   SMTP Password: your-email-password
   Sender Email: noreply@your-domain.com
   Sender Name: METAR Converter
   ```

4. Test the configuration with the "Send Test Email" button

**Popular SMTP Providers:**
- **SendGrid:** Free tier available, easy setup
- **Mailgun:** Developer-friendly
- **AWS SES:** Cost-effective for high volume
- **Gmail SMTP:** Good for testing (not recommended for production)

---

## 📧 Email Templates

Supabase provides default email templates that you can customize:

### **Confirmation Email (Verification):**
- Go to **Authentication → Email Templates → Confirm signup**
- Customize the email content, subject, and styling
- Use variables like `{{ .ConfirmationURL }}` for the verification link

### **Email Configuration URL:**
The confirmation URL redirects to your app after verification. Configure it:
1. Go to **Authentication → URL Configuration**
2. Set **Site URL:** `https://your-app-url.com` (or localhost for development)
3. Set **Redirect URLs:** Add your app URLs to the allowlist

---

## 🧪 Testing Email Verification

### **Development/Testing:**
1. Register a new account with a real email you can access
2. Check your inbox (and spam folder) for the verification email
3. Click the verification link
4. You'll be redirected back to your app
5. Click "I've Verified My Email" button
6. App will check verification status and approval

### **Troubleshooting:**
- **No email received?**
  - Check spam/junk folder
  - Verify SMTP settings in Supabase dashboard
  - Check Supabase logs: **Logs → Auth Logs**
  
- **Verification link doesn't work?**
  - Check URL configuration in Supabase dashboard
  - Ensure redirect URLs are whitelisted
  
- **"Email not verified" error?**
  - Make sure you clicked the link in the email
  - Wait a few seconds and try "I've Verified My Email" again

---

## 🔑 Environment Variables

Your app already has these configured:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key for client-side
- `SUPABASE_SERVICE_ROLE_KEY` - Backend server key (keep secret!)

---

## 📝 Summary

**What works now:**
- ✅ Real Supabase email verification (no mock)
- ✅ Email sent automatically on registration
- ✅ Resend verification email functionality
- ✅ Dual-gating: Email verification + Admin approval
- ✅ Proper session management with Supabase Auth

**Next steps:**
1. Configure SMTP settings in Supabase dashboard (Option 2 above)
2. Customize email templates to match your branding
3. Test the full registration → verification → approval → login flow
4. (Optional) Set up a first admin user for approvals

---

## 👤 Creating Your First Admin User

Since all new users require approval, you need at least one admin to approve others:

### **Option A: Manually via KV Store**
After a user registers and verifies their email, you can manually set them as admin:
1. Get their `user_id` from Supabase Auth dashboard
2. Update their profile in KV store to include:
   ```json
   {
     "approval_status": "approved",
     "is_admin": true
   }
   ```

### **Option B: Temporarily bypass approval**
You can temporarily modify the backend to auto-approve the first user, then remove that code.

---

**Questions?** Check the Supabase documentation: https://supabase.com/docs/guides/auth