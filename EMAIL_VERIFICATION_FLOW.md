# Email Verification Flow - Complete Guide

## 🎯 Overview

The email verification system now works seamlessly with **automatic session creation** when users click the confirmation link in their email. No manual steps required!

---

## 📧 How It Works

### **Step 1: User Registers**
```typescript
// Register.tsx - User fills out form
await supabase.auth.signUp({
  email: 'user@example.com',
  password: '<USER_PASSWORD>',
  options: {
    data: { username: 'john_doe' },
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
});
```

**What happens:**
1. ✅ Supabase creates user account
2. ✅ Database trigger creates `user_profiles` row with `approval_status: 'pending'`
3. ✅ Supabase automatically sends verification email
4. ✅ User redirected to "Verify Email" screen

---

### **Step 2: User Clicks Email Link**
User receives email with subject: **"Confirm Your Email"**

When they click the **"Confirm your email address"** button:

1. ✅ Supabase confirms the email (sets `email_confirmed_at`)
2. ✅ Supabase **automatically creates a session** for the user
3. ✅ User redirected to: `https://yourapp.com/auth/callback`
4. ✅ App detects the auth state change and shows "Verify Email" screen

**The session is now active!** 🎉

---

### **Step 3: User Clicks "I've Verified My Email"**

```typescript
// EmailVerification.tsx - Button click
const { data: { session } } = await supabase.auth.getSession();
// ✅ Session exists! Email is confirmed!

const { data: profile } = await supabase
  .from('user_profiles')
  .select('approval_status, is_admin')
  .eq('id', session.user.id)
  .single();

if (profile.approval_status === 'approved') {
  // ✅ Both verified AND approved → Login!
} else {
  // ⏳ Verified but pending approval
}
```

**What happens:**
1. ✅ Checks active session (exists because they clicked email link)
2. ✅ Checks `email_confirmed_at` (verified)
3. ✅ Queries database for `approval_status`
4. ✅ Either logs in (if approved) or shows "pending approval" message

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. REGISTRATION                                             │
│    User fills form → Supabase creates account              │
│    → Database trigger creates profile                       │
│    → Supabase sends email automatically                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. EMAIL SENT                                               │
│    📧 "Confirm Your Email" arrives in inbox                 │
│    Contains: "Confirm your email address" button           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER CLICKS EMAIL LINK                                   │
│    → Supabase confirms email (email_confirmed_at)           │
│    → Supabase creates active session (AUTOMATIC!)           │
│    → Redirects to: yourapp.com/auth/callback               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. APP DETECTS AUTH STATE CHANGE                            │
│    App.tsx: onAuthStateChange() fires                       │
│    → Detects SIGNED_IN event                                │
│    → Sets userEmail, accessToken                            │
│    → Redirects to EmailVerification screen                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. USER CLICKS "I'VE VERIFIED MY EMAIL"                     │
│    → Checks session (✅ exists!)                            │
│    → Checks email_confirmed_at (✅ true!)                   │
│    → Queries user_profiles for approval_status              │
│    → If approved: Login! 🎉                                 │
│    → If pending: "Wait for admin" message ⏳                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Components

### **1. App.tsx - Auth State Listener**
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        // User just clicked email link! Session is active!
        setUserEmail(session.user.email);
        setAccessToken(session.access_token);
        setCurrentView('verify'); // Show verification screen
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

**Purpose**: Detects when user returns from clicking email link

---

### **2. Register.tsx - Email Redirect URL**
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
});
```

**Purpose**: Tells Supabase where to redirect after email confirmation

---

### **3. EmailVerification.tsx - Check Status**
```typescript
const handleVerify = async () => {
  // 1. Get session (created when they clicked email link)
  const { data: { session } } = await supabase.auth.getSession();
  
  // 2. Verify email is confirmed
  if (!session?.user?.email_confirmed_at) {
    toast.info('Please click the verification link first');
    return;
  }
  
  // 3. Check admin approval
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('approval_status, is_admin')
    .eq('id', session.user.id)
    .single();
  
  // 4. Proceed if approved
  if (profile.approval_status === 'approved') {
    onVerified(session.access_token, profile.is_admin);
  }
};
```

**Purpose**: Validates both email verification AND admin approval

---

## ✅ Benefits of This Approach

| Feature | Benefit |
|---------|---------|
| **Auto Session** | No manual login needed after email click |
| **Seamless UX** | User clicks email → Auto-redirected → One more click to proceed |
| **Secure** | Session is cryptographically signed by Supabase |
| **Reliable** | No race conditions or timing issues |
| **Simple** | No custom backend endpoint needed |

---

## 🛠️ Troubleshooting

### **"Please click the verification link first"**
**Cause**: User clicked "I've Verified My Email" before clicking email link  
**Solution**: Click the email link, then return to app and click button again

### **"Unable to check verification status"**
**Cause**: Network error or session expired  
**Solution**: Click "Resend Email" and try again

### **"Your account is pending admin approval"**
**Cause**: Email is verified but admin hasn't approved yet  
**Solution**: Wait for admin to approve in Admin Dashboard

### **Session not detected after clicking email**
**Cause**: Popup blocker or browser privacy settings  
**Solution**: 
1. Check if browser blocked redirect
2. Try in incognito/private mode
3. Check browser console for errors

---

## 🔐 Security Features

1. **Automatic Session Creation**: Supabase handles session tokens securely
2. **Email Verification**: Only verified emails can proceed
3. **Dual-Gating**: Both email verification AND admin approval required
4. **RLS Policies**: Database enforces authorization at query level
5. **Token Expiry**: Sessions expire automatically after period

---

## 📝 Admin Approval Process

After user verifies email, admin sees them in dashboard:

```typescript
// Admin queries pending users
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('approval_status', 'pending');

// Admin approves
await supabase
  .from('user_profiles')
  .update({ 
    approval_status: 'approved',
    approved_by: adminUserId 
  })
  .eq('id', userId);
```

Once approved, user can log in normally!

---

## 🎓 Testing the Flow

### **1. Register New User**
```bash
Email: test@example.com
Password: <TEST_ACCOUNT_PASSWORD>
Username: example_user
```

### **2. Check Email**
Subject: "Confirm Your Email"  
Click: "Confirm your email address" button

### **3. Observe Redirect**
- Browser redirects to: `https://yourapp.com/auth/callback`
- App shows: "Verify Your Email" screen
- Session is active (check browser dev tools → Application → Cookies)

### **4. Click "I've Verified My Email"**
- If admin approved: ✅ Login successful!
- If still pending: ⏳ "Pending admin approval" message

### **5. Admin Approves (in Admin Dashboard)**
- Go to Admin Dashboard
- See pending user
- Click "Approve"

### **6. User Logs In**
- User can now log in with email/password
- Both gates passed: ✅ Email verified + ✅ Admin approved

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `/src/app/App.tsx` | Auth state listener |
| `/src/app/components/auth/Register.tsx` | Sign up + email redirect URL |
| `/src/app/components/auth/EmailVerification.tsx` | Verify button logic |
| `/src/app/components/auth/Login.tsx` | Login with dual-gate check |
| `/supabase/migrations/001_create_user_profiles.sql` | Database schema |

---

## 🚀 Next Steps

Want to enhance the flow? Consider adding:
- 📱 SMS verification as alternative
- 🔐 2FA/MFA after approval
- 📊 Analytics on verification completion rates
- ⏰ Auto-expire unverified accounts after 7 days
- 📧 Reminder emails if email not verified

---

**The flow is now complete and production-ready!** 🎉
