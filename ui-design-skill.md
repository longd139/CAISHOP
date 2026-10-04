# UI Design Skill — Intentional, Product-Specific Interfaces

> Read this file AND `DESIGN.md` (project design brief) before writing or changing any UI code.
> If `DESIGN.md` exists, its values override the defaults in this file.
> If it does not exist, STOP and fill in Section 1 first (or ask the user for the missing answers).

Stack assumed: React, TypeScript, Tailwind CSS, Vite. Adapt syntax if the project differs.

---

## 0. Golden Rule

**Do not make the interface look impressive. Make it look intentional.**

Every visual decision needs a reason tied to the product, the user, or the task.
When in doubt: remove decoration before adding more; use a concrete value from the tokens instead of inventing one.

Priority order (never reverse it):
1. Information hierarchy → 2. User workflow → 3. Content clarity → 4. Navigation → 5. Interaction → 6. Accessibility → 7. Responsive behavior → 8. Visual polish → 9. Decoration

---

## 1. Design Brief (fill in before coding)

Answer these. Put the answers in `DESIGN.md` so every future session reuses them.

```text
Product:            <what it is, one sentence>
Domain:             <admin dashboard | e-commerce | government/public service | education | content | SaaS | portfolio>
Target users:       <age range, tech familiarity, main device, how often they use it>
Main tasks:         <the 3 most frequent things users do>
Tone:               <e.g. trustworthy and calm | friendly and light | dense and efficient>
Reference UIs:      <2-3 real products with similar density/feel, e.g. Linear, GitHub, Stripe, gov.uk>
Language/locale:    <e.g. Vietnamese — check fonts support diacritics, long text, date format dd/MM/yyyy>
```

Rules:
- Do not design a government portal like a startup landing page.
- Do not design an admin tool like a marketing site.
- If a reference screenshot is provided, copy its **layout structure, density, and hierarchy** — not every pixel of decoration.

---

## 2. Design Tokens (single source of truth)

Define tokens once. Components use tokens only. Never hardcode unrelated hex colors inside components.

### 2.1 CSS variables (`src/index.css`)

```css
:root {
  /* Brand — CHANGE per project, keep ONE primary */
  --color-primary: #1d4ed8;
  --color-primary-hover: #1e40af;
  --color-primary-soft: #eff6ff;   /* tinted backgrounds, selected rows */

  /* Optional accent — use sparingly, max 1 */
  --color-accent: #0f766e;
  --color-accent-soft: #f0fdfa;

  /* Neutrals — these should dominate the UI */
  --color-bg: #f8fafc;             /* page background */
  --color-surface: #ffffff;        /* panels, tables, forms */
  --color-surface-muted: #f1f5f9;  /* table header, subtle blocks */
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;

  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #64748b;     /* min contrast on white ≈ 4.7:1 — do not go lighter for real text */

  /* Semantic */
  --color-success: #15803d;  --color-success-soft: #f0fdf4;
  --color-warning: #b45309;  --color-warning-soft: #fffbeb;
  --color-danger:  #b91c1c;  --color-danger-soft:  #fef2f2;
  --color-info:    #0369a1;  --color-info-soft:    #f0f9ff;

  /* Shape & elevation */
  --radius-sm: 4px;   /* badges, small tags */
  --radius-md: 6px;   /* buttons, inputs, selects */
  --radius-lg: 8px;   /* cards, panels, modals */
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-pop: 0 4px 12px rgb(15 23 42 / 0.12); /* dropdowns, popovers, modals only */
}
```

### 2.2 Tailwind mapping (`tailwind.config`)

