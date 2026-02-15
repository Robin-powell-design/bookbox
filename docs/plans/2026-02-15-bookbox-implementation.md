# BookBox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a white-label fitness booking SaaS where trainers/clubs get branded subdomains, members book classes, purchase packages, and message coaches.

**Architecture:** Next.js 14 App Router monolith with Prisma ORM over PostgreSQL (Neon). Multi-tenant via organizationId scoping. Stripe Connect for payments. CSS custom properties for per-org theming.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL (Neon), NextAuth.js, Stripe Connect, Lucide React

---

## Phase 1: Project Scaffolding & Database

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, etc. (via CLI)
- Create: `.gitignore`
- Create: `.env.local`

**Step 1: Create Next.js app**

Run:
```bash
cd /Users/robinpowell/bookbox
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. Use `--use-npm` for consistency.

**Step 2: Verify it runs**

Run: `npm run dev`
Expected: App running at http://localhost:3000

**Step 3: Install core dependencies**

Run:
```bash
npm install prisma @prisma/client next-auth @auth/prisma-adapter stripe lucide-react date-fns zod bcryptjs
npm install -D @types/bcryptjs prisma
```

**Step 4: Create .env.local**

Create `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bookbox?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-here"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Note: Actual values will be filled when Neon DB and Stripe accounts are set up.

