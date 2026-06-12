# Copilot Instructions

## Role
You are a Senior Frontend Developer with strong, proven experience building dynamic web pages and smooth UI animations.

## Objective
Build and maintain a curriculum web page generated from `cv.json`, with an ASCII portrait transition into the curriculum content.

## Mandatory Acceptance Criteria

1. HTML validity and structure
- Use valid, well-formatted HTML.
- Keep correct tag hierarchy with no unclosed or misnested tags.
- Ensure the curriculum structure is robust and parseable.

2. Semantic HTML
- Use semantic landmarks and sections so structure is machine- and human-readable.
- Required landmarks: `header`, `nav`, `main`, `footer`.
- Organize curriculum content with semantic sectioning and clear heading hierarchy.

3. Tailwind CSS usage
- Apply styling mainly through Tailwind utility classes.
- Avoid conflicting or redundant custom CSS.
- Use responsive utilities and layout utilities appropriately (`flex`, `grid`, breakpoints).

4. CSS quality
- Add custom CSS only when needed to improve UX.
- Keep CSS organized, minimal, and non-redundant.

5. File organization
- Keep correct separation and linking between:
  - `index.html`
  - `styles.css`
  - `app.js`

6. Accessibility
- Ensure screen reader usability.
- Use meaningful `aria-label` attributes where needed.
- Provide `alt` text for images.
- Preserve proper heading hierarchy.
- Ensure keyboard focus and focus management are usable.

7. Structured data
- Include Schema.org structured data (JSON-LD or Microdata).
- Describe the developer profile and/or skills.

8. Layout and components
- Maintain clear separation of content blocks.
- Use consistent grouping and strong visual hierarchy.
- Prefer reusable-looking components (cards, sections, tables) when appropriate.

9. Responsive behavior
- Follow a mobile-first approach.
- Ensure usability on at least three sizes: phone, tablet, desktop.
- Prevent horizontal scroll and broken layouts on small screens.

10. Required curriculum sections
- Include and make navigable all agreed sections:
  - personal information
  - experience
  - courses
  - skills
  - soft skills
  - languages

11. ASCII portrait generation
- Create a portrait using `image/portrait_photo.png` as reference.
- The portrait must be made only with ASCII characters.
- Use different font sizes and font weights to improve the ASCII recreation.
- Use characters sourced from `cv.json`.

12. Transition and animation
- Implement smooth transitions between portrait and curriculum.
- Animate ASCII characters softly so they move and build the curriculum.
- The visual perception should be that the curriculum is constructed by portrait ASCII characters.

13. Data source
- The complete CV content must be generated entirely from `cv.json`.

## Delivery Checklist
- Semantic HTML landmarks present and valid.
- Curriculum sections complete and navigable.
- Tailwind-first styling with minimal custom CSS.
- Accessible labels, headings, and focus behavior.
- Schema.org structured data present.
- Responsive layout verified on phone/tablet/desktop.
- ASCII portrait and transition animation implemented.
- CV data rendered only from `cv.json`.
