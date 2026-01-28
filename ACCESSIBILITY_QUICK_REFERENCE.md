# ♿ Accessibility Quick Reference Card

## 🚀 For End Users

### **Access Accessibility Menu**
- **Click**: Blue settings button (bottom-right corner)
- **Keyboard**: Press `Alt + A`
- **Screen Reader**: Tab to "Open accessibility settings"

### **Available Settings**

| Feature | Options | Use Case |
|---------|---------|----------|
| **Font Size** | Small, Medium, Large, X-Large | Vision impairment |
| **Font Style** | Default, Dyslexic, Monospace | Dyslexia, readability |
| **Color Vision** | 5 modes | Color blindness |
| **High Contrast** | On/Off | Low vision |
| **Reduce Motion** | On/Off | Motion sensitivity |

### **Keyboard Shortcuts**

```
Alt + A     Open accessibility menu
Alt + T     Toggle light/dark theme
Tab         Navigate forward
Shift+Tab   Navigate backward
Enter       Activate button/link
Space       Activate button/checkbox
Esc         Close dialog/modal
```

### **Screen Reader Users**

**Recommended:**
- Windows: NVDA (free) - https://www.nvaccess.org/
- Mac: VoiceOver (built-in) - Cmd+F5
- Mobile: VoiceOver (iOS) or TalkBack (Android)

**Navigation:**
- H key - Jump between headings
- D key - Jump between landmarks
- F key - Jump between form fields
- Tab - Navigate interactive elements

---

## 👨‍💻 For Developers

### **Quick Checks Before Commit**

```bash
✓ Tab through entire page (keyboard only)
✓ Run axe DevTools scan
✓ Check Lighthouse accessibility score (90+)
✓ Verify focus indicators visible
✓ Test at 200% zoom
```

### **Component Checklist**

When creating new components:

```tsx
// ✅ Good
<button aria-label="Delete item">
  <Trash aria-hidden="true" />
</button>

// ❌ Bad
<div onClick={handleClick}>
  <Trash />
</div>
```

**Always:**
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Add `aria-label` to icon-only buttons
- Set `aria-hidden="true"` on decorative icons
- Link labels to inputs with `htmlFor` + `id`
- Announce errors with `role="alert"`

### **Common ARIA Patterns**

```tsx
// Button with loading state
<Button aria-label={isLoading ? 'Processing...' : 'Submit'}>
  {isLoading ? <Loader aria-hidden="true" /> : 'Submit'}
</Button>

// Form input with error
<Input
  id="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && <p id="email-error" role="alert">{error}</p>}

// Toggle switch
<button
  role="switch"
  aria-checked={isEnabled}
  aria-label="Enable notifications"
>
  {/* Visual switch */}
</button>

// Modal dialog
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-modal="true"
>
  <h2 id="dialog-title">Settings</h2>
</div>
```

### **Screen Reader Announcements**

```tsx
// Use the hook
import { useAccessibilityAnnouncement } from './AccessibilityAnnouncement';

const announce = useAccessibilityAnnouncement();

// Later in code
announce('File uploaded successfully');
announce('Error occurred', { politeness: 'assertive' });

// Or use global
window.announceToScreenReader?.('Update complete');
```

### **Testing Commands**

```bash
# Automated tests
npm run build
lighthouse --only-categories=accessibility

# Manual tests
1. Unplug mouse, navigate with keyboard only
2. Turn on NVDA/VoiceOver
3. Zoom to 200% (Ctrl/Cmd + +)
4. Enable color blind filter in accessibility menu
5. Enable high contrast mode
6. Enable reduce motion
```

---

## 📊 Compliance Checklist

### **WCAG 2.1 Level AA Quick Check**

**Perceivable:**
- [ ] Alt text on images
- [ ] Text resizable to 200%
- [ ] Color contrast 4.5:1 minimum
- [ ] No color-only information

**Operable:**
- [ ] Keyboard accessible
- [ ] Skip to content link
- [ ] Focus visible
- [ ] No keyboard traps

**Understandable:**
- [ ] Error identification
- [ ] Labels on inputs
- [ ] Consistent navigation

**Robust:**
- [ ] Valid HTML
- [ ] ARIA labels present
- [ ] Name, role, value available

---

## 🔧 Common Fixes

### **"Button not keyboard accessible"**
```tsx
// ❌ Wrong
<div onClick={handleClick}>Click me</div>

// ✅ Correct
<button onClick={handleClick}>Click me</button>
```

### **"Image missing alt text"**
```tsx
// ❌ Wrong
<img src={photo} />

// ✅ Correct - Functional
<img src={photo} alt="User profile photo" />

// ✅ Correct - Decorative
<img src={pattern} alt="" aria-hidden="true" />
```

