# AI Development Rules for the FYKING.MEN Enterprise Application

This document outlines the authoritative technical stack and non-negotiable coding conventions to be followed by the AI assistant when modifying this application. Adherence to these rules ensures architectural purity, maintainability, and optimal performance for this Next.js, Supabase, and Genkit-powered enterprise system.

## 🔱 Core Tech Stack

*   **Framework**: Next.js 14+ (App Router) - The foundation for our server-rendered and client-side React application.
*   **Language**: TypeScript - For end-to-end static typing and enterprise-grade code quality.
*   **Backend & Database**: Supabase - The exclusive backend-as-a-service for Authentication, Postgres Database, and Storage.
*   **ORM**: Drizzle - For type-safe database queries and schema management, with schema defined in `src/db/schema.ts`.
*   **AI Integration**: Genkit - The sole framework for all generative AI functionality, including LLM flows, vector search, and image analysis. Models are primarily from `@genkit-ai/google-genai`.
*   **UI Components**: shadcn/ui - The primary component library. All UI must be built using or extending these components.
*   **Styling**: Tailwind CSS - For all styling needs. All styles must be applied via utility classes.
*   **Icons**: `lucide-react` - The exclusive icon library. No other icon sets are permitted.
*   **State Management**: React Query (`@tanstack/react-query`) - For all server-state management, caching, and data fetching operations.
*   **Form Management**: React Hook Form (`react-hook-form`) with Zod (`zod`) for validation.

## 📜 Unbreakable Rules of Development

### 1. File Structure and Routing (Next.js App Router)
*   **App Router ONLY**: All pages and layouts must be built using the `app/` directory. The `pages/` directory is forbidden.
*   **Route Organization**: Create new routes by adding new directories inside `src/app/`. Dynamic routes should use bracket notation (e.g., `src/app/profile/[id]/page.tsx`).
*   **Component Types**: Default to Server Components for data fetching and server-side logic. Use the `'use client';` directive only when client-side interactivity (hooks, event handlers) is absolutely necessary.
*   **Main Entry Point**: The primary landing page for authenticated users is `src/app/discover/page.tsx`. `src/app/page.tsx` handles the root redirect.

### 2. Backend and Data Layer (Supabase & Drizzle)
*   **Supabase Clients**:
    *   For **Client Components** (`'use client'`), use the client-side Supabase instance: `import { createClient } from '@/lib/supabase-client';`.
    *   For **Server Components** and **Server Actions**, use the server-side Supabase instance: `import { createClient } from '@/lib/supabase-server';`.
*   **Database Schema**: The single source of truth for the database schema is `src/db/schema.ts`. All table and column definitions must reside here.
*   **Data Types**: All data-related types (e.g., `UserProfile`, `Message`) MUST be imported from `src/lib/types.ts`. These types are automatically generated from the Drizzle schema and must not be defined manually.
*   **Database Queries**: For complex queries, prefer creating and using RPC functions in Supabase (e.g., `match_kings`, `get_conversations_with_details`) over complex client-side joins.
*   **Vector Search**: Embeddings are stored in the `profiles` table. Querying is done via the `match_kings` RPC function.

### 3. Generative AI (Genkit)
*   **AI Core**: The global Genkit instance is defined in `src/ai/genkit.ts`. All flows and tools must be defined using this instance.
*   **Flow Definition**: All AI logic must be encapsulated in Genkit flows within the `src/ai/flows/` directory. Each flow should have its own file (e.g., `src/ai/flows/onboarding-flow.ts`).
*   **Schema Enforcement**: All flow inputs and outputs MUST be strictly defined using Zod schemas. These schemas must be exported as types alongside the primary flow function.
*   **Server-Side Execution**: All Genkit flows are server-side logic. They must begin with the `'use server';` directive and are called from client components as Server Actions.

### 4. UI and Component Development
*   **Shadcn/UI First**: Always use a component from `src/components/ui/` if one exists for the required purpose.
*   **Custom Components**: Create new, reusable components within `src/components/`. Do not create one-off components inside page files.
*   **Styling**: Style exclusively with Tailwind CSS utility classes. Do not use CSS-in-JS, CSS Modules, or plain `.css` files for component-specific styles. Global styles are defined in `src/app/globals.css`.
*   **Icons**: All icons must be imported from `lucide-react` (e.g., `import { Crown } from 'lucide-react'`). Do not use any other icon libraries or inline SVGs unless absolutely necessary for a custom logo.

### 5. Authentication and Authorization
*   **Auth Provider**: User authentication is handled exclusively by Supabase Auth.
*   **User State**: In client components, access the current user's state using the `useUser()` hook from `src/hooks/use-user.tsx`.
*   **Protected Routes**: The `AuthGuard` in `src/components/app-layout.tsx` handles route protection. Unauthenticated users are automatically redirected to `/login`. Onboarding is enforced via a redirect to `/onboarding`.
