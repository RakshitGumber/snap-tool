---
name: Single Filter
description: A focused creator workbench for turning links into exportable social post graphics.
colors:
  app-bg: "#f4f5f6"
  panel-bg: "#ffffff"
  card-bg: "#ffffff"
  heading: "#25252a"
  body: "#4B4D63"
  muted: "#61637a"
  border: "#dfe0e6"
  accent: "#37af87"
  accent-soft: "#37af878f"
  dark-bg: "#111115"
  dark-panel: "#17171d"
  dark-top-panel: "#0e0e11"
  dark-heading: "#FFFFFF"
  dark-body: "#9A9BAB"
  dark-muted: "#585C6C"
  dark-border: "#22202B"
  dark-accent: "#63E0A0"
typography:
  display:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "0.05em"
  title:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.025em"
  body:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "16px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  panel: "20px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.app-bg}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.heading}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input-default:
    backgroundColor: "{colors.app-bg}"
    textColor: "{colors.heading}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---

# Design System: Single Filter

## 1. Overview

**Creative North Star: "Creator Workbench"**

Single Filter is a quiet editor for fast creator output. The interface should feel like a practical workbench: panels stay predictable, controls stay close to the task, and the canvas remains the most expressive object on screen.

The system is product-register by default. It values strong defaults, familiar controls, and fast export over decorative storytelling. Marketing pages may be more open, but the editor sets the visual standard: neutral surfaces, restrained hierarchy, and one confident accent.

It explicitly rejects generic SaaS gloss: vague productivity copy, oversized marketing sections, glassy decoration, gradient-heavy polish, and template-like AI aesthetics.

**Key Characteristics:**
- Focused editor shell with dense but legible controls.
- Neutral surfaces around a visually expressive canvas.
- Single green accent for action, focus, and selection.
- Familiar product affordances for inputs, panels, undo, redo, delete, resize, and export.
- Light by default, with a dark token set available for focused work sessions.

## 2. Colors

The palette is restrained: cool-tinted neutrals, a mint-green action color, and platform/template color left to the exported artwork.

### Primary
- **Workbench Green**: the primary action and focus color. It appears on create, fetch, export, hover affordances, resize handles, and selected states.
- **Workbench Green Soft**: translucent accent support for small badges and low-emphasis highlights.

### Neutral
- **Canvas Mist**: the app background, used behind editor surfaces and empty zones.
- **Panel White**: panel and card background for the current light interface.
- **Ink Heading**: main text and important labels.
- **Slate Body**: body copy and secondary descriptions.
- **Muted Slate**: lower-emphasis labels, inactive icons, and helper text.
- **Soft Divider**: panel borders, input strokes, and editor separation lines.
- **Night Shell**: dark-mode page background.
- **Night Panel**: dark-mode side panels and editor surfaces.
- **Night Divider**: dark-mode separators.

### Named Rules

**The Canvas Carries Color Rule.** The editor shell stays restrained so templates, backgrounds, and exported graphics can be expressive.

**The One Accent Rule.** Green is for action, focus, selection, and confirmation. Do not introduce decorative accent colors in the editor chrome.

## 3. Typography

**Display Font:** Inter Variable, sans-serif  
**Body Font:** Inter Variable, sans-serif  
**Label/Mono Font:** Inter Variable, sans-serif

**Character:** The type system is plain, fast, and product-native. It should feel closer to a focused editor than a campaign landing page.

### Hierarchy
- **Display** (700, 3.75rem, 1.375): landing-page headline scale only. Do not use this inside editor panels.
- **Title** (500 to 600, 1.125rem to 1.25rem, 1.35): panel headings, section titles, and active control labels.
- **Body** (400, 1rem, 1.5): descriptive copy, landing support text, and longer explanations. Keep prose to 65-75ch.
- **Label** (600, 0.875rem, 1.25): buttons, inputs, compact panel controls, and status text.
- **Icon Labels** (600, 0.75rem to 0.875rem): only where text helps a tool control; otherwise use accessible icon buttons.

### Named Rules

