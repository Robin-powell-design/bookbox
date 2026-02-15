# BookBox - Design Document

**Date:** 2026-02-15
**Status:** Approved

## Overview

BookBox is a white-label SaaS platform for personal trainers, fitness class instructors, and martial arts clubs. Each organization (trainer/club) gets a branded experience with custom subdomain, colors, and logo. Members sign up via the org's unique link and can browse classes, book sessions, purchase packages, and message their coach.

## Target Audience

**MVP:** Solo personal trainers and small studios (1-5 instructors, 50-200 clients).
**Future:** Mid-size gyms and martial arts schools (5-20 instructors, 200-1000 members).

## Architecture

Multi-tenant SaaS with tenant isolation via `organizationId` on every record.

```
Client Browser
    |
Next.js 14 (App Router) - SSR + API Routes
    |
Prisma ORM
    |
PostgreSQL (Neon serverless)
    |
Stripe Connect (payments)
```

### Key Decisions

- **Tenant isolation:** All records scoped by `organizationId`. Single database, no per-tenant DBs.
- **Subdomain routing:** `coach-mike.bookbox.app` resolves to that org's branded experience.
- **Role-based access:** `OWNER`, `ADMIN`, `INSTRUCTOR`, `MEMBER` roles per organization.
- **API routes in Next.js:** No separate backend service for MVP.
- **White-label theming:** CSS custom properties per org, set via admin panel.

## Data Model

### Core Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| User | Auth account | email, passwordHash, name, avatar |
| Organization | Tenant (trainer/club) | name, slug, logo, themeColors, stripeAccountId |
| Membership | User-to-org link with role | userId, orgId, role, status |
| ClassTemplate | Recurring class definition | orgId, name, description, instructorId, dayOfWeek, time, duration, capacity, price |
| ClassInstance | Single class occurrence | templateId, date, time, capacity, status |
| Booking | Member reservation | memberId, classInstanceId, status, paymentId |
| Package | Bundle/subscription | orgId, name, description, price, classCount, duration, type |
| UserPackage | Purchased package | userId, packageId, remainingClasses, expiresAt |
| Payment | Stripe payment record | userId, orgId, amount, stripePaymentId, type |
| Message | Inbox message | senderId, receiverId, orgId, subject, body, read, createdAt |

### Additional Features

- **Waitlist:** Auto-notify when spot opens from cancellation.
- **Cancellation policy:** Configurable per org (e.g., 2 hours before class).
- **Class tags/categories:** Filter by "Beginner", "Advanced", "Boxing", etc.
- **Attendance tracking:** Instructor marks who showed up; ties into package usage.

## Client-Side Pages

| Page | Description |
|------|-------------|
| Landing / Home | Org-branded page with upcoming classes, about section |
| Sign Up / Login | Email + password auth via org's unique link |
| Class Calendar | Weekly/monthly view with category/instructor filters |
| Class Detail | Description, instructor, time, spots remaining, book/cancel |
| My Bookings | Upcoming and past bookings with cancel option |
| Packages | Available bundles/monthly plans with purchase |
| Messages | Simple inbox to message coach |
| Profile | Edit info, view payment history |

## Admin/Owner Pages

| Page | Description |
|------|-------------|
| Dashboard | New members, upcoming classes, bookings, revenue overview |
| Branding | Upload logo, set colors, preview theme |
| Class Management | Create/edit recurring templates and one-off classes |
| Packages | Create/edit bundles and monthly subscriptions |
| Members | View all members, booking history, packages |
| Messages | Reply to member messages |
| Payments / Stripe | Connect Stripe, view transactions, revenue |
| Settings | Cancellation policy, org details, invite link |

## Design System

- **Style:** Flat Design - clean, fast, accessible (WCAG AAA target)
- **Typography:** Barlow Condensed (headings) / Barlow (body)
- **Default Colors:** Primary `#0F172A`, CTA `#0369A1`, Background `#F8FAFC`, Text `#020617`
- **Theming:** Per-org customizable via CSS custom properties
- **Icons:** Lucide React
- **Transitions:** 150-200ms ease, no layout-shifting hover effects

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + CSS custom properties |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma |
| Auth | NextAuth.js (credentials + optional social) |
| Payments | Stripe Connect |
| Icons | Lucide React |
| Fonts | Barlow Condensed + Barlow (Google Fonts) |
| Deployment | Vercel |

## Messaging

Simple in-app inbox. DB-backed, not real-time. Members can message their coach, coach replies from admin panel. No typing indicators or read receipts for MVP.

## Payments

Stripe Connect with each org connecting their own Stripe account. BookBox can take a platform fee per transaction. Supports single class purchases and package/bundle purchases.

## Scheduling

- **Recurring templates:** Coach sets weekly schedule (e.g., "Boxing Mon 6pm").
- **One-off classes:** Workshops or special events on specific dates.
- **Instance management:** Cancel/modify individual occurrences without affecting the template.
- **Capacity management:** Max attendees per class with waitlist support.

## Future Scope (Not MVP)

- Shop (digital + physical products)
- Real-time chat with WebSockets
- Native mobile apps (React Native)
- Marketplace/directory for discovering trainers
- Multi-location support
- Automated email notifications (class reminders, waitlist alerts)
- Reviews/ratings for instructors
