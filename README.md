# Find Your King

A Next.js application that allows users to find and book virtual "Kings" for online companionship.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework for production.
- [Supabase](https://supabase.com/) - Open source Firebase alternative for database, auth, and storage.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
- [Stripe](https://stripe.com/) - Online payment processing for internet businesses.
- [Ollama](https://ollama.com/) - Run large language models locally.
- [Jest](https://jestjs.io/) - A delightful JavaScript Testing Framework with a focus on simplicity.
- [Testing Library](https://testing-library.com/) - Simple and complete testing utilities that encourage good testing practices.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/findyourking-reborn.git
cd findyourking-reborn
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project and add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

OLLAMA_BASE_URL=http://localhost:11434/api
OLLAMA_API_KEY=your-ollama-api-key (optional)

STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Set up the database

1.  Create a new project on [Supabase](https://supabase.com/).
2.  In your Supabase project, go to the "SQL Editor" and run the SQL scripts in the `database` directory in the following order:
    1.  `01_initial_schema.sql`
    2.  `02_add_messages_table.sql`
    3.  `03_add_stripe_to_bookings.sql`

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running Tests

To run the tests, use the following command:

```bash
pnpm test
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.