# Automated Accessibility Audit Report

Generated automatically via the Claude Accessibility Checker test suite.

## File: `apps/web/src/app/page.tsx`

### Accessibility Audit Summary

The page component is minimal and delegates all functionality to the ClaudePlayground component. While no critical accessibility violations are present in this specific code, there are structural concerns:

- **Missing skip-to-content link**: Important for keyboard navigation
- **Lack of semantic structure**: No main landmark or other semantic HTML elements
- **Title verification needed**: Cannot confirm proper page titling from this component alone

The actual accessibility compliance will largely depend on the implementation within the ClaudePlayground component. This audit identifies foundational structural improvements that should be implemented at the page level.

### Detected Violations (3)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 4 | `<ClaudePlayground />` | **semantic** | moderate | 2.4.1 Bypass Blocks (AA) | Add a skip-to-content link at the beginning of the page that allows users to jump directly to the main content. (The page lacks a skip-to-content link, which is important for keyboard users to bypass repetitive navigation elements.) |
| 4 | `return <ClaudePlayground />` | **semantic** | moderate | 1.3.1 Info and Relationships (AA) | Wrap the ClaudePlayground component in a <main> element and consider adding other semantic landmarks like <header>, <nav>, or <aside> as appropriate. (The page structure lacks proper semantic landmarks. There's no main element or other semantic HTML structure to define page regions.) |
| 1 | `Page component` | **semantic** | moderate | 2.4.2 Page Titled (AA) | Ensure the page has a descriptive title either through Next.js metadata API or by including a proper <title> element that describes the page content. (Cannot verify if the page has a proper title since this is a Next.js page component without explicit metadata or title configuration.) |


## File: `apps/web/src/app/globals.css`

### Accessibility Audit Summary

**Critical Issues (1):**
- Muted foreground color fails contrast requirements against dark backgrounds

**Moderate Issues (2):**
- Secondary foreground may have borderline contrast ratios
- Focus ring opacity too low for clear visibility

**Positive Aspects:**
- Uses CSS custom properties for consistent theming
- Includes focus styles for interactive elements
- Primary colors appear to have adequate contrast

**Recommendations:**
1. Increase lightness values for muted text colors
2. Verify all color combinations meet WCAG AA 4.5:1 ratio
3. Enhance focus ring visibility with higher opacity or additional styling
4. Test color combinations with actual contrast checking tools

### Detected Violations (3)

| Line | Element / Code | Type | Severity | WCAG Guideline | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 13 | `--muted-foreground: 32 14% 58%;` | **contrast** | critical | 1.4.3 Contrast (Minimum) (AA) | Increase the lightness value to at least 70% or higher to ensure sufficient contrast against dark backgrounds. Consider using a value like '32 14% 70%' or higher. (The muted-foreground color (HSL 32 14% 58%) appears to be a mid-tone gray that likely fails WCAG AA contrast requirements when used against dark backgrounds like --background (30 18% 8%) or --card (28 18% 10%).) |
| 11 | `--secondary-foreground: 35 28% 82%;` | **contrast** | moderate | 1.4.3 Contrast (Minimum) (AA) | Test the actual contrast ratio and consider increasing lightness to 85% or higher if needed to ensure WCAG AA compliance. (The secondary-foreground color may have borderline contrast when used with secondary background (28 18% 15%). The contrast ratio should be verified to ensure it meets the 4.5:1 minimum.) |
| 125 | `.input-focus:focus-within` | **keyboard** | moderate | 2.4.7 Focus Visible (AA) | Increase the opacity to at least 0.3 or 0.4 to ensure the focus indicator is clearly visible. Consider using a higher contrast color or adding a solid border component. (The focus ring uses a low opacity (0.18) which may not provide sufficient visual indication of focus state, especially for users with visual impairments.) |


