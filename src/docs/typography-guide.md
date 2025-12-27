# Typography System Guide

This project uses a consistent typography system based on CSS custom properties defined in `index.css` and utility classes in `typography.css`.

## CSS Custom Properties (Variables)

The following CSS custom properties are available globally:

### Font Families
- `--font-body`: system-ui, Avenir, Helvetica, Arial, sans-serif
- `--font-heading`: system-ui, Avenir, Helvetica, Arial, sans-serif

### Font Weights
- `--font-weight-regular`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

### Font Sizes
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 1.875rem (30px)
- `--font-size-4xl`: 2.25rem (36px)

## CSS Utility Classes

The following utility classes are available for consistent typography:

### Headings
- `.text-h1` - Extra large heading
- `.text-h2` - Large heading
- `.text-h3` - Medium heading
- `.text-h4` - Small heading
- `.text-h5` - Extra small heading
- `.text-h6` - Smallest heading

### Body Text
- `.text-body1` - Primary body text
- `.text-body2` - Secondary body text
- `.text-subtitle1` - Primary subtitle
- `.text-subtitle2` - Secondary subtitle

### UI Text
- `.text-button` - Button text styling
- `.text-caption` - Caption text
- `.text-overline` - Overline text

## Usage Examples

### In JSX Components
```jsx
<h1 className="text-h1">Main Title</h1>
<p className="text-body1">This is primary body text.</p>
<span className="text-caption">This is caption text.</span>
```

### In CSS Files
```css
.custom-title {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-2xl);
}

.custom-button-text {
  font-family: var(--font-body);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}
```

## Consistency Benefits

Using this system ensures:
- Consistent font sizes and weights across the application
- Easy global updates to typography
- Better maintainability
- Improved accessibility through consistent sizing