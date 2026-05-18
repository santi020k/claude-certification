# Claude Certification Brand Guide

## Brand Idea

Claude Certification is a practical learning project for building with Claude in
a production-shaped stack. The brand should feel warm, clear, technical, and
trustworthy: closer to Claude's calm cream-and-clay product feel than a generic
neon AI dashboard.

## Name

Primary name:

```text
Claude Certification
```

Extended product name:

```text
Claude Certification Playground
```

Use the extended name when referring to the web app experience. Use the primary
name for the repository, logo lockup, and compact UI labels.

## Logo System

Assets live in:

```text
apps/web/public/brand/logo.svg
apps/web/public/brand/icon.svg
apps/web/public/favicon.svg
```

### Logo

Use `logo.svg` for README previews, social banners, presentation slides, and
wide surfaces where the full name can breathe.

Minimum display width: `240px`

### Icon

Use `icon.svg` for app headers, square previews, launcher tiles, and profile
images.

Minimum display size: `32px`

### Favicon

Use `favicon.svg` for browser tabs and metadata. Keep the legacy `.ico` fallback
for older clients.

## Logo Usage

Do:

- Keep clear space around the mark equal to at least one quarter of the icon
  width.
- Use the logo on warm charcoal, cream, or quiet neutral backgrounds.
- Use the standalone icon when the full wordmark would be too small.

Avoid:

- Stretching, rotating, or recoloring the mark.
- Placing the logo on busy imagery.
- Adding shadows, glows, or outlines beyond the existing artwork.
- Rebuilding the check/star shape by hand in UI code.

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| Ink | `#191714` | Main dark background, logo base |
| Cocoa | `#2B241F` | Dark cards, icon fields |
| Umber | `#3D332A` | Borders, subtle raised surfaces |
| Clay | `#CC785C` | Primary action, certification mark, active states |
| Soft Clay | `#D98B70` | Hover states and warm highlights |
| Bone | `#F7F3EA` | High-contrast text and light surfaces |
| Sand | `#D8CBB8` | Muted text on dark backgrounds |
| Taupe | `#8C7B6B` | Low-emphasis labels and dividers |

Recommended gradients:

```css
linear-gradient(135deg, #CC785C 0%, #D8CBB8 100%)
linear-gradient(90deg, #CC785C 0%, #D98B70 48%, #F7F3EA 100%)
```

Use gradients sparingly: hero emphasis, icon details, or active states. The UI
should remain mostly warm, neutral, and readable. Avoid cyan, blue, purple, and
neon gradients unless the surface is explicitly experimental.

## Typography

Primary UI font:

```text
Geist Sans
```

Code and token font:

```text
Geist Mono
```

Type direction:

- Headings should be confident and compact.
- Body text should explain the workflow plainly.
- Labels and metadata can use smaller, tighter text, especially around token
  counts and API status.

## Voice And Tone

The product voice is:

- Practical
- Precise
- Encouraging
- Engineering-friendly

Write like a senior teammate explaining a useful tool. Prefer direct verbs:

- "Ask Claude"
- "Check API"
- "Copy answer"
- "Run demo"

Avoid:

- Marketing hype
- Vague AI buzzwords
- Overexplaining obvious UI controls
- Copy that sounds like a generic starter template

## UI Direction

Use shadcn-style components for controls and layout:

- `Button` for actions
- `Card` for prompt, response, and status panels
- `Textarea` for prompts
- `Input` for numeric settings
- `Switch` for boolean settings
- `Badge` for model, stack, and token metadata
- `Alert` for request failures

Interaction states should be explicit:

- Loading state with spinner and disabled action
- Clear validation for short prompts
- Error message when the API fails
- Empty response state before the first request

## Iconography

Use `lucide-react` icons. Preferred icon meanings:

| Icon | Use |
|------|-----|
| `Sparkles` | Claude, generated answer, demo |
| `Send` | Submit prompt |
| `Activity` | API health |
| `Copy` | Copy answer |
| `Check` | Success or copied state |
| `AlertCircle` | Error |
| `LoaderCircle` | Loading |

## Accessibility

- Maintain strong contrast on dark backgrounds.
- Do not rely on color alone for status.
- Keep all buttons keyboard-focusable.
- Give logo images meaningful alt text when they communicate brand identity.
- Use empty alt text only when the logo is purely decorative.

## Asset Checklist

Before shipping a new branded surface, confirm:

- The correct asset is used for the available space.
- The logo is not distorted.
- Text remains readable on mobile.
- Favicon metadata still points to `/favicon.svg`.
- The page title uses "Claude Certification" or "Claude Certification
  Playground".
