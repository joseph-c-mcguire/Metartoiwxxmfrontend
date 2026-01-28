# ✅ Accessibility Testing Checklist

## 🎯 Overview

Use this checklist to verify accessibility compliance for the METAR Converter application.

---

## 📋 Quick Test Checklist

### **Before Release - 15 Minute Test:**

1. [ ] **Keyboard Only Test** - Unplug mouse, navigate entire app with Tab/Enter/Arrow keys
2. [ ] **Screen Reader Test** - Turn on NVDA/VoiceOver, use the app
3. [ ] **Zoom Test** - Zoom to 200%, verify nothing breaks
4. [ ] **Color Blind Test** - Enable color blind mode, check all features work
5. [ ] **High Contrast Test** - Enable high contrast, verify readability
6. [ ] **Motion Test** - Enable reduce motion, verify no jarring changes

---

## 🖱️ Keyboard Navigation

### **Global Navigation:**
- [ ] Tab moves focus forward through interactive elements
- [ ] Shift+Tab moves focus backward
- [ ] Enter activates buttons and links
- [ ] Space activates buttons and toggles checkboxes
- [ ] Escape closes modals/dialogs
- [ ] Skip to content link appears on first Tab
- [ ] Focus indicator is visible on all elements
- [ ] No keyboard traps (can always Tab out)
- [ ] Focus order is logical (top to bottom, left to right)

### **Keyboard Shortcuts:**
- [ ] Alt+A opens accessibility menu
- [ ] Alt+T toggles theme
- [ ] Shortcuts work from any page
- [ ] Shortcuts don't conflict with browser/OS shortcuts

### **Forms:**
- [ ] All form fields reachable by keyboard
- [ ] Labels announce field purpose
- [ ] Errors announced when validation fails
- [ ] Can submit form with Enter key
- [ ] Can reset form with keyboard
- [ ] Autocomplete suggestions navigable with arrow keys

### **Dialogs/Modals:**
- [ ] Focus moves to dialog when opened
- [ ] Tab cycles within dialog (focus trap)
- [ ] Escape closes dialog
- [ ] Focus returns to trigger element when closed
- [ ] Dialog title announced when opened

---

## 🔊 Screen Reader Testing

### **Test with NVDA (Windows):**

**Setup:**
1. Download NVDA from https://www.nvaccess.org/
2. Install and run
3. Press NVDA+N to open menu
4. Navigate to Preferences > Settings > Speech to adjust speed

**Testing:**

#### **Page Structure:**
- [ ] Page title announced on load ("METAR Converter - Login")
- [ ] Main heading announced (h1 "METAR Converter")
- [ ] Can navigate by headings (H key)
- [ ] Can navigate by landmarks (D key)
- [ ] Skip to content link works (Tab, Enter)

#### **Forms:**
- [ ] Form field labels announced
- [ ] Field type announced ("Email, edit, required")
- [ ] Validation errors announced immediately
- [ ] Success messages announced
- [ ] Submit button state announced ("Authenticating..." when loading)

#### **Buttons:**
- [ ] All buttons have names (not just icon)
- [ ] Button purpose is clear from label
- [ ] Button states announced ("pressed", "expanded")
- [ ] Loading states announced ("Please wait")

#### **Dynamic Content:**
- [ ] Toast notifications announced
- [ ] File upload status announced
- [ ] Conversion progress announced
- [ ] Error messages announced

#### **Tables (if applicable):**
- [ ] Table caption announced
- [ ] Column headers announced
- [ ] Row headers announced
- [ ] Cell data announced in context

---

### **Test with VoiceOver (Mac):**

**Setup:**
1. Press Cmd+F5 to enable VoiceOver
2. Press VO+Cmd+F8 to open VoiceOver Utility
3. Navigate to Speech > Voices to adjust

**Testing:**

#### **Rotor Navigation:**
- [ ] Press VO+U to open rotor
- [ ] Can navigate by headings
- [ ] Can navigate by landmarks
- [ ] Can navigate by form controls
- [ ] Can navigate by links

