# Mess Management — Enterprise Design System

## Overview

A professional, consistent, enterprise-level design system for the dedicated mobile app. This system provides unified design tokens and reusable primitives so every screen feels like part of the same product.

## Design Tokens

All tokens are defined as CSS custom properties in `app/globals.css`.

### Brand Color Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-50` | `#edfafa` | Background tint, icon soft backgrounds |
| `--brand-100` | `#dff4f3` | Soft brand fills |
| `--brand-200` | `#bfe7e6` | Borders, secondary fills |
| `--brand-300` | `#9edddc` | Accent borders |
| `--brand-400` | `#4bbfc0` | Accent color |
| `--brand-500` | `#0aa0a0` | Hover / secondary primary |
| `--brand-600` | `#008d8c` | **Primary** |
| `--brand-700` | `#00777a` | Primary deep / pressed |
| `--brand-800` | `#065f66` | Dark surfaces |
| `--brand-900` | `#123748` | Ink / darkest |

### Neutral Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--neutral-50` | `#f9fbfb` | Page background |
| `--neutral-100` | `#f2f5f6` | Flat card backgrounds |
| `--neutral-200` | `#e4eaec` | Borders |
| `--neutral-300` | `#cfd8dc` | Divider lines |
| `--neutral-400` | `#a6b6bc` | Placeholder text |
| `--neutral-500` | `#7d8a9d` | Subtle text |
| `--neutral-600` | `#65838b` | **Muted text** |
| `--neutral-700` | `#52727b` | Secondary text |
| `--neutral-800` | `#3d5a63` | Strong secondary text |
| `--neutral-900` | `#245d66` | Dark text |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--semantic-ink` | `#123748` | Primary text |
| `--semantic-ink-secondary` | `#245d66` | Secondary headings |
| `--semantic-muted` | `#65838b` | Muted labels |
| `--semantic-success` | `#15953a` | Success states |
| `--semantic-warning` | `#e36c0a` | Warning states |
| `--semantic-danger` | `#e02d37` | Danger states |

### Typography

| Class | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-kpi` / `text-display` | 26px | 600–700 | 32px | KPIs, hero values |
| `text-title` / `text-headline` | 24px | 600 | 32px | Page headings |
| `text-section` / `text-title-sm` | 18px | 600 | 24px | Section headings |
| `text-body` | 16px | 400 | 24px | Body copy |
| `text-body-small` | 14px | 400 | 20px | Supporting copy |
| `text-label` | 14px | 500 | 20px | Form labels, rows |
| `text-caption` | 12px | 400–500 | 16px | Captions, badges |

All interface text uses the shared `--font-sans` token. It pairs locally
bundled **Roboto** for Latin glyphs with **Noto Sans Bengali** for Bengali
glyphs, including mixed-language strings. Do not set `font-family` inside
components; use the semantic size and weight tokens instead.

### Radii

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 8px | Small icon tiles |
| `--radius-md` | 12px | Nested list items |
| `--radius-lg` | 16px | Buttons, cards |
| `--radius-xl` | 20px | Main cards |
| `--radius-2xl` | 24px | Modals |
| `--radius-full` | 999px | Pills, avatars |

### Shadows

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-xs` | `0 2px 8px rgba(0,119,122,0.045)` | Metric tiles |
| `--shadow-sm` | `0 6px 18px rgba(0,119,122,0.07)` | Standard cards |
| `--shadow-md` | `0 10px 24px rgba(0,119,122,0.08)` | Raised cards |
| `--shadow-lg` | `0 14px 30px rgba(0,119,122,0.12)` | Prominent elements |
| `--shadow-modal` | `0 28px 70px rgba(18,55,72,0.24)` | Modals |

## Reusable Components

Import from `@/components/ui`:

```tsx
import { Card, CardGrid, ListItem } from '@/components/ui/card'
import { Text, SectionTitle, CardTitle, Subtitle, Label, Caption } from '@/components/ui/text'
import { Button, IconButton } from '@/components/ui/button'
import { Badge, StatusPill } from '@/components/ui/badge'
import { Notice, EmptyState } from '@/components/ui/notice'
```

### Card

```tsx
<Card title="Overview" subtitle="This month" action={<Badge tone="success">Active</Badge>}>
  <p>Content here</p>
</Card>

<Card variant="hero">
  <h2 className="text-white">Total Balance</h2>
</Card>

<CardGrid columns={2}>
  <Card variant="flat">Item 1</Card>
  <Card variant="flat">Item 2</Card>
</CardGrid>

<ListItem variant="card" active>
  <span>List item</span>
</ListItem>
```

### Typography

```tsx
<SectionTitle>Monthly Overview</SectionTitle>
<CardTitle>Total Expenses</CardTitle>
<Subtitle>Food, utility and rent</Subtitle>
<Label muted>Member count</Label>
<Caption>Updated just now</Caption>
```

### Buttons

```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">View All</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button busy>Processing...</Button>
```

### Badges

```tsx
<Badge tone="success">Approved</Badge>
<Badge tone="warning">Pending</Badge>
<Badge tone="danger">Rejected</Badge>
<Badge tone="neutral">Inactive</Badge>
```

### Notices & Empty States

```tsx
<Notice tone="success">Profile saved successfully</Notice>
<Notice tone="danger">Failed to save</Notice>
<EmptyState>No members found</EmptyState>
```

## CSS Class Primitives

Use these directly when composing custom layouts:

| Class | Purpose |
|-------|---------|
| `.ui-card` | Standard enterprise card |
| `.ui-section-title` | Uppercase, letterspaced section label |
| `.ui-body` | Body text |
| `.ui-label` / `.ui-label-muted` | Label text |
| `.ui-caption` / `.ui-caption-muted` | Caption text |
| `.ui-btn` + `.ui-btn--primary/secondary/ghost/danger` | Buttons |
| `.ui-field` | Form input |
| `.ui-field-label` / `.ui-field-hint` | Form label / hint |
| `.ui-badge` + tone classes | Status pills |
| `.ui-icon-tile` + `--sm/md/lg` | Icon containers |
| `.ui-empty` | Empty state |
| `.ui-notice` + tone classes | Alert boxes |
| `.ui-list-item` + `--card/--flush` | List rows |
| `.ui-stack` | Vertical stack with 16px gap |

## Rules

1. **Same header font** — `ui-header-title` on every screen header
2. **Same section labels** — `ui-section-title` for all card/panel headings
3. **Same card radius & shadow** — `ui-card` / `--radius-xl` + `--shadow-card`
4. **Same button style** — Use `ui-btn` variants, never create new button styles
5. **Same muted text** — Always `--neutral-600` (`#65838b`) for muted labels
6. **Same ink text** — Always `--semantic-ink` (`#123748`) for primary text
7. **No raw hex colors in components** — Use the design tokens
8. **Money values** — Always `font-variant-numeric: tabular-nums`