**Step 5: Add .env.local to .gitignore (verify it's there)**

Check `.gitignore` includes `.env*.local`. Next.js adds this by default.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with dependencies"
```

---

### Task 2: Set Up Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: Initialize Prisma**

Run:
```bash
npx prisma init
```

**Step 2: Write the complete schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  ADMIN
  INSTRUCTOR
  MEMBER
}

enum MembershipStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  WAITLISTED
}

enum ClassStatus {
  SCHEDULED
  CANCELLED
}

enum PackageType {
  BUNDLE
  MONTHLY
}

enum PaymentType {
  SINGLE_CLASS
  PACKAGE
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  avatar        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  memberships   Membership[]
  bookings      Booking[]
  userPackages  UserPackage[]
  payments      Payment[]
  sentMessages  Message[]  @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  instructorTemplates ClassTemplate[] @relation("Instructor")
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Organization {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  description     String?
  logo            String?
  primaryColor    String   @default("#0F172A")
  secondaryColor  String   @default("#334155")
  accentColor     String   @default("#0369A1")
  stripeAccountId String?
  cancellationHours Int    @default(2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  memberships     Membership[]
  classTemplates  ClassTemplate[]
  classInstances  ClassInstance[]
  packages        Package[]
  payments        Payment[]
  messages        Message[]
  categories      Category[]
}

model Membership {
  id        String           @id @default(cuid())
  userId    String
  orgId     String
  role      Role             @default(MEMBER)
  status    MembershipStatus @default(ACTIVE)
  joinedAt  DateTime         @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
}

model Category {
  id    String @id @default(cuid())
  name  String
  orgId String

  organization   Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  classTemplates ClassTemplate[]

  @@unique([name, orgId])
}

model ClassTemplate {
  id           String  @id @default(cuid())
  orgId        String
  name         String
  description  String?
  instructorId String
  dayOfWeek    Int?          // 0=Sunday, 6=Saturday. Null for one-off
  time         String        // "18:00" format
  duration     Int           // minutes
  capacity     Int
  price        Int           // in cents
  isRecurring  Boolean       @default(true)
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  organization Organization   @relation(fields: [orgId], references: [id], onDelete: Cascade)
  instructor   User           @relation("Instructor", fields: [instructorId], references: [id])
  instances    ClassInstance[]
  categories   Category[]
}

model ClassInstance {
  id         String      @id @default(cuid())
  templateId String
  orgId      String
  date       DateTime    // the specific date of this class
  time       String      // "18:00" format
  capacity   Int
  status     ClassStatus @default(SCHEDULED)
  createdAt  DateTime    @default(now())

  template     ClassTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  organization Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  bookings     Booking[]
}

model Booking {
  id              String        @id @default(cuid())
  userId          String
  classInstanceId String
  status          BookingStatus @default(CONFIRMED)
  paymentId       String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  classInstance ClassInstance  @relation(fields: [classInstanceId], references: [id], onDelete: Cascade)
  payment       Payment?      @relation(fields: [paymentId], references: [id])

  @@unique([userId, classInstanceId])
}

model Package {
  id          String      @id @default(cuid())
  orgId       String
  name        String
  description String?
  price       Int         // in cents
  classCount  Int?        // null for unlimited (monthly)
  durationDays Int?       // validity period
  type        PackageType
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  organization Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  userPackages UserPackage[]
}

model UserPackage {
  id               String   @id @default(cuid())
  userId           String
  packageId        String
  remainingClasses Int?
  expiresAt        DateTime?
  purchasedAt      DateTime @default(now())
  paymentId        String?  @unique

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  package Package @relation(fields: [packageId], references: [id], onDelete: Cascade)
  payment Payment? @relation(fields: [paymentId], references: [id])
}

model Payment {
  id              String        @id @default(cuid())
  userId          String
  orgId           String
  amount          Int           // in cents
  stripePaymentId String?       @unique
  type            PaymentType
  status          PaymentStatus @default(PENDING)
  createdAt       DateTime      @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  bookings     Booking[]
  userPackage  UserPackage?
}

model Message {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  orgId      String
  subject    String
  body       String
  read       Boolean  @default(false)
  createdAt  DateTime @default(now())

  sender       User         @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiver     User         @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
}
```

**Step 3: Generate Prisma client**

Run: `npx prisma generate`
Expected: Prisma Client generated successfully.

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add complete Prisma schema for BookBox"
```

---

### Task 3: Set Up Database & Prisma Client Singleton

**Files:**
- Create: `src/lib/prisma.ts`

**Step 1: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 2: Set up Neon database**

Option A: Use Neon (recommended for production-ready):
1. Go to https://neon.tech, create a free project called "bookbox"
2. Copy the connection string into `.env.local` as `DATABASE_URL`

Option B: Use local PostgreSQL for dev:
```bash
# If you have Docker:
docker run --name bookbox-db -e POSTGRES_PASSWORD=bookbox -e POSTGRES_DB=bookbox -p 5432:5432 -d postgres:16
```
Then set `DATABASE_URL="postgresql://postgres:bookbox@localhost:5432/bookbox?schema=public"`

**Step 3: Run initial migration**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: Migration applied, tables created.

**Step 4: Verify with Prisma Studio**

Run: `npx prisma studio`
Expected: Opens browser at localhost:5555 showing all tables.

**Step 5: Commit**

```bash
git add src/lib/prisma.ts prisma/migrations/
git commit -m "feat: add Prisma client singleton and initial migration"
```

---

### Task 4: Set Up NextAuth.js Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

**Step 1: Create auth config**

Create `src/lib/auth.ts`:
```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signUp: "/signup",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
```

**Step 2: Create auth API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**Step 3: Create auth types**

Create `src/types/next-auth.d.ts`:
```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

**Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/types/
git commit -m "feat: set up NextAuth.js with credentials provider"
```

---

### Task 5: Create Sign Up API Route

**Files:**
- Create: `src/app/api/auth/signup/route.ts`
- Create: `src/lib/validations.ts`

**Step 1: Create Zod validations**

Create `src/lib/validations.ts`:
```typescript
import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgSlug: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
});

export const classTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  duration: z.number().min(15).max(480),
  capacity: z.number().min(1).max(100),
  price: z.number().min(0),
  isRecurring: z.boolean(),
  categoryIds: z.array(z.string()).optional(),
});

export const packageSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  classCount: z.number().min(1).nullable(),
  durationDays: z.number().min(1).nullable(),
  type: z.enum(["BUNDLE", "MONTHLY"]),
});

