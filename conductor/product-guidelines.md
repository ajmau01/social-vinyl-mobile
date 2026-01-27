# Product Guidelines: Social Vinyl Mobile

## Design Philosophy
We are building a **premium digital companion** to an analog experience. The app should feel like a high-end remote control for a futuristic lounge.

### Visual Aesthetic: "Modern Glassmorphism"
- **Theme:** Deep "Night Mode" backgrounds (consistent with the web app's `modern.css`) accented by Neon Purple and Cyber Blue.
- **Materials:** Extensive use of frosted glass (blur effects) for overlays, modals, and navigation bars to maintain context of the content behind.
- **Typography:** Clean, sans-serif fonts that are legible in low-light party environments.

## User Experience (UX)
### Interaction Principles
- **Tactile Feedback:** Every significant action (adding a track, vetoing) must be accompanied by subtle haptic feedback to ground the digital interaction.
- **Fluid Motion:** Transitions should never be abrupt. Use physics-based animations (springs) for list reordering and drawer sliding to create a sense of weight and quality.
- **Optimistic UI:** Interactions should feel instant. Update the UI immediately on tap, then reconcile with the server state.

### Priorities
1.  **Speed of Entry:** The "Time to Vibe" must be minimal. Guests should be scanning a code and browsing within seconds.
2.  **Visual Delight:** Prioritize large, high-quality album art and "fun" interactions (like cover flips) over raw data density.
3.  **Information Density:** *Secondary Goal.* Where it doesn't compromise the aesthetic or touch targets, maximize the number of visible list items to facilitate efficient browsing.

## Tone of Voice
- **Personality:** Enthusiastic, social, and music-obsessed.
- **Style:** Use energetic verbs and "party" language rather than dry technical terms.
    - *Good:* "Dropping the needle...", "Digging through the crates...", "Nice pick!"
    - *Bad:* "Processing request...", "Synchronizing database...", "Item added."

## Accessibility
- **Low Light Optimization:** The UI must be usable in dark rooms (party settings) without blinding the user. Avoid pure white backgrounds.
- **Touch Targets:** Ensure all buttons are large enough (min 44x44pt) for easy tapping in a casual, potentially crowded environment.
