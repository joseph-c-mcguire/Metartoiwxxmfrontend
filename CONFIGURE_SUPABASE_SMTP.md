# 🔧 Configure Supabase SMTP for Email Verification

## ❌ **Common Mistake**

**Edge Function Secrets ≠ Auth Email Settings**

- ❌ Adding `RESEND_API_KEY` to Edge Function Secrets → Does NOT send auth emails
- ✅ Configuring SMTP in Dashboard → DOES send auth emails

**Edge Function secrets** are for custom code you write.  
**SMTP settings** are for Supabase Auth emails (signup, password reset, etc.)

---

## ✅ **Correct Setup: Configure SMTP in Dashboard**

### **Step 1: Go to Supabase Dashboard**

1. Open: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Settings** (gear icon in sidebar)

---

### **Step 2: Find Authentication Settings**

1. In Settings, click: **Authentication**
2. Scroll down to: **SMTP Settings** section
3. Click **Enable Custom SMTP** (if not already enabled)

---

### **Step 3: Configure Resend SMTP**

Enter these exact settings:

```
SMTP Provider Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sender email:        noreply@yourdomain.com
                     (or any email you want to send from)

Sender name:         METAR Converter
                     (or your app name)

Host:                smtp.resend.com

Port number:         587

Username:            resend

Password:            [Your RESEND_API_KEY]
                     (Paste your actual Resend API key here)
                     (It starts with: re_...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **Step 4: Important - Sender Email**

⚠️ **Critical**: The sender email must be from a domain you control!

**Option A: Use Resend's Testing Domain (Quick)**
```
Sender email: onboarding@resend.dev
```
✅ Works immediately for testing  
❌ Emails might go to spam  
❌ Not for production

**Option B: Use Your Own Domain (Recommended for Production)**
```
Sender email: noreply@yourdomain.com
```
✅ Professional appearance  
✅ Better deliverability  
⚠️ Requires DNS verification (see below)

---

### **Step 5: Enable Email Confirmation**

1. Still in **Authentication** settings
2. Find: **Email Auth Provider** section
3. Ensure **Enable Email Signup** is ON
4. Ensure **Confirm email** is ON (enabled)

This makes email verification mandatory!

---

### **Step 6: Set Redirect URLs**

1. In **Authentication** settings
2. Find: **Redirect URLs** section
3. Add your app URL(s):
   ```
   http://localhost:3000/auth/callback     (for development)
   https://yourapp.com/auth/callback       (for production)
   ```

---

### **Step 7: Save & Test**

1. Click **Save** at the bottom
2. Test by registering a new user
3. Check your email inbox (and spam!)

---

## 🔑 **Getting Your Resend API Key**

If you don't have your Resend API key handy:

### **Step 1: Login to Resend**
- Go to: https://resend.com/login
- Login to your account

### **Step 2: Create/Find API Key**
- Navigate to: **API Keys** in the sidebar
- Look for existing key OR click **Create API Key**
- Copy the key (starts with `re_...`)

### **Step 3: Paste in Supabase SMTP Password**
- Go back to Supabase Dashboard
- Paste the key in the **Password** field under SMTP Settings
- Save

---

## 🏠 **Using Your Own Domain (Optional but Recommended)**

For better email deliverability and professional appearance:

### **Step 1: Add Domain in Resend**

1. Go to: https://resend.com/domains
2. Click **Add Domain**
3. Enter your domain: `yourdomain.com`

### **Step 2: Add DNS Records**

Resend will show you DNS records to add:

```
Type: TXT
Name: resend._domainkey.yourdomain.com
Value: [provided by Resend]

Type: TXT  
Name: _dmarc.yourdomain.com
Value: [provided by Resend]
```

Add these to your domain's DNS settings (where you manage your domain).

### **Step 3: Verify Domain**

1. After adding DNS records, wait 5-10 minutes
2. Click **Verify** in Resend dashboard
3. Once verified, you can use `noreply@yourdomain.com`

### **Step 4: Update Supabase SMTP**

1. Go back to Supabase Dashboard → Settings → Authentication → SMTP
2. Change **Sender email** to: `noreply@yourdomain.com`
3. Save

---

## 🧪 **Testing SMTP Configuration**

After saving SMTP settings:

### **Test 1: Register New User**

1. Go to your app
2. Register with a **real email address you can access**
3. Wait 1-2 minutes
4. Check inbox (and spam folder!)

**Expected Result:**
- ✅ Email arrives with subject about confirming email
- ✅ Contains "Confirm your email address" button
- ✅ Sent from your configured sender email

---

### **Test 2: Check Supabase Logs**

1. Go to: **Authentication** → **Logs** (in Supabase Dashboard)
2. Look for recent email events
3. Check for errors

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | Wrong API key | Double-check RESEND_API_KEY |
| "Sender not verified" | Domain not verified | Use onboarding@resend.dev OR verify domain |
| "Connection refused" | Wrong host/port | Use smtp.resend.com:587 |
| "Email not sent" | SMTP not enabled | Enable Custom SMTP in dashboard |

---

### **Test 3: Check Resend Dashboard**

1. Go to: https://resend.com/emails
2. See if emails are being sent
3. Check delivery status

---

## 📊 **Quick Checklist**

Use this to verify your setup:

```
SMTP Configuration:
[ ] Custom SMTP enabled in Supabase Dashboard
[ ] Host: smtp.resend.com
[ ] Port: 587  
[ ] Username: resend
[ ] Password: [Your RESEND_API_KEY starting with re_...]
[ ] Sender email configured (onboarding@resend.dev or your domain)
[ ] Sender name configured

