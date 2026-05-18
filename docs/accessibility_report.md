# Automated Accessibility Audit Report

Generated automatically via the Claude Accessibility Checker test suite.

## File: `apps/web/src/components/claude-playground.tsx`

### Accessibility Audit Summary

**Critical Issues Found: 12 contrast violations**

The component has multiple severe contrast violations with text using very low opacity values (10-20%) on dark backgrounds. These fail WCAG AA 4.5:1 contrast requirements by a wide margin:

- Multiple instances of `text-white/15`, `text-white/10`, and `text-white/20` classes
- Placeholder text with insufficient contrast
- Decorative separator dots that are barely visible
- Status and helper text with poor readability

**Minor Issue: 1 semantic violation**
- Bare `aria-hidden` attribute should be `aria-hidden="true"`

**Positive Accessibility Features:**
- Proper semantic HTML structure with headings, form labels, and button elements
- Form labels correctly associated with inputs
- Keyboard shortcuts implemented (⌘+Enter)
- Focus management with textarea ref
- Appropriate ARIA attributes in most cases
- Skip-to-content isn't needed for this single-page component

**Recommendations:**
1. **Priority 1:** Replace all low-opacity text classes with at least 50% opacity or higher
2. Fix the bare `aria-hidden` attribute
3. Test final contrast ratios to ensure 4.5:1 minimum is met

### Detected Violations (13)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 459 | `<span className="text-white/15">·</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/15 (15% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 471 | `<p className="max-w-[180px] text-xs break-all text-white/15">{apiBaseUrl}</p>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/15 (15% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 570 | `placeholder="Ask Claude something useful…" className="min-h-48 resize-y border-0 bg-transparent p-4 text-sm/7 placeholder:text-white/15"` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use placeholder:text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Placeholder text with white/15 (15% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 787 | `<span className="text-white/15">·</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/15 (15% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 595 | `<span className="text-[10px] text-white/20 uppercase">Try an example</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/20 (20% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 599 | `<span className="text-[10px] text-white/15">{EXAMPLE_PROMPTS.length} presets</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/15 (15% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 659 | `<span className="text-[10px] text-white/20">Claude output</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/20 (20% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 738 | `<div className="flex items-center justify-between gap-3 text-xs text-white/18">` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/18 (18% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 800 | `<span className="text-white/20">req/min remaining</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/20 (20% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 1005 | `<p className="text-[10px] tracking-widest text-white/20 uppercase">Token usage</p>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/20 (20% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 1156 | `<span className="text-white/10">·</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/10 (10% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 1206 | `<span className="text-white/10">·</span>` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Use text-white/50 or higher opacity to meet WCAG AA contrast requirements. (Text with white/10 (10% opacity) on a dark background yields a contrast ratio far below 4.5:1.) |
| 358 | `<div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">` | **semantic** | minor | 4.1.1 Parsing (A) | Change aria-hidden to aria-hidden="true" for proper HTML validation. (The aria-hidden attribute should have a boolean value (true or false), not be used as a bare attribute.) |


## File: `apps/web/src/app/globals.css`

### Accessibility Audit Summary

This CSS file defines a dark theme color system with several potential contrast issues. The main concern is the `--muted-foreground` color which uses 58% lightness and may not provide sufficient contrast against dark backgrounds when used for text. Two other foreground colors (`--secondary-foreground` and `--accent-foreground`) at 82% lightness should be tested to ensure they meet contrast requirements when paired with their respective 15% lightness backgrounds.

The file includes good animation utilities and focus states (like `.input-focus`), but the color definitions need verification against WCAG AA contrast requirements. Consider using contrast checking tools to validate all color combinations used in the actual UI components.

**Recommendations:**
- Increase `--muted-foreground` lightness to at least 70%
- Test and potentially adjust secondary and accent foreground colors
- Use contrast checking tools to validate all text/background combinations

### Detected Violations (3)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 15 | `--muted-foreground: 32 14% 58%;` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Increase the lightness value to at least 70% (--muted-foreground: 32 14% 70%) to ensure sufficient contrast against dark backgrounds. (The muted-foreground color (hsl(32 14% 58%)) appears to have low contrast when used on dark backgrounds. This HSL value represents a mid-tone gray that may not meet the 4.5:1 contrast ratio requirement.) |
| 17 | `--secondary-foreground: 35 28% 82%;` | **contrast** | moderate | 1.4.3 Contrast (Minimum) (AA) | Test contrast ratios in actual usage and consider increasing lightness to 85-90% if needed to ensure WCAG AA compliance. (The secondary-foreground color may have borderline contrast when used on certain background combinations. With secondary background at 15% lightness, this should be verified.) |
| 19 | `--accent-foreground: 35 28% 82%;` | **contrast** | moderate | 1.4.3 Contrast (Minimum) (AA) | Test contrast ratios in actual usage and consider increasing lightness to 85-90% if needed to ensure WCAG AA compliance. (Similar to secondary-foreground, the accent-foreground color may have borderline contrast when used on the accent background (15% lightness).) |


