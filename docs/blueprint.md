# **App Name**: FYKING.MEN

## Core Features:

- Profile Grid: Displays a scrollable grid of user profiles with key details. Includes real-time data updates using Supabase Realtime for online status, distance calculation based on geolocation (PostGIS), and quick actions like messaging and favoriting. ROI-driven profile sorting prioritizes local and liked profiles, optimizing subscription value. Caching implemented for performance.
- Real-Time Messaging: End-to-end encrypted messaging system (using Signal protocol) with typing indicators, read receipts, media sharing (photos, videos, voice notes), and robust search functionality across conversations. Messages are efficiently stored and indexed in Supabase for fast retrieval. Includes spam filtering and reporting.
- Advanced Filtering: A powerful filtering system with an age range slider (18-99), precise distance radius control, and multi-select tribe/interest selection with a visually appealing badge UI. Filter preferences are persisted using Supabase user metadata for a seamless experience across sessions. Includes saved filter sets.
- Favorites Management: Clean grid view for displaying favorited profiles, enabling quick access and management of saved connections. An engaging empty state encourages exploration. Features efficient removal and organization capabilities (folders, tagging). Integration with profile update notifications.
- Profile Management: Comprehensive user profile with high-resolution avatar upload, dynamic stats dashboard (views, favorites, matches), and editable sections for location, age, height, bio, and interests/tribes, using a badge system. Configuration is streamlined through the AI King's profile optimization tool (Langchain + OpenAI) for peak discoverability and engagement.
- AI King Chat: An intelligent AI assistant that provides context-aware chat reply suggestions, efficient booking assistance, personalized gym/diet plans, and dynamic trip schedule suggestions based on detailed user data and preferences. Uses a reasoning tool (Tree of Thoughts) to strategically incorporate information and ensures consistently helpful and relevant interactions. The AI can rewrite messages with varied tones.
- AI Photo Curation: The AI King intelligently helps users select the strongest, most appealing photos for their profile (strict non-explicit policy). Employs advanced aesthetic and taste analysis models (CLIP, BLIP) to maximize profile attractiveness and first impressions.
- AI Gym & Diet Planner: The AI (using Gemini) dynamically designs and adjusts personalized gym and diet plans, provides timely reminders, and adapts to unforeseen events like trips or injuries. Integrates with wearable sensor data for optimized results.
- AI Safety Guardian: The AI King proactively monitors conversations (with explicit user consent, either on-device or server-side) for indicators of minors, potential threats, and known scam patterns (using a real-time threat intelligence feed). It suggests safe practices and check-ins once a location is shared, minimizing risks. Reporting and escalation path.
- MeetNow Cards: Users can create ephemeral MeetNow cards, clearly indicating activities they're interested in (gym, drinks, coffee, etc.). Other users can quickly and easily request to join, facilitating spontaneous real-world connections. Includes location fencing and auto-expiration.
- Memberships: Robust system to handle user subscriptions and tier-based access. Integrates Stripe for payment processing and Supabase for user role management.
- Users: Scalable system to manage user accounts and profiles. Includes comprehensive data validation, security measures, and GDPR compliance.

## Style Guidelines:

- Primary color: Gold (#FFD700) to reflect the regal and premium nature of the app, evoking a sense of luxury and exclusivity.
- Background color: Charcoal (#1A1A1A) for a dark and opulent theme, aligning with the user request and creating a sophisticated backdrop.
- Accent color: Orange-red (#FF6B6B) to highlight key interactive elements and call-to-actions, providing a visual punch and guiding user attention.
- Body and headline font: 'Inter', a versatile sans-serif, selected for its clean, modern appearance and excellent readability across body and headline text.
- Custom regal-themed icons and badges (crowns, scepters, lions) to reinforce the 'King' brand, creating a visually distinctive and memorable experience. SVG format for scalability.
- Mobile-first layout meticulously designed for optimal usability on smaller screens, with tabbed navigation, dynamic grid/swipe views, and intuitive sidebar navigation for a streamlined user journey. Responsive design ensures seamless adaptation to larger screens.
- Subtle and smooth transitions and hover effects (200-300ms) to add a touch of richness and polish, enhancing the overall user experience without being distracting. Implemented with Framer Motion for performance.
- High-end 3D effects and compelling animations using GSAP for a visually stunning and immersive experience. Horus-level coverage ensures every element is meticulously animated and polished.