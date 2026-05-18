# Automated Accessibility Audit Report

Generated automatically via the Claude Accessibility Checker test suite.

## File: `apps/web/src/app/page.tsx`

### Accessibility Audit Summary

**Issues Found:** 2 moderate violations

The main page structure is minimal but lacks essential accessibility features. The primary concerns are:

1. **Missing Skip Navigation:** No skip-to-content link for keyboard users
2. **Unknown Component Structure:** The ClaudePlayground component's accessibility cannot be assessed without its implementation

While the basic semantic structure using `<main>` is correct, the page would benefit from a skip navigation link and verification that the child component follows proper accessibility practices including heading hierarchy and semantic markup.

### Detected Violations (2)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 5 | `<main className="flex flex-1 flex-col">` | **semantic** | moderate | 2.4.1 Bypass Blocks (AA) | Add a skip-to-content link at the beginning of the page that allows keyboard users to jump to the main content area. (The page lacks a skip-to-content link, which is essential for keyboard users to bypass navigation and jump directly to the main content.) |
| 6 | `<ClaudePlayground />` | **semantic** | moderate | 1.3.1 Info and Relationships (AA) | Ensure the ClaudePlayground component includes proper heading hierarchy (h1, h2, etc.) and semantic HTML structure for screen readers. (Cannot determine if the ClaudePlayground component has proper heading hierarchy and semantic structure without inspecting its implementation.) |


## File: `apps/web/src/components/claude-playground.tsx`

### Accessibility Audit Summary

**Overall Assessment:** The code demonstrates good accessibility practices with proper semantic HTML structure and ARIA attributes, but has a few areas for improvement.

**Key Findings:**
- **Missing skip-to-content link** - Users relying on keyboard navigation would benefit from a way to bypass any header content
- **Potential contrast issue** - The error alert uses low opacity colors that may not meet WCAG AA contrast requirements
- **Error announcement** - While the alert has proper role attributes, dynamic error messages could benefit from more explicit live region announcements
- **Global keyboard handler** - The Ctrl/Cmd+Enter shortcut is implemented globally which could potentially interfere with other page functionality

**Positive Aspects:**
- Proper use of semantic HTML elements (main, section)
- Correct ARIA roles on alert components
- Good component structure with separation of concerns
- Proper form handling patterns

**Priority:** The contrast issue should be addressed first, followed by adding a skip-to-content link for better keyboard navigation.

### Detected Violations (4)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 164 | `<main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">` | **semantic** | moderate | 2.4.1 Bypass Blocks (AA) | Add a skip-to-content link at the beginning of the page that allows keyboard users to jump directly to the main content. (The main content area lacks a skip-to-content link, making it difficult for keyboard users to bypass navigation.) |
| 175 | `<Alert variant="destructive" role="alert" className="animate-slide-up-fade border-rose-500/25 bg-rose-500/8">` | **contrast** | moderate | 1.4.3 Contrast (Minimum) (AA) | Increase the background opacity or use a more opaque color class to ensure the error alert meets WCAG AA contrast requirements. (The error alert uses rose-500/8 background (8% opacity) which may not provide sufficient contrast against the background color.) |
| 175 | `<Alert variant="destructive" role="alert">` | **accessibility** | low | 4.1.3 Status Messages (AA) | Consider adding aria-live="assertive" or using a live region to ensure error messages are announced immediately to assistive technologies. (The error alert appears dynamically but may not be announced properly to screen readers when it appears.) |
| 85 | `window.addEventListener('keydown', onKey)` | **keyboard** | low | 2.1.1 Keyboard (AA) | Consider limiting the keyboard shortcut scope to specific form elements or add proper event delegation to avoid conflicts. (Global keyboard event listener for Ctrl/Cmd+Enter may interfere with other keyboard functionality on the page.) |


## File: `apps/web/src/app/globals.css`

### Accessibility Audit Summary

This CSS file demonstrates several **positive accessibility practices**:

✅ **Excellent focus management** with `:focus-visible` styles that provide clear 2px solid outlines
✅ **Motion sensitivity** with proper `prefers-reduced-motion` media query handling
✅ **Semantic color system** using CSS custom properties for consistent theming

**Areas of concern** involve potential contrast ratio issues:

⚠️ **Contrast warnings** for `muted-foreground`, `secondary-foreground`, and `accent-foreground` colors that may fall below WCAG AA requirements when paired with their respective dark backgrounds

The color values should be tested with actual contrast ratio calculators to ensure compliance. The current HSL values suggest some combinations may be borderline for meeting the 4.5:1 minimum ratio required for AA compliance.

### Detected Violations (3)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 14 | `--muted-foreground: 32 14% 77%;` | **contrast** | warning | 1.4.3 Contrast (Minimum) (AA) | Test the actual contrast ratio of muted-foreground against its intended backgrounds and increase lightness to at least 85% if needed to ensure WCAG AA compliance. (The muted-foreground color (HSL 32 14% 77%) may provide insufficient contrast when used on dark backgrounds. This equates to approximately #c4beb8 on #1a1511 background, which could fall below the 4.5:1 ratio required for AA compliance.) |
| 16 | `--secondary-foreground: 35 28% 88%;` | **contrast** | warning | 1.4.3 Contrast (Minimum) (AA) | Verify the contrast ratio between secondary-foreground and secondary background colors. Consider increasing the lightness of secondary-foreground to 90% or higher if the ratio falls below 4.5:1. (The secondary-foreground color (HSL 35 28% 88%) against the secondary background (HSL 28 18% 15%) may not provide sufficient contrast. This combination needs verification to ensure it meets the 4.5:1 ratio.) |
| 18 | `--accent-foreground: 35 28% 88%;` | **contrast** | warning | 1.4.3 Contrast (Minimum) (AA) | Verify the contrast ratio between accent-foreground and accent background colors. Consider increasing the lightness of accent-foreground to 90% or higher if the ratio falls below 4.5:1. (The accent-foreground color (HSL 35 28% 88%) against the accent background (HSL 28 18% 15%) may not provide sufficient contrast. This combination needs verification to ensure it meets the 4.5:1 ratio.) |


