# Design Sense Documentation

This document outlines the design patterns, UI components, and visual language used throughout the Sparkmentis platform. Following these guidelines will help maintain consistency and improve the user experience.

## Color System

### Primary Color Palette
- **Primary Blue**: Used for main actions, buttons, and links
- **Secondary Blue**: Used for hover states and secondary actions
- **Accent Purple**: Used for AI-related features and highlights

### Semantic Colors
- **Success Green**: #10B981 (and lighter shades)
- **Warning Orange**: #F59E0B (and lighter shades)
- **Error Red**: #EF4444 (and lighter shades)
- **Info Blue**: #3B82F6 (and lighter shades)

### Difficulty Level Color System
- **Easy**: Green (#10B981) - Represents straightforward, fundamental concepts
- **Medium**: Blue (#3B82F6) - Represents moderate complexity
- **Hard**: Orange (#F59E0B) - Represents challenging content
- **Advanced**: Red (#EF4444) - Represents complex, expert-level content

## Typography

- **Headings**: Use large, bold text with reduced line height
- **Body Text**: Use regular weight with comfortable line height for readability
- **Small Text/Captions**: Use smaller text size with slightly increased letter spacing

## UI Components

### Cards
- Use shadow-md for main content cards
- Use border-0 to remove default borders
- Include proper padding (p-6) for content areas
- Use rounded-lg for consistent corner rounding

### Buttons
- Primary actions: solid background with white text
- Secondary actions: outlined or ghost style
- Include icons in buttons to enhance visual communication
- Use gap-2 to separate icons from text
- Include hover and disabled states

### Forms
- Group related fields with proper spacing
- Use consistent label placement (above fields)
- Mark required fields with red asterisk
- Include helpful descriptions where needed
- Provide validation feedback inline

### Tabs
- Use for organizing related content
- Include icons in tab triggers for visual distinction
- Maintain consistent styling across tab interfaces
- Ensure proper spacing between tab sections

### Status Indicators
- Use badges with appropriate colors for status
- Include small color dots/circles for visual reinforcement
- Ensure sufficient contrast for accessibility

## AI Features Styling

### AI Generation Components
- Use purple accents (Sparkles icon)
- Include loading states with spinners
- Provide clear feedback on generation process
- Incorporate color-coded difficulty levels
- Include tooltips for additional information

### Generated Content
- Use subtle background colors to indicate AI-generated content
- Include clear attribution that content was AI-generated
- Provide options to regenerate or modify content
- Use proper spacing and typography for readability

## Layout Principles

### Spacing System
- Use consistent spacing increments
- Increase spacing between major sections
- Reduce spacing for related elements

### Responsive Design
- Use grid layouts that adapt to different screen sizes
- Stack elements vertically on mobile
- Hide or collapse secondary information on smaller screens
- Ensure touch targets are adequately sized (min 44px)

### Visual Hierarchy
- Use size, color, and spacing to indicate importance
- Most important elements should stand out visually
- Group related information
- Use whitespace to separate unrelated sections

## Interaction Patterns

### Hover States
- Use subtle transitions for hover effects
- Change background color or opacity to indicate interactivity
- Don't rely solely on color changes (consider users with color blindness)

### Loading States
- Use consistent loading indicators (Loader2 component with animation)
- Disable interactive elements during loading
- Provide feedback on process completion

### Error States
- Display clear error messages
- Use red color sparingly to indicate errors
- Provide actionable guidance to resolve issues

## Best Practices

1. **Consistency**: Maintain consistent styling across similar components
2. **Accessibility**: Ensure sufficient color contrast and text size
3. **Feedback**: Provide clear feedback for user actions
4. **Simplicity**: Avoid cluttered interfaces and unnecessary elements
5. **Progressive Disclosure**: Show additional options only when needed

By following these design principles, we can create a cohesive, intuitive, and visually appealing user experience throughout the Sparkmentis platform.
