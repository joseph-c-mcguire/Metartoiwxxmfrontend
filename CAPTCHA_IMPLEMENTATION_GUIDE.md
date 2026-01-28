# 🤖 CAPTCHA Implementation Guide

## Overview

This guide explains how to add hCaptcha to your METAR Converter registration system with:
- ✅ CAPTCHA after 2 failed registration attempts
- ✅ 5-minute lockout after 5 failed attempts
- ✅ Smart attempt tracking using localStorage
- ✅ Scientific theme styling
- ✅ Clear user feedback

---

## ✅ Package Installed

```bash
✓ @hcaptcha/react-hcaptcha v2.0.2 installed successfully
```

---

## 🔧 Step 1: Get hCaptcha Keys

### Sign up for hCaptcha

1. Go to https://www.hcaptcha.com/
2. Sign up for a free account
3. Add your site:
   - **Site Name**: METAR Converter
   - **Domain**: localhost (for development)
4. Copy your keys:
   - **Site Key**: Public key (visible to users)
   - **Secret Key**: Private key (for Supabase backend)

### Add to Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Bot and Abuse Protection**
2. Toggle **Enable CAPTCHA protection** to ON
3. Select **hCaptcha** from dropdown
4. Paste your **Secret Key**
5. Click **Save**

---

## 📝 Step 2: Environment Configuration

Create a `.env.local` file (if not exists):

```env
# Public hCaptcha Site Key (safe to expose)
VITE_HCAPTCHA_SITE_KEY=your-site-key-here
```

**For production deployment:**
- Add production domain to hCaptcha dashboard
- Update environment variable in hosting platform
- Use same site key (hCaptcha allows multiple domains)

---

## 🎯 Step 3: Implement CAPTCHA Logic

### Features to Implement

```typescript
// Attempt tracking interface
interface RegistrationAttempts {
  count: number;
  lastAttempt: number; // timestamp
  lockedUntil?: number; // timestamp
}

// localStorage key
const ATTEMPTS_KEY = 'registration_attempts';
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const CAPTCHA_THRESHOLD = 2; // Show CAPTCHA after 2 attempts
```

### Key Logic Points

**1. Check if user is locked out:**
```typescript
const isLockedOut = () => {
  const attempts = getAttempts();
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const minutesLeft = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return { locked: true, minutesLeft };
  }
  return { locked: false };
};
```

**2. Show CAPTCHA conditionally:**
```typescript
const shouldShowCaptcha = () => {
  const attempts = getAttempts();
  return attempts.count >= CAPTCHA_THRESHOLD;
};
```

**3. Handle failed attempts:**
```typescript
const recordFailedAttempt = () => {
  const attempts = getAttempts();
  const newCount = attempts.count + 1;
  
  if (newCount >= MAX_ATTEMPTS) {
    // Lock out for 5 minutes
    setAttempts({
      count: newCount,
      lastAttempt: Date.now(),
      lockedUntil: Date.now() + LOCKOUT_DURATION
    });
  } else {
    setAttempts({
      count: newCount,
      lastAttempt: Date.now()
    });
  }
};
```

**4. Reset on success:**
```typescript
const resetAttempts = () => {
  localStorage.removeItem(ATTEMPTS_KEY);
};
```

---

## 💻 Step 4: Component Implementation

### Updated Register Component Structure

