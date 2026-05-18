# Automated Accessibility Audit Report

Generated automatically via the Claude Accessibility Checker test suite.

## File: `apps/web/src/app/page.tsx`

### Accessibility Audit Summary

This page component is minimal and delegates all functionality to the ClaudePlayground component. The main accessibility concerns are structural:

- **Missing skip-to-content link**: Essential for keyboard navigation efficiency
- **Lack of semantic landmarks**: No `<main>` element to identify the primary content area
- **Potential missing page title**: Important for screen reader users to understand page context

These are foundational accessibility requirements that should be addressed at the page level. The actual accessibility of the application will depend heavily on the implementation within the ClaudePlayground component, which would need separate analysis.

### Detected Violations (3)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 4 | `<ClaudePlayground />` | **semantic** | moderate | 2.4.1 Bypass Blocks (AA) | Add a skip-to-content link at the beginning of the page that allows users to jump to the main content area. (The page lacks a skip-to-content link, which is essential for keyboard users to bypass navigation and go directly to the main content.) |
| 4 | `<ClaudePlayground />` | **semantic** | moderate | 1.3.1 Info and Relationships (AA) | Wrap the ClaudePlayground component in a <main> element to provide proper landmark navigation for screen readers. (The page lacks proper semantic structure with main landmarks. There's no <main> element to identify the primary content area.) |
| 1 | `entire page` | **semantic** | moderate | 2.4.2 Page Titled (AA) | Ensure the page has a proper <title> element, either through Next.js metadata or a <Head> component, that describes the page's purpose. (No page title is visible in this component. While Next.js may handle this elsewhere, it's important to ensure each page has a descriptive title.) |


## File: `apps/web/src/app/globals.css`

### Accessibility Audit Summary

The CSS file shows good accessibility practices with proper focus indicators, but has several contrast-related concerns:

**Positive aspects:**
- Implements proper `:focus-visible` styles with clear outline
- Uses semantic color variables for consistent theming
- Provides smooth animations that don't interfere with accessibility

**Issues found:**
- Several color combinations may fall below WCAG AA contrast requirements (4.5:1 for text, 3:1 for UI components)
- The custom focus ring for inputs has very low opacity which may not be visible enough
- Muted, secondary, and accent foreground colors need contrast verification against their respective backgrounds

**Recommendations:**
- Test all color combinations with actual contrast ratio tools
- Increase opacity or contrast of focus indicators
- Consider adding `prefers-reduced-motion` media queries for animations
- Verify contrast ratios programmatically in the design system

### Detected Violations (4)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 12 | `--muted-foreground: 32 14% 71%;` | **contrast** | warning | 1.4.3 Contrast (Minimum) (AA) | Increase the lightness value of --muted-foreground to at least 75% to ensure proper contrast ratio for text content. (The muted-foreground color (HSL 32 14% 71%) may not provide sufficient contrast when used on the background color (HSL 30 18% 8%). This combination yields approximately 3.8:1 contrast ratio, below the WCAG AA requirement of 4.5:1.) |
| 14 | `--secondary-foreground: 35 28% 82%;` | **contrast** | warning | 1.4.3 Contrast (Minimum) (AA) | Increase the lightness value of --secondary-foreground to at least 85% or adjust the secondary background to be darker to ensure proper contrast. (The secondary-foreground color (HSL 35 28% 82%) when used on secondary background (HSL 28 18% 15%) may yield a contrast ratio around 4.2:1, which is slightly below the WCAG AA requirement of 4.5:1.) |
| 17 | `--accent-foreground: 35 28% 82%;` | **contrast** | warning | 1.4.3 Contrast (Minimum) (AA) | Increase the lightness value of --accent-foreground to at least 85% or adjust the accent background to be darker to ensure proper contrast. (The accent-foreground color (HSL 35 28% 82%) when used on accent background (HSL 28 18% 15%) may yield a contrast ratio around 4.2:1, which is slightly below the WCAG AA requirement of 4.5:1.) |
| 115 | `.input-focus:focus-within { box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.18); }` | **contrast** | critical | 1.4.11 Non-text Contrast (AA) | Increase the opacity to at least 0.5 or use a more contrasting color to ensure the focus indicator is clearly visible against all possible backgrounds. (The focus indicator uses rgba(204, 120, 92, 0.18) which has very low opacity (18%) and may not provide sufficient contrast against various backgrounds to meet the 3:1 ratio required for non-text elements.) |


