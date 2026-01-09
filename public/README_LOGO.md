# Club Logo Setup

## How to Add Your Club Logo

1. **Add Your Logo File:**
   - Place your logo image file in the `public` folder
   - Recommended file name: `club-logo.png` or `club-logo.svg`
   - Recommended formats: PNG, SVG, or JPG
   - Recommended size: 200x200px or larger (square aspect ratio works best)

2. **Update the Logo Path in Sidebar:**
   - Open `components/Sidebar.tsx`
   - Find the line with `src="/club-logo.png"`
   - Replace `/club-logo.png` with your actual logo file path
   - Example: If your logo is named `my-club-logo.svg`, change it to `/my-club-logo.svg`

3. **Alternative: Use a URL:**
   - If your logo is hosted online, you can use the full URL
   - Example: `src="https://example.com/logo.png"`

## Current Logo Path
The sidebar is currently configured to look for: `/club-logo.png`

## Logo Display
- **Expanded Sidebar:** Shows full logo (max 140px width, square aspect ratio)
- **Collapsed Sidebar:** Shows logo in a 48px square container
- **Fallback:** If logo is not found, displays "Club Logo" text or "CL" initials