#### **Web Spot:**
- [ ] Web content identified as "web content"
- [ ] Can enter web area (VO+Shift+Down)
- [ ] Can exit web area (VO+Shift+Up)

#### **Interaction:**
- [ ] All interactive elements reachable
- [ ] Double-tap to activate works (trackpad)
- [ ] Form fields editable
- [ ] Modals trap focus properly

---

## 👁️ Visual Accessibility

### **Color Contrast:**

**Tool:** Use browser DevTools or https://webaim.org/resources/contrastchecker/

- [ ] Normal text: 4.5:1 minimum contrast ratio
- [ ] Large text (18px+): 3:1 minimum contrast ratio
- [ ] UI components: 3:1 minimum contrast ratio
- [ ] High contrast mode: 7:1+ contrast ratio

**Test Pages:**
- [ ] Login page
- [ ] Register page
- [ ] File converter page
- [ ] Admin dashboard
- [ ] All dialogs/modals

### **Color Blindness:**

**Enable color blind modes in accessibility menu:**

- [ ] **Protanopia (Red-Blind)** - Can distinguish all UI states
- [ ] **Deuteranopia (Green-Blind)** - Can distinguish all UI states
- [ ] **Tritanopia (Blue-Blind)** - Can distinguish all UI states
- [ ] **Monochrome** - Can distinguish all UI states

**Check:**
- [ ] No information conveyed by color alone
- [ ] Icons or text accompany color states
- [ ] Error states have icon + text (not just red)
- [ ] Success states have icon + text (not just green)
- [ ] Form validation clear without color

### **Font Sizes:**

- [ ] **Small (12px)** - All text readable
- [ ] **Medium (14px)** - Default, comfortable
- [ ] **Large (16px)** - No layout breaks
- [ ] **X-Large (18px)** - No content hidden/cut off
- [ ] **200% zoom** - No horizontal scrolling
- [ ] **400% zoom** - Content still accessible

### **Font Styles:**

- [ ] **Default** - Inter font loads correctly
- [ ] **Dyslexic** - OpenDyslexic font loads correctly
- [ ] **Monospace** - JetBrains Mono applies everywhere
- [ ] All fonts readable at all sizes

### **Visual Focus Indicators:**

- [ ] Visible on all interactive elements
- [ ] 2px minimum thickness
- [ ] High contrast with background
- [ ] Not removed by custom CSS
- [ ] Works in high contrast mode

---

## 🎬 Motion & Animation

### **Reduce Motion:**

**Enable reduce motion in accessibility menu:**

- [ ] No spinning animations
- [ ] No sliding transitions
- [ ] No auto-playing video
- [ ] Smooth scrolling disabled
- [ ] Loading indicators static (or minimal animation)
- [ ] Page transitions instant
- [ ] Modal open/close instant
- [ ] Carousel auto-advance disabled

**Test:**
- [ ] File upload animation respects setting
- [ ] Navigation transitions respect setting
- [ ] Toast notifications appear without motion
- [ ] Theme toggle transition respects setting

---

## 📱 Mobile Accessibility

### **Touch Targets:**

**Minimum size: 44x44px**

- [ ] All buttons 44x44px minimum
- [ ] Links have adequate padding
- [ ] Form inputs tall enough (44px height)
- [ ] Icon buttons large enough
- [ ] Adequate spacing between targets (8px minimum)

### **Mobile Screen Readers:**

**iOS VoiceOver:**
- [ ] Enable: Settings > Accessibility > VoiceOver
- [ ] Swipe left/right to navigate
- [ ] Double-tap to activate
- [ ] Two-finger swipe to scroll
- [ ] All controls announced correctly

**Android TalkBack:**
- [ ] Enable: Settings > Accessibility > TalkBack
- [ ] Swipe left/right to navigate
- [ ] Double-tap to activate
- [ ] All controls announced correctly

### **Responsive Design:**

