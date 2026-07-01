---
name: Gauss
description: High-fidelity local-first offline document utilities platform
colors:
  primary: "#22d3ee"
  secondary: "#fbbf24"
  neutral-bg: "#050605"
  neutral-card: "#0d0e0d"
  neutral-border: "#202220"
typography:
  display:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "clamp(2rem, 5vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-geist-sans), sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-container:
    backgroundColor: "{colors.neutral-card}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Gauss

## 1. Overview

**Creative North Star: "The Secure Lab Chamber"**

Gauss is designed as a secure, local-first utility chamber. The design system rejects default cloud SaaS tropes, including neon gradients, excessive glowing particles, and cream backgrounds. It focuses instead on absolute data security, technical confidence, and crisp legibility. High-contrast indicators and responsive structures provide immediate usability feedback for professionals processing confidential documentation.

**Key Characteristics:**
- Absolute offline feedback: Indicators confirming zero-network activity.
- Deep solid dark theme: Minimal eye strain during lengthy review sessions.
- Structural layout density: Orderly groupings instead of generic repeating card walls.

## 2. Colors

A committed solid dark-neutral palette accented by cyan and amber feedback channels.

### Primary
- **Feedback Cyan** (#22d3ee): Used for active tool states, compile buttons, and key interactive highlights.

### Secondary
- **Alert Amber** (#fbbf24): Used for warnings, destructive actions (page deletion), and secondary alerts.

### Neutral
- **Chamber Black** (#050605): Root background.
- **Card Neutral** (#0d0e0d): Background surface for interactive toolbox panels and file listings.
- **Border Muted** (#202220): Divider lines and panel bounding borders.

**The Contrast Rule.** Body text must always maintain at least a 4.5:1 contrast ratio against the dark background. Using faint, low-contrast text for secondary metadata is strictly prohibited.

## 3. Typography

**Display Font:** Geist Sans (with fallback system sans-serif)
**Body Font:** Geist Sans
**Label/Mono Font:** Geist Mono

**Character:** Crisp, technical sans-serif typography combined with monospace metrics for file dimensions and counts.

### Hierarchy
- **Display** (900, clamp(2rem, 5vw, 4.5rem), 1.1): Used for main dashboard headings.
- **Headline** (700, 1.5rem, 1.3): Used for tool workspace titles.
- **Title** (600, 1.125rem, 1.4): Used for sidebar headings and panel sub-titles.
- **Body** (400, 0.875rem, 1.6): Used for descriptive parameters and instruction blocks. Max line length is restricted to 70ch.
- **Label** (500, 0.75rem, 1.2): Used for status tags and file dimensions.

## 4. Elevation

The system is flat by default to reflect utility constraints, utilizing clean border strokes and flat color backgrounds rather than heavy blurred drop shadows.

### Shadow Vocabulary
- **Interactive Focus** (none): Layout items rely on clean borders rather than structural shadows.

**The Surface Frame Rule.** Surfaces do not float via heavy blurs. Layout panels are delineated by flat border lines (`border-muted`) and background fills.

## 5. Components

### Buttons
- **Shape:** Rounded corners (10px radius).
- **Primary:** Solid Cyan background with Chamber Black text and semantic margins.
- **Hover / Focus:** Transitions smoothly to pure white on hover with zero translate shifts.

### Cards / Containers
- **Corner Style:** Large corners (16px radius).
- **Background:** Card Neutral.
- **Border:** Solid 1px Border Muted.
- **Internal Spacing:** Standard spacing (24px padding).

### Inputs / Fields
- **Style:** Chamber Black background with solid 1px Border Muted and rounded-md corners.
- **Focus:** Sharp Cyan border glow.

## 6. Do's and Don'ts

### Do:
- **Do** use full boxed borders instead of single-side color stripes for indicators.
- **Do** limit headings to a maximum height of 4.5rem to prevent visual crowding.
- **Do** test every text size on mobile viewports to prevent layout overflow.

### Don't:
- **Don't** use decorative side-stripe accent borders on navigation items or cards.
- **Don't** apply color gradient fills to typography.
- **Don't** animate image assets or thumbnails on hover.
- **Don't** use low-contrast text colors below the 4.5:1 ratio for secondary labels.