export const messageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});
```

**Step 2: Create sign up route**

Create `src/app/api/auth/signup/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, orgSlug } = signUpSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // If signing up via an org link, create membership
    if (orgSlug) {
      const org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });

      if (org) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            orgId: org.id,
            role: "MEMBER",
          },
        });
      }
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/validations.ts src/app/api/auth/signup/
git commit -m "feat: add sign up API with Zod validation"
```

---

### Task 6: Set Up Tailwind Theme & Layout

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Create: `src/app/layout.tsx` (modify existing)
- Create: `src/components/providers.tsx`

**Step 1: Update Tailwind config for theming**

Replace `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Update globals.css**

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --color-primary: #0F172A;
  --color-secondary: #334155;
  --color-accent: #0369A1;
  --color-background: #F8FAFC;
  --color-foreground: #020617;
  --font-heading: "Barlow Condensed", sans-serif;
  --font-body: "Barlow", sans-serif;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-background);
  color: var(--color-foreground);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

**Step 3: Create SessionProvider wrapper**

Create `src/components/providers.tsx`:
```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Step 4: Update root layout**

Replace `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "BookBox",
  description: "Book fitness classes with your trainer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 5: Commit**

```bash
git add tailwind.config.ts src/app/globals.css src/app/layout.tsx src/components/providers.tsx
git commit -m "feat: set up Tailwind theming, fonts, and session provider"
```

---

## Phase 2: Auth Pages & Org Setup

### Task 7: Create Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/button.tsx`

**Step 1: Create reusable Input component**

Create `src/components/ui/input.tsx`:
```typescript
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-secondary">
          {label}
        </label>
        <input
          ref={ref}
          className={`w-full rounded-lg border border-gray-300 px-4 py-2.5 text-foreground placeholder-gray-400 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
```

**Step 2: Create reusable Button component**

Create `src/components/ui/button.tsx`:
```typescript
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent/90",
    secondary: "bg-secondary text-white hover:bg-secondary/90",
    outline: "border-2 border-accent text-accent hover:bg-accent/5",
    ghost: "text-secondary hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3 text-lg",
  };

  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
```

**Step 3: Create Login page**

Create `src/app/(auth)/login/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-primary">
            Welcome back
          </h1>
          <p className="mt-2 text-secondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/ui/ src/app/\(auth\)/
git commit -m "feat: add login page with reusable UI components"
```

---

### Task 8: Create Sign Up Page

**Files:**
- Create: `src/app/(auth)/signup/page.tsx`

**Step 1: Create Sign Up page**

Create `src/app/(auth)/signup/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, orgSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Sign up failed");
        setLoading(false);
        return;
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-primary">
            Create your account
          </h1>
          <p className="mt-2 text-secondary">
            {orgSlug
              ? "Join and start booking classes"
              : "Get started with BookBox"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(auth\)/signup/
git commit -m "feat: add sign up page with org link support"
```

---

### Task 9: Create Organization Setup Flow

**Files:**
- Create: `src/app/api/organizations/route.ts`
- Create: `src/app/(dashboard)/setup/page.tsx`

**Step 1: Create org API route**

Create `src/app/api/organizations/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrgSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createOrgSchema.parse(body);

    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "This URL is already taken" },
        { status: 409 }
      );
    }

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        memberships: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Create org setup page**

Create `src/app/(dashboard)/setup/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to create organization");
        setLoading(false);
        return;
      }

      router.push(`/admin`);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-primary">
            Set up your organization
          </h1>
          <p className="mt-2 text-secondary">
            Create your branded booking page for clients
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Organization name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Mike's Boxing Gym"
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary">
              Your booking URL
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50">
              <span className="px-3 text-sm text-gray-500">bookbox.app/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 rounded-r-lg border-0 bg-transparent px-2 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="mikes-boxing"
                required
              />
            </div>
          </div>

          <Input
            label="Description (optional)"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Professional boxing and fitness classes"
          />

          <Button type="submit" loading={loading} className="w-full">
            Create organization
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/api/organizations/ src/app/\(dashboard\)/setup/
git commit -m "feat: add organization creation flow"
```

---

## Phase 3: Admin Dashboard & Class Management

### Task 10: Create Admin Layout & Dashboard

**Files:**
- Create: `src/app/(dashboard)/admin/layout.tsx`
- Create: `src/app/(dashboard)/admin/page.tsx`
- Create: `src/components/admin/sidebar.tsx`
- Create: `src/lib/get-user-org.ts`

**Step 1: Create helper to get current user's org**