- [ ] No horizontal scrolling on mobile
- [ ] Text readable without zoom
- [ ] Forms usable without zoom
- [ ] Accessibility menu accessible on mobile
- [ ] All features available on small screens

---

## 🧪 Automated Testing

### **Browser DevTools:**

**Chrome Lighthouse:**
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Click "Generate report"

**Checklist:**
- [ ] Accessibility score 90+ (green)
- [ ] No critical issues
- [ ] All images have alt text
- [ ] All form elements have labels
- [ ] Sufficient color contrast

### **axe DevTools:**

**Installation:**
1. Install browser extension: https://www.deque.com/axe/devtools/
2. Open DevTools
3. Go to axe DevTools tab
4. Click "Scan ALL of my page"

**Checklist:**
- [ ] 0 critical issues
- [ ] 0 serious issues
- [ ] Review moderate issues
- [ ] Review minor issues
- [ ] All automatic checks pass

### **WAVE:**

**Tool:** https://wave.webaim.org/

**Checklist:**
- [ ] 0 errors
- [ ] 0 contrast errors
- [ ] All alerts reviewed
- [ ] All features reviewed
- [ ] Structural elements correct

---

## 📝 Manual Content Review

### **Alt Text:**

**Images:**
- [ ] All functional images have descriptive alt text
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Complex images have extended descriptions
- [ ] Logo has appropriate alt text
- [ ] Error state images have alt text

**Icons:**
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Functional icons have text alternatives
- [ ] Icon-only buttons have `aria-label`
- [ ] Icons don't interfere with text

### **Headings:**

- [ ] Only one h1 per page
- [ ] Heading hierarchy correct (no skipping levels)
- [ ] Headings describe content
- [ ] Headings used for structure, not styling
- [ ] All major sections have headings

### **Links:**

- [ ] Link text describes destination
- [ ] No "click here" links
- [ ] External links indicated
- [ ] File download links indicate file type/size
- [ ] Link purpose clear from text alone

### **Form Labels:**

- [ ] All inputs have visible labels
- [ ] Labels use `<label>` element with `htmlFor`
- [ ] Placeholder text not used as only label
- [ ] Required fields indicated
- [ ] Field format explained (email, date, etc.)

---

## 🔍 WCAG 2.1 Level AA Criteria

### **Perceivable:**

1.1 Text Alternatives:
- [ ] All images have alt text

1.2 Time-based Media:
- [ ] Captions for video (if applicable)
- [ ] Audio descriptions (if applicable)

1.3 Adaptable:
- [ ] Info/structure/relationships programmatically determined
- [ ] Meaningful sequence maintained
- [ ] Instructions don't rely on sensory characteristics

1.4 Distinguishable:
- [ ] Color not used as only means of conveying info
- [ ] Audio control available (if auto-playing)
- [ ] Contrast ratio minimum 4.5:1
- [ ] Text can be resized 200% without loss
- [ ] Images of text avoided (except logos)
- [ ] Reflow works at 320px width
- [ ] Text spacing adjustable
- [ ] Content on hover/focus dismissible and hoverable

### **Operable:**

2.1 Keyboard Accessible:
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Keyboard shortcuts documented

2.2 Enough Time:
- [ ] Time limits adjustable or none
- [ ] Moving/blinking/scrolling can be paused
- [ ] Auto-updating can be paused

2.3 Seizures:
- [ ] No content flashes more than 3 times per second

2.4 Navigable:
- [ ] Bypass blocks (skip to content)
- [ ] Page titled
- [ ] Focus order logical
- [ ] Link purpose clear from text
- [ ] Multiple ways to find pages
- [ ] Headings and labels descriptive
- [ ] Focus visible

2.5 Input Modalities:
- [ ] All gestures available via single pointer
- [ ] Touch targets 44x44px minimum
- [ ] Labels match accessible names

### **Understandable:**

3.1 Readable:
- [ ] Language of page identified
- [ ] Language of parts identified (if different)

