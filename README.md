# Cabinet Samet – Client Portal for an Accounting Firm

A web platform that digitises the client side of a small accounting firm. Clients upload their invoices and documents, follow their processing status and exchange messages with the firm. Accountants manage clients, documents and access in a separate admin area.

The project has two parts that share this backend:

- **Web app** (this repository): Next.js frontend, API routes and admin area
- **Mobile app**: [cabinet-samet-app](https://github.com/mohamedalikhbou45-star/cabinet-samet-app), React Native (Expo)

![CI](https://github.com/mohamedalikhbou45-star/cabinet-samet/actions/workflows/ci.yml/badge.svg)

## Features

**For clients**
- Registration and login with email two-factor authentication
- Document upload (drag and drop) with types and processing status
- Dashboard with weekly statistics and a history of all documents
- Messages from the firm and a help chatbot for common questions

**For the firm (admin area)**
- Client management: activate or block accounts, reset passwords
- Document management: change status, add notes, download files
- Messaging to clients, and push notifications when a document's status changes
- Overview of locked accounts after failed login attempts

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API routes, NextAuth, Zod validation |
| Database | PostgreSQL on Supabase, Prisma ORM |
| File storage | Supabase Storage |
| Email | Resend |
| Mobile API | Bearer-token routes under `/api/mobile`, Expo push notifications |

## Security

- Two-factor authentication by email code (valid for 10 minutes), on web and mobile
- Progressive lockout after failed logins (1, 5, then 15 minutes); after 5 failures the account stays blocked until an admin unlocks it
- Automatic logout after 30 minutes of inactivity, with a warning beforehand
- Passwords hashed with bcrypt; registration input validated with Zod
- Row-Level Security enabled on every Supabase table, so the public Supabase API exposes no data; all access goes through the server ([prisma/rls_lockdown.sql](prisma/rls_lockdown.sql))
- All secrets in environment variables; see [.env.example](.env.example)

## Status

This is a working prototype, built on my own initiative for a family business. The chatbot currently answers from a set of predefined responses; connecting it to the Claude API is the next step.

## Run locally

```bash
cp .env.example .env      # fill in your own values
npm install
npx prisma db push        # create the tables
npm run seed:admin        # create the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

The app runs on http://localhost:3000, the admin area on `/admin/login`.

## Continuous integration

Every push runs a GitHub Actions workflow that installs the dependencies, generates the Prisma client, type-checks the code and builds the app.

## About

Built by Mohamed Ali Khbou, Computational Engineering Science student at TU Berlin. Developed with AI coding agents (Claude Code), with the architecture, review and testing done by me.