```typescript
import { useState, useRef, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const captchaRef = useRef<HCaptcha>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();

  // Check lockout status on mount
  useEffect(() => {
    const lockStatus = checkLockout();
    if (lockStatus.locked) {
      setIsLockedOut(true);
      setLockoutTimeLeft(lockStatus.minutesLeft);
    }
    
    // Check if should show CAPTCHA
    setShowCaptcha(shouldShowCaptcha());
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut) return;
    
    const timer = setInterval(() => {
      const lockStatus = checkLockout();
      if (!lockStatus.locked) {
        setIsLockedOut(false);
        setLockoutTimeLeft(0);
        resetAttempts();
      } else {
        setLockoutTimeLeft(lockStatus.minutesLeft);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isLockedOut]);

  const onSubmit = async (data: RegisterFormData) => {
    // Check if locked out
    const lockStatus = checkLockout();
    if (lockStatus.locked) {
      toast.error(`Too many attempts. Please wait ${lockStatus.minutesLeft} more minutes.`);
      return;
    }

    // Check if CAPTCHA is required but not completed
    if (showCaptcha && !captchaToken) {
      toast.error('Please complete the CAPTCHA verification');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
          captchaToken: captchaToken || undefined,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        // Record failed attempt
        recordFailedAttempt();
        
        // Check if we hit the threshold
        const newAttempts = getAttempts();
        if (newAttempts.count >= CAPTCHA_THRESHOLD) {
          setShowCaptcha(true);
        }
        if (newAttempts.lockedUntil) {
          setIsLockedOut(true);
          setLockoutTimeLeft(Math.ceil((newAttempts.lockedUntil - Date.now()) / 60000));
        }
        
        // Reset CAPTCHA
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
          setCaptchaToken(null);
        }
        
        toast.error(authError.message || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Success - reset attempts
      resetAttempts();
      toast.success('Account created! Check your email to verify.');
      onRegister(data.email);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      {/* ... existing JSX ... */}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Existing form fields */}
        
        {/* CAPTCHA Section (conditional) */}
        {showCaptcha && !isLockedOut && (
          <div className="border border-border p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
              Security Verification Required
            </p>
            <HCaptcha
              ref={captchaRef}
              sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => {
                setCaptchaToken(null);
                toast.error('CAPTCHA error. Please try again.');
              }}
              theme="light" // or "dark" based on theme
            />
          </div>
        )}
        
        {/* Lockout Warning */}
        {isLockedOut && (
          <div className="border border-destructive bg-destructive/10 p-4">
            <p className="text-sm font-mono text-destructive">
              ⚠️ TOO MANY FAILED ATTEMPTS
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Please wait {lockoutTimeLeft} minute{lockoutTimeLeft !== 1 ? 's' : ''} before trying again.
            </p>
          </div>
        )}
        
        <Button
          type="submit"
          disabled={isLoading || isLockedOut}
          className="w-full h-10 text-xs"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}
```

---

## 🎨 Step 5: Scientific Theme Styling

### CAPTCHA Container Styling

```typescript
<div className="border border-border p-4 bg-muted/30">
  <div className="flex items-center gap-2 mb-3">
    <div className="w-1 h-4 bg-accent"></div>
    <p className="text-xs text-muted-foreground uppercase tracking-wide font-mono">
      Security Verification
    </p>
  </div>
  <HCaptcha
    ref={captchaRef}
    sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
    onVerify={(token) => setCaptchaToken(token)}
    theme="light" // Changes to "dark" automatically with dark mode
  />
</div>
```

### Lockout Warning Styling

```typescript
<div className="border-2 border-destructive bg-destructive/5 p-4">
  <div className="flex items-start gap-3">
    <div className="mt-0.5">
      <div className="w-5 h-5 border-2 border-destructive rounded-full flex items-center justify-center">
        <span className="text-destructive text-xs font-bold">!</span>
      </div>
    </div>
    <div>
      <p className="text-sm font-mono font-semibold text-destructive uppercase tracking-wide">
        Account Temporarily Locked
      </p>
      <p className="text-xs text-foreground/70 mt-2 font-mono">
        Too many failed registration attempts detected.
      </p>
      <p className="text-xs text-foreground/70 mt-1 font-mono">
        Access will be restored in: <span className="font-bold text-destructive">{lockoutTimeLeft} minutes</span>
      </p>
    </div>
  </div>
</div>
```

---

## 🧪 Step 6: Testing Workflow

### Test Scenario 1: Normal Registration

1. Open registration page
2. Fill in valid details
3. Click "Create Account"
4. **Expected**: No CAPTCHA shown, success message

### Test Scenario 2: Trigger CAPTCHA