Authentication Settings:
[ ] Email Auth Provider enabled
[ ] "Confirm email" enabled
[ ] Redirect URLs added (with /auth/callback)

Testing:
[ ] Registered test user
[ ] Email received in inbox (or spam)
[ ] Can click link and verify email
[ ] Auth state changes detected in app
```

---

## 🔍 **Troubleshooting**

### **"Still No Emails Received"**

#### **Check 1: SMTP Settings Applied?**
```
Dashboard → Settings → Authentication → SMTP Settings
- Is "Enable Custom SMTP" turned ON?
- Are all fields filled correctly?
- Did you click "Save"?
```

#### **Check 2: Confirm Email Enabled?**
```
Dashboard → Authentication → Providers → Email
- Is "Confirm email" toggled ON?
```

#### **Check 3: Resend API Key Valid?**
```
- Go to: https://resend.com/api-keys
- Verify your API key is active
- Try creating a new API key
- Copy exact key (no extra spaces!)
```

#### **Check 4: Check Spam Folder**
```
- Gmail: Check "Spam" and "Promotions" tabs
- Outlook: Check "Junk Email" folder
- Apple Mail: Check "Junk" folder
```

#### **Check 5: Wait a Bit Longer**
```
- Emails can take 1-5 minutes to arrive
- Try waiting 5 minutes before re-testing
```

#### **Check 6: Supabase Auth Logs**
```
Dashboard → Authentication → Logs
- Look for "email" events
- Check for error messages
- Red errors indicate SMTP issues
```

---

## 📧 **Alternative: Use SendGrid Instead**

If Resend isn't working, try SendGrid:

### **SendGrid SMTP Settings:**
```
Host:     smtp.sendgrid.net
Port:     587
Username: apikey
Password: [Your SendGrid API Key starting with SG.]
```

### **Get SendGrid API Key:**
1. Sign up: https://sendgrid.com
2. Go to: Settings → API Keys
3. Create API Key with "Mail Send" permissions
4. Copy and use as SMTP password

---

## 💡 **Pro Tips**

### **Tip 1: Use Testing Domain First**
```
Start with: onboarding@resend.dev
- Works immediately
- No DNS setup needed
- Great for testing

Switch to custom domain later:
- Better deliverability
- Professional appearance
- Required for production
```

### **Tip 2: Check Rate Limits**
```
Resend Free Tier:
- 3,000 emails/month
- 100 emails/day

If exceeded:
- Emails won't send
- Check Resend dashboard for usage
```

### **Tip 3: Customize Email Template**
```
Dashboard → Authentication → Email Templates
- Customize "Confirm signup" template
- Add your branding
- Make it match your app
```

---

## 📸 **Visual Guide**

### **Where to Find SMTP Settings:**

```
Supabase Dashboard
└── [Your Project]
    └── Settings (⚙️ gear icon)
        └── Authentication
            └── Scroll down to "SMTP Settings"
                └── Toggle "Enable Custom SMTP"
                    └── Fill in the form:
                        - Sender email
                        - Sender name  
                        - Host
                        - Port
                        - Username
                        - Password
                    └── Click "Save"
```

---

## 🎯 **Summary**

**The Issue:**
- Edge Function secrets don't affect auth emails
- `RESEND_API_KEY` was added to wrong place

**The Solution:**
- Configure SMTP in: Dashboard → Settings → Authentication → SMTP Settings
- Use these values:
  - Host: `smtp.resend.com`
  - Port: `587`
  - Username: `resend`
  - Password: Your Resend API key
  - Sender: `onboarding@resend.dev` (for testing)

**After Setup:**
- Register new user
- Email should arrive within 1-2 minutes
- Check spam folder if not in inbox

---

## ✅ **Next Steps**

1. ✅ Go to Supabase Dashboard
2. ✅ Navigate to Settings → Authentication → SMTP Settings
3. ✅ Enable Custom SMTP
4. ✅ Enter Resend SMTP configuration
5. ✅ Save settings
6. ✅ Test by registering new user
7. ✅ Check email inbox (and spam!)

---

**Once SMTP is configured, emails will start flowing!** 📧

Let me know if you need help with any specific step! 🚀