**The Panel Scale Rule.** Editor panels never use hero-sized type. Compact controls need compact hierarchy.

**The One Family Rule.** Inter carries the product UI. Do not add display fonts to labels, buttons, toolbars, or canvas controls.

## 4. Elevation

Single Filter uses tonal layering and thin borders more than heavy shadows. The editor shell relies on background contrast and border lines to separate panels. Shadows are reserved for transient overlays, the fixed navigation, and the live canvas preview.

### Shadow Vocabulary
- **Navigation Lift** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`): subtle fixed-header separation.
- **Canvas Lift** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`): used on the generated output preview so it reads as an exportable object.

### Named Rules

**The Flat Chrome Rule.** Panels, controls, and toolbars are flat at rest. Elevation belongs to overlays and the canvas object, not every container.

## 5. Components

### Buttons

- **Shape:** gently curved rectangles (8px radius), with circular controls only for icon-only handles or swatches.
- **Primary:** Workbench Green background with Canvas Mist text, 40px height, 8px vertical padding, 16px horizontal padding, semibold label.
- **Hover / Focus:** hover uses opacity or a quiet tonal background. Focus must be visible with the accent color or a clear border shift.
- **Ghost:** transparent background with Ink Heading or Muted Slate text; hover uses a low-contrast neutral fill.
- **Disabled:** muted text, no hover lift, and cursor feedback that makes the disabled state obvious.

### Inputs / Fields

- **Style:** Canvas Mist fill, Soft Divider border, 8px radius, 40px height, compact label sizing.
- **Focus:** border shifts to Workbench Green. Add a focus ring when the surrounding background does not provide enough contrast.
- **Error / Disabled:** errors must use text and border treatment, not color alone. Disabled fields should visibly reduce contrast while preserving readable labels.

### Navigation

- **Landing nav:** fixed, lightly lifted, panel-colored, and compact. The brand name is text-first, not logo-dependent.
- **Editor top panel:** functional toolbar with file actions on the left and canvas/export actions on the right.
- **Mobile behavior:** collapse navigation into a simple menu. Avoid modal-first navigation.

### Panels

- **Left rail:** narrow icon rail for global editor actions such as undo, redo, and delete.
- **Right panel:** 384px control panel for link generation and background selection.
- **Panel borders:** one-pixel dividers only. Do not use colored side stripes.
- **Internal rhythm:** section spacing may vary, but control groups should remain scannable and predictable.

### Canvas Preview

- **Role:** the central object of attention and the only surface allowed to become visually expressive.
- **Sizing:** preserve platform aspect ratios and center the output inside the available editor space.
- **Empty state:** short, direct instruction such as "Add a link from Images." Do not add explanatory paragraphs.
- **Resize handle:** circular accent control with an accessible label and stable hit area.

### Card Templates

- **Role:** generated variants for YouTube, GitHub, and website metadata.
- **Character:** exportable and social-ready, not decorative samples.
- **Preview behavior:** cards should be easy to compare, select, and dismiss without blocking the editor.

## 6. Do's and Don'ts

### Do:

- **Do** keep the editor shell restrained so the exported graphic carries the visual punch.
- **Do** use Workbench Green for primary actions, focus, and selected state.
- **Do** keep controls familiar: buttons look like buttons, inputs look editable, icon buttons expose labels through `aria-label` and titles.
- **Do** preserve platform aspect ratios and stable canvas dimensions.
- **Do** provide visible focus, keyboard access, and reduced-motion respect for every interactive workflow.

### Don't:

- **Don't** use generic SaaS gloss: vague productivity copy, oversized marketing sections, glassy decoration, gradient-heavy polish, or template-like AI aesthetics.
- **Don't** turn the editor into a pro design suite with dense manual configuration, floating inspectors, or hidden expert-only controls.
- **Don't** make the product feel like a casual toy with gimmicky motion, novelty templates, or unserious export visuals.
- **Don't** use colored side-stripe borders, gradient text, decorative glassmorphism, or identical card grids as default patterns.
- **Don't** let inactive states carry full-saturation accent color.