1. Try to register with existing email (fail attempt #1)
2. Try again with same email (fail attempt #2)
3. **Expected**: CAPTCHA appears
4. Complete CAPTCHA
5. Try with valid email
6. **Expected**: Registration succeeds

### Test Scenario 3: Trigger Lockout

1. Fail registration 5 times
2. **Expected**: 
   - CAPTCHA shown after attempt #2
   - Lockout message after attempt #5
   - Button disabled
   - Countdown timer shows minutes remaining
3. Wait 5 minutes OR clear localStorage
4. **Expected**: Lockout lifts, can try again

### Test Scenario 4: localStorage Persistence

1. Fail 3 times
2. Close browser
3. Reopen page
4. **Expected**: CAPTCHA still showing, attempt count preserved

---

## 🔍 Step 7: Error Scenarios

### Common Issues & Solutions

**Issue: "CAPTCHA token invalid"**
- **Cause**: Wrong Secret Key in Supabase
- **Fix**: Verify Secret Key in Supabase Auth settings

**Issue: CAPTCHA shows on localhost but fails**
- **Cause**: Domain not registered with hCaptcha
- **Fix**: Add "localhost" to allowed domains in hCaptcha dashboard

**Issue: CAPTCHA doesn't appear**
- **Cause**: Site Key not in environment variables
- **Fix**: Check `.env.local` file has correct `VITE_HCAPTCHA_SITE_KEY`

**Issue: Lockout not working**
- **Cause**: localStorage disabled or cleared
- **Fix**: Check browser settings allow localStorage

---

## 📊 Step 8: Monitoring & Analytics

### Track CAPTCHA Usage

```typescript
// Add to your analytics
const trackCaptchaShown = () => {
  console.log('[Security] CAPTCHA displayed to user');
  // Send to analytics platform
};

const trackLockout = () => {
  console.log('[Security] User locked out for 5 minutes');
  // Send to analytics platform
};

const trackCaptchaSuccess = () => {
  console.log('[Security] CAPTCHA verified successfully');
  // Send to analytics platform
};
```

---

## 🛡️ Step 9: Security Best Practices

### DO:
- ✅ Use CAPTCHA Secret Key only on backend (Supabase)
- ✅ Keep Site Key in environment variables
- ✅ Track failed attempts per session
- ✅ Implement progressive difficulty (CAPTCHA → Lockout)
- ✅ Clear attempts after successful registration

### DON'T:
- ❌ Store Secret Key in frontend code
- ❌ Make lockout permanent (always time-limited)
- ❌ Show CAPTCHA on first attempt (bad UX)
- ❌ Allow infinite attempts without lockout
- ❌ Forget to reset CAPTCHA after failed attempts

---

## 📱 Step 10: Mobile Considerations

### Responsive Design

```typescript
<div className="border border-border p-3 sm:p-4 bg-muted/30">
  <p className="text-xs text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wide">
    Security Verification
  </p>
  <div className="transform scale-90 sm:scale-100 origin-left">
    <HCaptcha
      ref={captchaRef}
      sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
      onVerify={(token) => setCaptchaToken(token)}
      size="compact" // Better for mobile
    />
  </div>
</div>
```

---

## ✅ Implementation Checklist

```
Setup:
[ ] Sign up for hCaptcha account
[ ] Get Site Key and Secret Key
[ ] Add Secret Key to Supabase Dashboard
[ ] Add Site Key to .env.local file
[ ] Install @hcaptcha/react-hcaptcha package ✓

Code Implementation:
[ ] Add attempt tracking logic
[ ] Add lockout logic
[ ] Integrate HCaptcha component
[ ] Add conditional rendering for CAPTCHA
[ ] Add lockout warning UI
[ ] Reset CAPTCHA after failed attempts
[ ] Clear attempts on success

Styling:
[ ] Match scientific theme
[ ] Make responsive for mobile
[ ] Add dark mode support
[ ] Style lockout warning

Testing:
[ ] Test normal registration
[ ] Test CAPTCHA trigger (2 attempts)
[ ] Test lockout trigger (5 attempts)
[ ] Test lockout timeout
[ ] Test localStorage persistence
[ ] Test mobile experience

Production:
[ ] Add production domain to hCaptcha
[ ] Update environment variables
[ ] Test on production URL
[ ] Monitor CAPTCHA success rate
```

---

## 🚀 Quick Start Summary

1. **Get Keys**: Sign up at hCaptcha → Copy Site Key & Secret Key
2. **Configure Supabase**: Auth → Bot Protection → Enable CAPTCHA → Paste Secret Key
3. **Environment**: Add `VITE_HCAPTCHA_SITE_KEY=your-key` to `.env.local`
4. **Implement**: Follow Step 4 component code
5. **Test**: Try registering 3+ times to see CAPTCHA and lockout

---

**Ready to implement? This provides everything you need for a secure, user-friendly CAPTCHA system!** 🔒

Would you like me to create the actual enhanced Register.tsx component file with all this implemented?
