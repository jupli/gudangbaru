This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Important: Environment Variables

When deploying to Vercel, you must set the following **Environment Variables** in your project settings:

1.  **DATABASE_URL**
    *   This is the connection string to your PostgreSQL database (e.g., Prisma Postgres, Vercel Postgres, or Supabase).
    *   Example: `postgres://user:password@host:port/database?sslmode=require`

2.  **AUTH_SECRET** (Optional but recommended)
    *   A random string used to sign JWT tokens for authentication.
    *   If not set, the app will use a fallback secret (not secure for production).

Without `DATABASE_URL`, the application will fail to build or run.

### Database Setup

1.  Set `DATABASE_URL` in Vercel Environment Variables.
2.  Redeploy your project.
3.  Once deployed, visit `/api/setup-admin` to create the initial admin user if the database is empty.
