# Claude Certification Brand Guide

## Brand Idea

Claude Certification is a practical learning project for building with Claude in
a production-shaped stack. The brand should feel clear, technical, trustworthy,
and a little celebratory: a lab bench with a completion badge.

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
- Use the logo on dark, near-black, or quiet neutral backgrounds.
- Use the standalone icon when the full wordmark would be too small.

Avoid:

- Stretching, rotating, or recoloring the mark.
- Placing the logo on busy imagery.
- Adding shadows, glows, or outlines beyond the existing artwork.
- Rebuilding the check/star shape by hand in UI code.

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| Ink | `#0D1117` | Main background, logo base |
| Panel | `#111827` | Cards, elevated dark surfaces |
| Teal | `#14B8A6` | Certification mark, success, primary accent |
| Mist | `#ECFEFF` | High-contrast marks on dark backgrounds |
| Amber | `#FCD34D` | Warm highlight, hero gradient accent |
| Orange | `#FB923C` | Secondary accent, badges, attention |
| Zinc | `#A1A1AA` | Muted body text |
| White | `#F9FAFB` | Headings and high-emphasis text |

Recommended gradients:

```css
linear-gradient(135deg, #14B8A6 0%, #FCD34D 100%)
linear-gradient(90deg, #FB923C 0%, #FCD34D 55%, #ECFEFF 100%)
```

Use gradients sparingly: hero emphasis, icon details, or active states. The UI
should remain mostly neutral and readable.

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