Create `src/lib/get-user-org.ts`:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getUserOrg() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN", "INSTRUCTOR"] },
      status: "ACTIVE",
    },
    include: {
      organization: true,
    },
  });

  if (!membership) return null;

  return {
    user: session.user,
    membership,
    organization: membership.organization,
  };
}
```

**Step 2: Create admin sidebar**

Create `src/components/admin/sidebar.tsx`:
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Package,
  Users,
  MessageSquare,
  CreditCard,
  Palette,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/classes", label: "Classes", icon: Calendar },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/branding", label: "Branding", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <h2 className="font-heading text-xl font-bold text-primary">
          {orgName}
        </h2>
        <p className="text-xs text-secondary">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-secondary hover:bg-gray-100 hover:text-primary"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 3: Create admin layout**

Create `src/app/(dashboard)/admin/layout.tsx`:
```typescript
import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getUserOrg();

  if (!context) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN"].includes(context.membership.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar orgName={context.organization.name} />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 4: Create admin dashboard page**

Create `src/app/(dashboard)/admin/page.tsx`:
```typescript
import { redirect } from "next/navigation";
import { getUserOrg } from "@/lib/get-user-org";
import { prisma } from "@/lib/prisma";
import { Users, Calendar, CreditCard, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
  const context = await getUserOrg();
  if (!context) redirect("/login");

  const orgId = context.organization.id;

  const [memberCount, upcomingClasses, recentBookings, recentMembers] =
    await Promise.all([
      prisma.membership.count({
        where: { orgId, role: "MEMBER", status: "ACTIVE" },
      }),
      prisma.classInstance.count({
        where: {
          orgId,
          date: { gte: new Date() },
          status: "SCHEDULED",
        },
      }),
      prisma.booking.count({
        where: {
          classInstance: { orgId },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.membership.findMany({
        where: { orgId, role: "MEMBER" },
        include: { user: true },
        orderBy: { joinedAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "Active Members", value: memberCount, icon: Users },
    { label: "Upcoming Classes", value: upcomingClasses, icon: Calendar },
    { label: "Bookings (7d)", value: recentBookings, icon: CreditCard },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-primary">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-secondary">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold text-primary">
          Recent Members
        </h2>
        {recentMembers.length === 0 ? (
          <p className="text-sm text-secondary">No members yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-primary">{m.user.name}</p>
                  <p className="text-sm text-secondary">{m.user.email}</p>
                </div>
                <span className="text-xs text-secondary">
                  {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/lib/get-user-org.ts src/components/admin/ src/app/\(dashboard\)/admin/
git commit -m "feat: add admin layout, sidebar, and dashboard"
```

---

### Task 11: Class Management CRUD

**Files:**
- Create: `src/app/api/organizations/[orgId]/classes/route.ts`
- Create: `src/app/(dashboard)/admin/classes/page.tsx`
- Create: `src/app/(dashboard)/admin/classes/new/page.tsx`

This task creates the API for creating/listing class templates and the admin pages for managing them. The API handles both recurring templates and one-off classes.

Implementation follows the same patterns established in Tasks 9 and 10 — form + API route + Zod validation. See `classTemplateSchema` in `src/lib/validations.ts`.

**Commit message:** `feat: add class management CRUD for admin`

---

### Task 12: Package Management CRUD

**Files:**
- Create: `src/app/api/organizations/[orgId]/packages/route.ts`
- Create: `src/app/(dashboard)/admin/packages/page.tsx`
- Create: `src/app/(dashboard)/admin/packages/new/page.tsx`

Same pattern as Task 11 but for packages/bundles. Uses `packageSchema` from validations.

**Commit message:** `feat: add package management CRUD for admin`

---

### Task 13: Admin Branding Page

**Files:**
- Create: `src/app/api/organizations/[orgId]/branding/route.ts`
- Create: `src/app/(dashboard)/admin/branding/page.tsx`

Owner can set primary/secondary/accent colors, upload logo, and preview changes live. The API stores colors on the Organization model. When clients visit the org's page, the CSS custom properties are injected based on the org's stored theme.

**Commit message:** `feat: add branding customization page`

---

## Phase 4: Client-Side Booking Experience

### Task 14: Org Landing Page (White-Label)