```ts
// Map tokens so classes read as bg-surface, text-muted, border-border, ...
extend: {
  colors: {
    primary: { DEFAULT: 'var(--color-primary)', hover: 'var(--color-primary-hover)', soft: 'var(--color-primary-soft)' },
    accent:  { DEFAULT: 'var(--color-accent)',  soft: 'var(--color-accent-soft)' },
    bg: 'var(--color-bg)', surface: 'var(--color-surface)', 'surface-muted': 'var(--color-surface-muted)',
    border: 'var(--color-border)', 'border-strong': 'var(--color-border-strong)',
    ink: { DEFAULT: 'var(--color-text)', secondary: 'var(--color-text-secondary)', muted: 'var(--color-text-muted)' },
    success: { DEFAULT: 'var(--color-success)', soft: 'var(--color-success-soft)' },
    warning: { DEFAULT: 'var(--color-warning)', soft: 'var(--color-warning-soft)' },
    danger:  { DEFAULT: 'var(--color-danger)',  soft: 'var(--color-danger-soft)' },
    info:    { DEFAULT: 'var(--color-info)',    soft: 'var(--color-info-soft)' },
  },
  borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
  boxShadow:    { sm: 'var(--shadow-sm)', pop: 'var(--shadow-pop)' },
  fontFamily:   { sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
}
```

### 2.3 Color rules

- Neutrals (bg, surface, text, border) make up ~90% of the screen.
- Primary color is for: main button, links, active nav item, focus ring, selected state. Nothing else.
- Max 1 accent. Never put blue, purple, green, orange and pink on the same screen.
- Never communicate status by color alone — pair with text or icon ("Đã duyệt", not just a green dot).
- Gradients: none by default (see Section 12).

---

## 3. Typography