3.2 Predictable:
- [ ] On focus - no unexpected context change
- [ ] On input - no unexpected context change
- [ ] Navigation consistent
- [ ] Identification consistent

3.3 Input Assistance:
- [ ] Errors identified
- [ ] Labels or instructions provided
- [ ] Error suggestions provided
- [ ] Error prevention for legal/financial/data

### **Robust:**

4.1 Compatible:
- [ ] Valid HTML (no parsing errors)
- [ ] Name, role, value available for all components
- [ ] Status messages use ARIA live regions

---

## 🎓 User Testing

### **Recruit Real Users:**

**Target Groups:**
- [ ] Blind users (screen reader users)
- [ ] Low vision users
- [ ] Color blind users
- [ ] Keyboard-only users
- [ ] Users with dyslexia
- [ ] Users with motor impairments
- [ ] Older users
- [ ] Mobile users

### **Testing Tasks:**

1. **Registration:**
   - [ ] Create new account
   - [ ] Verify email
   - [ ] Wait for approval

2. **Login:**
   - [ ] Enter credentials
   - [ ] Handle errors
   - [ ] Successful login

3. **File Conversion:**
   - [ ] Upload files
   - [ ] Convert files
   - [ ] Download results

4. **Settings:**
   - [ ] Change accessibility settings
   - [ ] Change preferences
   - [ ] Verify changes persist

5. **Admin (if applicable):**
   - [ ] Approve users
   - [ ] View statistics
   - [ ] Manage system

### **Collect Feedback:**

- [ ] What was confusing?
- [ ] What was difficult?
- [ ] What could be improved?
- [ ] What worked well?
- [ ] Would you use this application?

---

## 📊 Testing Documentation

### **Create Test Report:**

**Include:**
- Date of testing
- Testing environment (browser, OS, screen reader)
- Issues found
- Severity of issues (Critical/Serious/Moderate/Minor)
- Steps to reproduce
- Recommendations
- Re-test results

**Template:**
```markdown
# Accessibility Test Report

**Date:** January 28, 2026
**Tester:** [Name]
**Environment:** Chrome 120, Windows 11, NVDA 2024.1

## Issues Found

### Critical (0)
None

### Serious (0)
None

### Moderate (1)
1. Focus indicator not visible on X button in high contrast mode
   - **Steps:** Enable high contrast, tab to X button
   - **Expected:** Visible focus indicator
   - **Actual:** Focus indicator hard to see
   - **Recommendation:** Increase outline thickness to 3px

### Minor (2)
1. Loading spinner announces twice
2. Toast timing too fast for screen reader

## Summary
Application is highly accessible. Minor issues do not prevent use.

## Score: 95/100
```

---

## 🚀 Continuous Testing

### **Integrate into Development:**

- [ ] Run axe DevTools before every commit
- [ ] Run Lighthouse before every deploy
- [ ] Test with keyboard weekly
- [ ] Test with screen reader monthly
- [ ] User testing quarterly

### **Regression Testing:**

- [ ] Create automated accessibility tests
- [ ] Add to CI/CD pipeline
- [ ] Test on all supported browsers
- [ ] Test on all supported devices

---

## 📚 Resources

### **Tools:**
- **NVDA** - https://www.nvaccess.org/
- **axe DevTools** - https://www.deque.com/axe/devtools/
- **WAVE** - https://wave.webaim.org/
- **Color Contrast Checker** - https://webaim.org/resources/contrastchecker/
- **Lighthouse** - Built into Chrome DevTools

### **Guidelines:**
- **WCAG 2.1** - https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices** - https://www.w3.org/WAI/ARIA/apg/

### **Learning:**
- **WebAIM** - https://webaim.org/
- **A11y Project** - https://www.a11yproject.com/
- **Deque University** - https://dequeuniversity.com/

---

**Remember:** Accessibility is not a one-time task. It's an ongoing commitment to inclusive design.

**Last Updated:** January 28, 2026