**Files:**
- Create: `src/app/[orgSlug]/page.tsx`
- Create: `src/app/[orgSlug]/layout.tsx`
- Create: `src/components/org/navbar.tsx`
- Create: `src/components/org/theme-injector.tsx`

The `[orgSlug]` dynamic route fetches the org by slug, injects its theme colors as CSS variables, shows the org's logo and upcoming classes. This is the white-label entry point.

**Commit message:** `feat: add white-label org landing page with theme injection`

---

### Task 15: Class Calendar View

**Files:**
- Create: `src/app/[orgSlug]/classes/page.tsx`
- Create: `src/components/calendar/week-view.tsx`
- Create: `src/components/calendar/class-card.tsx`

Week/month calendar showing class instances with time, instructor, spots remaining. Click to view details and book. Filter by category.

**Commit message:** `feat: add class calendar view for clients`

---

### Task 16: Booking Flow

**Files:**
- Create: `src/app/api/bookings/route.ts`
- Create: `src/app/[orgSlug]/classes/[instanceId]/page.tsx`

Class detail page with book button. API creates booking, checks capacity, handles waitlist. If user has a valid package, deducts a class from it. Otherwise, initiates Stripe payment.

**Commit message:** `feat: add class booking flow with capacity management`

---

### Task 17: Stripe Connect Integration

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/stripe/connect/route.ts`
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`

Set up Stripe Connect so org owners can connect their Stripe account. Checkout sessions for single class purchases and package purchases. Webhook handler for payment confirmations.

**Commit message:** `feat: add Stripe Connect payments`

---

### Task 18: My Bookings & Cancellation

**Files:**
- Create: `src/app/[orgSlug]/bookings/page.tsx`
- Create: `src/app/api/bookings/[bookingId]/cancel/route.ts`

List of upcoming and past bookings. Cancel button respects org's cancellation policy (hours before class). Cancellation frees the spot and notifies waitlisted members.

**Commit message:** `feat: add my bookings page with cancellation`

---

### Task 19: Packages Page & Purchase

**Files:**
- Create: `src/app/[orgSlug]/packages/page.tsx`

Display available packages/bundles for the org. Purchase flow creates Stripe checkout session. On success, creates UserPackage record.

**Commit message:** `feat: add packages page with purchase flow`

---

## Phase 5: Messaging & Profile

### Task 20: Simple Messaging System

**Files:**
- Create: `src/app/api/messages/route.ts`
- Create: `src/app/[orgSlug]/messages/page.tsx`
- Create: `src/app/(dashboard)/admin/messages/page.tsx`

Client inbox: list messages, compose new message to coach. Admin inbox: list messages from members, reply. Uses `messageSchema` from validations.

**Commit message:** `feat: add simple messaging system`

---

### Task 21: User Profile Page

**Files:**
- Create: `src/app/[orgSlug]/profile/page.tsx`
- Create: `src/app/api/users/me/route.ts`

Edit name, avatar. View payment history and active packages. Shows membership info.

**Commit message:** `feat: add user profile page`

---

## Phase 6: GitHub & Deployment

### Task 22: Create GitHub Repo & Push

**Step 1: Create GitHub repo**

Run:
```bash
gh repo create bookbox --public --source=. --remote=origin --push
```

**Step 2: Set up branch protection**

The main branch is for stable code. Feature work on branches.

**Step 3: Verify remote**

Run: `git remote -v`
Expected: origin pointing to github.com

**Commit message:** N/A (repo setup)

---

### Task 23: Set Up Vercel Deployment

Connect the GitHub repo to Vercel for automatic deployments. Set environment variables in Vercel dashboard. Preview deployments on PRs, production on main.

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1-6 | Project setup, DB schema, auth, theming |
| 2 | 7-9 | Auth pages, org creation |
| 3 | 10-13 | Admin dashboard, class/package CRUD, branding |
| 4 | 14-19 | Client booking experience, calendar, Stripe |
| 5 | 20-21 | Messaging, profile |
| 6 | 22-23 | GitHub repo, Vercel deployment |

Total: 23 tasks across 6 phases. Phase 1-2 are fully detailed. Phase 3-6 follow the same patterns and reference earlier implementations.