One font family (Inter or the project's brand font). **Verify Vietnamese diacritics render correctly** (use `Inter` with `latin-ext`/`vietnamese` subset, or Be Vietnam Pro).

| Role | Size / weight | Tailwind | Usage |
|---|---|---|---|
| Page title (H1) | 24px / 600 | `text-2xl font-semibold` | One per page |
| Section title (H2) | 18px / 600 | `text-lg font-semibold` | Panel / section headings |
| Subsection (H3) | 15–16px / 600 | `text-base font-semibold` | Groups inside a panel |
| Body | 14–16px / 400 | `text-sm` (dense apps) / `text-base` (content sites) | Default text |
| Small / caption | 12–13px / 400 | `text-xs` / `text-[13px]` | Meta, helper text, table secondary |
| Label | 13px / 500 | `text-[13px] font-medium` | Form labels, table headers |

Rules:
- Max 3 font weights: 400, 500, 600. Avoid 700+ except marketing hero numbers.
- Do not use `text-4xl`+ for ordinary section headings. Large display type is only for a real hero or a key number.
- Line height: body `leading-relaxed` for paragraphs, `leading-snug` for headings. Max line length for reading text ≈ 65–75 characters (`max-w-prose`).
- Uppercase tracking-wide labels: only for tiny category labels, not for headings or buttons.

---

## 4. Spacing & Layout

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48. Use it to express hierarchy:

```text
Related items (label + input, title + description)   4–8px
Items in the same group                              12–16px
Groups inside a section                              24px
Sections on a page                                   32–48px
Page padding                                         16px mobile / 24–32px desktop
```

Rules:
- Related things close, unrelated things far. Do not use the same `py-20 gap-8` on every section.
- Prefer a consistent container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (content sites) or full-width with sidebar (apps).
- Avoid the reflex "3 columns × 3 cards × icon + title + text". Pick the structure that fits the content:

| Content is... | Use |
|---|---|
| Many records with attributes | Table with filters, sort, pagination |
| Steps / history | Timeline or numbered list |
| Items to compare | Comparison table or side-by-side panels |
| Document-like info | Prose with headings and a side table of contents |
| One main thing + supporting things | Featured block (large) + compact list (small) |
| Navigation to categories | Plain link list or grouped menu |
| Settings | Left section nav + form groups separated by dividers |

- Every page needs one **visual anchor**: a product image, photo, chart, map, table, or featured content. Never fill space with decorative blobs.

---

## 5. Components (concrete specs)

### 5.1 Buttons

```tsx
// Primary — ONE per view/section
<button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
  Lưu thay đổi
</button>

// Secondary
<button className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
  Hủy
</button>

// Ghost / tertiary
<button className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-primary hover:bg-primary-soft">
  Xem chi tiết
</button>

// Destructive — solid only in the confirmation dialog; elsewhere use outline-danger
<button className="inline-flex h-9 items-center rounded-md bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90">
  Xóa
</button>
```

- Heights: 32 (compact) / 36 (default) / 40 (touch/mobile). Min touch target 40–44px on mobile.
- Solid color + subtle hover. No gradient, no glow, no scale-on-hover bounce.
- Show a loading state (spinner + disabled) for async actions.

### 5.2 Inputs & forms

```tsx
<div className="space-y-1.5">
  <label htmlFor="email" className="text-[13px] font-medium text-ink">Email</label>
  <input id="email" className="h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-danger" />
  <p className="text-xs text-ink-muted">Dùng email trường để nhận thông báo.</p>
  {/* error: <p role="alert" className="text-xs text-danger">Email không hợp lệ.</p> */}
</div>
```

- Always a visible `<label>` (placeholder is not a label). Error text says what is wrong and how to fix it.
- Group long forms with section headings and dividers, not nested cards.

### 5.3 Cards / panels

Use a panel only when grouping, selection, comparison, or interaction needs it.

```tsx
<section className="rounded-lg border border-border bg-surface">
  <header className="border-b border-border px-4 py-3">
    <h2 className="text-base font-semibold text-ink">Thông tin chung</h2>
  </header>
  <div className="p-4">{/* content */}</div>
</section>
```

- Border OR `shadow-sm`, not both heavy. No `shadow-lg+`, no `rounded-2xl`.
- Never nest a card inside a card inside a card.

### 5.4 Tables (admin / data-heavy)

```tsx
<div className="overflow-x-auto rounded-lg border border-border bg-surface">
  <table className="w-full text-sm">
    <thead className="bg-surface-muted text-left text-[13px] font-medium text-ink-secondary">
      <tr><th className="px-4 py-2.5">Tên</th><th className="px-4 py-2.5">Trạng thái</th><th className="px-4 py-2.5 text-right">Thao tác</th></tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="hover:bg-surface-muted/60">
        <td className="px-4 py-2.5 text-ink">…</td>
        <td className="px-4 py-2.5"><span className="rounded-sm bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Hoạt động</span></td>
        <td className="px-4 py-2.5 text-right">…</td>
      </tr>
    </tbody>
  </table>
</div>
```

Needs: search, filters, sortable headers, pagination, row actions, empty/loading/error states, horizontal scroll on mobile (or switch to stacked rows).

### 5.5 Navigation

- App: left sidebar 220–260px, grouped items, active item = `bg-primary-soft text-primary` + visible indicator. Collapsible to a drawer on mobile.
- Content/government site: top bar with clear primary links + search, breadcrumb on inner pages, footer with contact and legal links.
- Icons in nav only if they help scanning; keep one icon family (e.g. lucide-react), one size (16–18px), one stroke width.

### 5.6 Badges / status

Small, flat, `rounded-sm` or `rounded-full`, soft background + dark text, always with a text label.

### 5.7 Modal / dialog

`rounded-lg`, `shadow-pop`, overlay `bg-black/40` (no blur), focus trapped, Esc closes, destructive confirmation names the thing being deleted.

---

## 6. Required States (a screen is not done without these)

| State | Requirement |
|---|---|
| Loading | Skeleton matching the layout (tables/lists) or spinner (buttons). No decorative loaders. |
| Empty | Say what is empty, why, and give one action ("Chưa có bài viết nào. Tạo bài viết đầu tiên"). |
| Error | Say what happened and what to do next; offer Retry. |
| Success | Clear confirmation (toast or inline), not just silence. |
| Disabled | Visually distinct and, when not obvious, explained (tooltip/helper text). |
| Forbidden | Explain the restriction and the next step (request access / go back). |

---

## 7. Domain Presets (choose the one that matches `DESIGN.md`)

**Admin dashboard / internal tool**
Dense, calm, fast to scan. Sidebar + page header + filters bar + table. Metrics as a compact row of plain numbers with small labels (not giant decorative cards). Base text 14px. Charts only when they answer a question.

**Government / public service**
Trust and clarity. Solid brand color, high contrast, larger body text (16px), clear category navigation, prominent search, document/download lists, status of applications, visible contact/support. No futuristic styling, no gradients, no animation beyond feedback.

**E-commerce**
Product image, name, price, variant, availability, add-to-cart must dominate. Strong filtering and search. Price is the most legible text on a product card. One accent for promotions only.

**Education**
Course structure, progress, next learning action. Reading comfort (generous line height, max width). Clear progress indicators with text.

**Content / blog / news**
Typography-led. Real article layout, readable column width, clear category and date metadata, related content as a list.

**SaaS marketing page** (only when a marketing page is actually requested)
Concrete headline about the real product, a real product screenshot as the anchor, then specific sections. No filler like "Revolutionize your workflow".

---

## 8. Responsive

Design each breakpoint, do not just shrink desktop.

- Mobile: single column, 16px page padding, 40–44px touch targets, sticky primary action when relevant, tables → stacked rows or horizontal scroll, drawer navigation, less decoration.
- Tablet: reduce columns, collapsible sidebar.
- Desktop: sidebar, multi-column, higher density.
- No horizontal page overflow. Test at 360px, 768px, 1280px.

---

## 9. Accessibility (minimum bar)

- Text contrast ≥ 4.5:1 (3:1 for large text and UI borders).
- Visible focus ring on every interactive element; fully keyboard-operable.
- Semantic HTML: `button` for actions, `a` for navigation, real headings in order, `nav`, `main`, `table`.
- Labels on all inputs; `aria-label` on icon-only buttons; `role="alert"` for errors.
- Do not rely on color alone. Respect `prefers-reduced-motion`.

---

## 10. Motion

Motion must communicate state change, navigation, or feedback.

- Allowed: 150–200ms color/opacity transitions, dropdown/modal enter, skeleton shimmer, toast slide.
- Avoid: floating loops, bounce, particles, infinite gradients, parallax, scroll-jacking, entrance animation on every element.
- Always wrap non-essential motion with `motion-safe:` or a reduced-motion media query.
- Rule: if removing the animation does not hurt understanding, remove it.

---

## 11. Content

- Use realistic content for the actual product and language (Vietnamese labels, real field names, plausible data). No "Lorem ipsum", no "Powerful platform", no "Transform your workflow".
- Buttons say the real action ("Gửi đăng ký", "Tải biểu mẫu"), not "Get started".
- Microcopy is short, specific, and helpful.

---

## 12. Banned Defaults (allowed only if `DESIGN.md` explicitly justifies them)

Replace the left column with the right column.

| Don't | Do instead |
|---|---|
| `bg-gradient-to-*` on buttons, cards, headings, badges | Solid token color |
| Glassmorphism: `backdrop-blur` + translucent cards | Opaque `bg-surface` + `border` |
| `rounded-2xl` / `rounded-3xl` everywhere | `rounded-md` controls, `rounded-lg` panels |
| `shadow-xl` / `shadow-2xl` / custom big shadows | `border` or `shadow-sm`; `shadow-pop` only for overlays |
| Glow, neon borders, floating blobs | Nothing — or a relevant image/diagram |
| Pill-shaped everything | Pills only for tags/avatars |
| 3 identical icon cards | Table, list, timeline, or featured + list |
| Colorful icon in a rounded square above every title | Text heading; icon only when it adds meaning |
| Huge centered hero with gradient + two CTAs | Compact functional header, or split hero with real product visual |
| Giant headings in every section | One H1, modest H2/H3 per the type scale |
| Gradient stat cards | Plain numbers with labels, or a chart |
| Emoji as icons | One consistent icon library |
| Arbitrary values `bg-[#...] shadow-[...] rounded-[...]` | Tokens |
| Hover `scale-105 -translate-y-1` on everything | Subtle color/border change |

---

## 13. Workflow (follow in order)

1. **Read** `DESIGN.md` and this file. If there is no brief, complete Section 1.
2. **Inspect existing code** (when modifying): what works, what is weak, what is inconsistent, what actually causes the AI look. Preserve routes, API contracts, state, business logic.
3. **Propose structure** in a few lines: layout, main components, anchor, which tokens used. Wait for approval if the task is large.
4. **Build in layers**: tokens → layout shell → core components → page content → states → responsive.
5. **Self-review** (Section 14).
6. **De-AI pass** (Section 15).
7. **Report**: what changed, what was kept, remaining issues.

Do not redesign the whole product in one shot. Work page by page or component by component.

---

## 14. Self-Review Checklist

**AI-pattern check**
- [ ] Any gradient, glow, blur, or heavy shadow without a stated reason?
- [ ] Is everything a card? Does every section look structurally identical?
- [ ] More than ~3 colors competing for attention?
- [ ] Decorative icons or illustrations that carry no meaning?
- [ ] Headings oversized or weak hierarchy?
- [ ] Generic copy that could belong to any product?
- [ ] Does it look like it was made for *this* product?

**Product check**
- [ ] Can a user understand the page in 5 seconds?
- [ ] Is the primary action obvious (only one primary per area)?
- [ ] Is information grouped logically and prioritized?
- [ ] Matches the domain preset?
- [ ] Loading / empty / error / success / disabled handled?

**Technical check**
- [ ] Only tokens used, no stray hex colors or arbitrary values
- [ ] Works at 360 / 768 / 1280, no horizontal overflow
- [ ] Keyboard + focus + contrast + labels OK
- [ ] No console errors, no TypeScript errors
- [ ] Existing functionality and API contracts untouched

---

## 15. De-AI Pass

After the first version, find the **3–7 most AI-looking elements** and fix only those. Typical fixes:

```text
Gradient button            → solid primary button
Huge rounded card          → bordered panel, rounded-lg
Row of icon cards          → table / list / featured + list
Heavy shadow               → border or shadow-sm
Colorful icon badges       → remove or one neutral icon style
Giant hero                 → compact header with the real anchor
Generic stock-like visual  → real product screenshot / chart / map
Oversized headings         → type scale from Section 3
```

Then ask:
1. Would a professional product designer approve this?
2. If the logo and text were removed, would the structure still feel intentional?
3. Which three elements still look most AI-generated? Fix them.

The goal is refinement, not a bland result: keep personality that comes from the brand color, typography, layout rhythm, and real content.

---

## 16. Code Safety

When modifying an existing project:
- Do not rename API fields, change routes, remove features, swap libraries, or rewrite working components without a clear reason.
- Prefer small, targeted diffs. Keep existing component props and state flow.
- Reuse existing components before creating new ones. Create a reusable component only when a pattern repeats 3+ times. Avoid "UniversalCard"-style over-abstraction.
- Add no new dependencies unless needed and justified.

---

## 17. `DESIGN.md` Template (copy into the project root and fill in)

```markdown
# DESIGN.md

## Product
<one sentence>

## Users & tasks
- Users: <who, age, device, tech level>
- Top tasks: 1) … 2) … 3) …

## Domain preset
<admin | government | e-commerce | education | content | saas>

## Reference UIs
- <name/url> — what to borrow (layout / density / navigation)
- <name/url> — what to borrow

## Tokens (override defaults from ui-design-skill.md)
- Primary: #______   Hover: #______   Soft: #______
- Accent: <none | #______ and where it is allowed>
- Font: <Inter | Be Vietnam Pro | …>   Body size: <14 | 16>px
- Radius: controls 6px / panels 8px
- Density: <compact | comfortable>

## Layout decisions
- Shell: <sidebar + content | top nav + content>
- Visual anchor per key page: <page → anchor>

## Do / Don't (project-specific)
- Do: …
- Don't: …

## Allowed exceptions to Banned Defaults
- <e.g. a gradient only on the landing hero image, because …>
```

---

## 18. Prompt Snippets (for the user to paste into the AI tool)

**New page**
```text
Read ui-design-skill.md and DESIGN.md first. Build the [page name] page for [users] who need to [task].
Use only the tokens from DESIGN.md. Before coding, describe the layout and the visual anchor in 3–5 lines.
After coding, run the Self-Review and De-AI pass and list the 3–5 most AI-looking remaining elements, then fix them.
Do not change routes, API contracts, or business logic.
```

**Fix an existing AI-looking page**
```text
Read ui-design-skill.md and DESIGN.md. Review [file/page] and list what makes it look AI-generated (max 7 items, ordered by impact).
Then apply targeted fixes only to those items. Keep functionality, props, state, and API calls unchanged.
```

**Review from a screenshot**
```text
Here is a screenshot. Using ui-design-skill.md, identify hierarchy, spacing, alignment, and consistency problems and the most AI-looking elements.
Propose targeted changes, then implement them.
```