### **"Form input not labeled"**
```tsx
// ❌ Wrong
<input type="email" placeholder="Email" />

// ✅ Correct
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### **"Low contrast text"**
```css
/* ❌ Wrong - 2.5:1 contrast */
color: #999999;
background: #ffffff;

/* ✅ Correct - 4.5:1+ contrast */
color: #666666;
background: #ffffff;
```

### **"Icon-only button"**
```tsx
// ❌ Wrong
<button onClick={handleClose}>
  <X />
</button>

// ✅ Correct
<button onClick={handleClose} aria-label="Close dialog">
  <X aria-hidden="true" />
</button>
```

---

## 📱 Mobile Specific

### **Touch Targets**
```tsx
// Ensure 44x44px minimum
<button className="min-w-[44px] min-h-[44px]">
  <Icon />
</button>
```

### **Screen Reader Testing**
```
iOS VoiceOver:
- Enable: Settings > Accessibility > VoiceOver
- Swipe right/left to navigate
- Double-tap to activate

Android TalkBack:
- Enable: Settings > Accessibility > TalkBack
- Swipe right/left to navigate
- Double-tap to activate
```

---

## 🎨 Design Guidelines

### **Color Contrast Requirements**

| Text Size | Weight | Minimum Ratio |
|-----------|--------|---------------|
| < 18px | Normal | 4.5:1 |
| < 14px | Bold | 4.5:1 |
| ≥ 18px | Normal | 3:1 |
| ≥ 14px | Bold | 3:1 |

### **Focus Indicators**
- Minimum 2px outline
- High contrast with background
- Never remove with `outline: none`
- Use `:focus-visible` for better UX

### **Motion**
- Respect `prefers-reduced-motion`
- Provide pause/stop for auto-play
- No animations faster than 3 flashes/second

---

## 📚 Resources

### **Tools**
- **NVDA** - https://www.nvaccess.org/ (Free screen reader)
- **axe DevTools** - Browser extension for testing
- **WAVE** - https://wave.webaim.org/
- **Contrast Checker** - https://webaim.org/resources/contrastchecker/

### **Documentation**
- `/ACCESSIBILITY_FEATURES.md` - Full feature list
- `/SCREEN_READER_ALT_TEXT_GUIDE.md` - Screen reader guide
- `/ACCESSIBILITY_TESTING_CHECKLIST.md` - Complete testing guide
- `/ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md` - What's implemented

### **External**
- **WCAG 2.1** - https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices** - https://www.w3.org/WAI/ARIA/apg/
- **WebAIM** - https://webaim.org/

---

## 🆘 Quick Help

### **Users Having Trouble?**

1. **Can't see text clearly?**
   - Increase font size in accessibility menu
   - Enable high contrast mode
   - Try dyslexia-friendly font

2. **Colors hard to distinguish?**
   - Try color blind filters in menu
   - Enable high contrast mode

3. **Animations causing issues?**
   - Enable "Reduce Motion" in menu

4. **Using keyboard only?**
   - Press Tab to navigate
   - Use Alt+A to open accessibility menu
   - All features keyboard accessible

5. **Using screen reader?**
   - Alt+A opens accessibility menu
   - All content has proper labels
   - Dynamic changes announced

### **Developers Need Help?**

1. **Component not accessible?**
   - Check `/SCREEN_READER_ALT_TEXT_GUIDE.md`
   - Use semantic HTML first
   - Add ARIA labels second

2. **Testing failing?**
   - Run axe DevTools for specific issues
   - Check `/ACCESSIBILITY_TESTING_CHECKLIST.md`
   - Test with keyboard navigation

3. **Need to announce something?**
   ```tsx
   const announce = useAccessibilityAnnouncement();
   announce('Action completed');
   ```

---

## ✅ Daily Checklist

**Before Every Commit:**
- [ ] Tab through new/changed pages
- [ ] Run axe DevTools
- [ ] Check focus indicators visible
- [ ] Verify button labels make sense

**Before Every Deploy:**
- [ ] Run full Lighthouse audit
- [ ] Test with NVDA or VoiceOver
- [ ] Test at 200% zoom
- [ ] Test all keyboard shortcuts

**Monthly:**
- [ ] Full WCAG compliance check
- [ ] User testing with actual users
- [ ] Review and update documentation
- [ ] Check for new accessibility tools/best practices

---

## 🎯 Support Contacts

**For Users:**
- Accessibility Issues: accessibility@metarconverter.app
- General Support: support@metarconverter.app

**For Developers:**
- Technical Questions: See documentation files
- Code Reviews: Include accessibility checks
- Feature Requests: Consider accessibility from start

---

**Last Updated:** January 28, 2026  
**Version:** 1.0  
**Print this page for quick reference!**
