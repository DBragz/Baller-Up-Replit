# Baller-Up Design Guidelines

## Design Approach

**Selected System:** Material Design principles with sports-utility focus

**Justification:** This is a utility-focused queue management tool requiring instant clarity, mobile accessibility, and real-time updates. Function over form, with energetic sports-themed accents.

## Core Design Elements

### Typography
- **Primary Font:** Inter or Roboto (Google Fonts)
- **Display (Queue Position):** 4xl-6xl, bold weight - massive numbers for at-a-glance recognition
- **Player Names:** xl-2xl, medium weight - high legibility
- **UI Labels:** base-lg, regular weight
- **Buttons:** lg, semibold weight - confident CTAs

### Layout System
**Spacing Primitives:** Use Tailwind units of 3, 4, 6, 8, 12 for consistency
- Tight spacing (p-3, gap-3) for compact mobile views
- Standard spacing (p-6, gap-6) for list items
- Generous spacing (p-8, p-12) for major sections

**Responsive Grid:**
- Mobile-first single column
- Desktop: Optional sidebar showing stats/history
- Max-width: max-w-2xl for main queue display (focused attention)

### Component Library

**Queue Display (Core Component):**
- Large numbered list with prominent position indicators (#1, #2, #3...)
- Player cards with position number, name, join time
- Visual hierarchy: Next up gets hero treatment, rest in ordered list
- Swipe gestures for mobile leave action

**Action Buttons:**
- Primary CTA: "Join Queue" - Large, prominent, fixed bottom on mobile
- Secondary: "Leave Queue" - Accessible but less prominent
- Admin: "Call Next Player" - Distinct treatment, possibly locked/elevated

**Empty State:**
- Large illustration placeholder (basketball court diagram or hoop icon from Font Awesome/Heroicons)
- Encouraging message: "Be the first to ball up!"
- Prominent join button

**Status Indicators:**
- "You're Next!" banner - high contrast, celebratory
- "Position #X" badge - clear numerical indicator
- Queue length counter - "5 ballers waiting"

**Real-time Updates:**
- Subtle animations when queue position changes (slide up)
- Toast notifications for join/leave events
- Pulse effect on "You're Next" state

### Component Structure

**Header:**
- App title "Baller Up" with basketball icon
- Live queue count
- Optional: Court status toggle (if managing multiple courts)

**Main Queue Section:**
- Next player highlight card (elevated, larger)
- Scrollable queue list below
- Clear visual separation between "on deck" and waiting

**Footer/Action Bar:**
- Fixed bottom bar on mobile with primary actions
- Desktop: Integrated into main layout

**Admin Controls (if applicable):**
- Separate elevated section or modal
- "Next Player" button with confirmation
- Queue reset/management tools

### Accessibility & Interaction
- High contrast ratios for outdoor visibility
- Large touch targets (min 44px) for on-court use
- Haptic feedback for join/leave actions (mobile)
- Optimized for one-handed mobile use
- Screen reader support for queue announcements

### Icons
**Library:** Font Awesome (sports icons available)
- Basketball icon for branding
- User icons for queue members
- Arrow/chevron for position indicators
- Check/X for actions

### Layout Behavior
- Mobile: Full-screen queue view, minimal chrome
- Tablet/Desktop: Centered queue with optional side stats panel
- Persistent action bar for quick access
- Auto-scroll to user's position when in queue

### Images
No hero image needed - this is a functional tool. Use:
- Icon-based branding (basketball/court illustration)
- Optional: Background pattern with subtle court lines (very low opacity)
- Focus on data display, not imagery

**Key Principle:** This app needs to work in bright sunlight, with sweaty hands, between games. Prioritize readability, speed, and one-tap actions over visual flourish.