# Clinic Queue System

A real-time patient queue management system for clinics — letting reception staff register patients, doctors call the next patient, and patients check their own status on a self-service kiosk or display board.

> Live: https://clinic-queue-system-theta.vercel.app

---

## Features

### Admin
- Manage user accounts (create, activate/deactivate staff and doctors)
- View system-wide queue statistics

### Reception
- Register patients into the queue (name, phone number, preferred doctor)
- View and filter the full queue by date and doctor
- Manually update queue entry status

### Doctor
- See their own patient queue filtered by assignment
- Call the next patient with one click (previous patient is automatically marked done)
- Patient is notified via SMS when called (optional Twilio integration)

### Patient (Kiosk / Self-service)
- Register into the queue at the kiosk without logging in
- Look up queue position and status by phone number
- View the live display board (TV screen) showing currently called patients

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Auth | Custom session auth — httpOnly cookies, bcrypt password hashing |
| Validation | Zod |
| UI | Tailwind CSS v4, shadcn/ui, Sonner toasts |
| SMS | Twilio (optional) |
| Deployment | Vercel |

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/clinic-queue-system.git
cd clinic-queue-system

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env
# Edit .env — see the Environment Variables section below

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed default accounts
npm run seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Dev Accounts

These accounts are created by `npm run seed`. Change passwords before going to production.

| Role | Email | Password |
|---|---|---|
| Admin | admin@clinic.com | admin123 |
| Reception | reception@clinic.com | reception123 |
| Doctor (Dr. Ali Hassan) | dr.ali@clinic.com | doctor123 |
| Doctor (Dr. Siti Rahimah) | dr.siti@clinic.com | doctor123 |

---

## Deployment

The application is designed to be deployed on **Vercel** with **Supabase** as the PostgreSQL host.

1. Create a Supabase project and obtain the connection strings (pooled `DATABASE_URL` and direct `DIRECT_URL`).
2. Push the schema: `npx prisma migrate deploy`
3. Run the seed on the remote database if needed.
4. Create a new Vercel project, link the repository, and add the environment variables listed below.
5. Vercel builds and deploys automatically on every push to `main`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase pooled connection string (used by Prisma at runtime) |
| `DIRECT_URL` | Yes | Supabase direct connection string (used for migrations) |
| `NEXTAUTH_SECRET` | Yes | Random secret used to sign session tokens (generate with `openssl rand -hex 32`) |
| `NEXTAUTH_URL` | Yes | The canonical URL of the deployment, e.g. `https://your-app.vercel.app` |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID — enables SMS notifications when patients are called |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Your Twilio sender phone number in E.164 format, e.g. `+601XXXXXXXX` |

---

## CI

`.github/workflows/supabase-keepalive.yml` pings the database daily so the Supabase free-tier project doesn't auto-pause after 7 days of inactivity. Add `DATABASE_URL` as a **GitHub Actions repo secret** (Settings → Secrets and variables → Actions) — separate from the Vercel environment variables above, since Actions can't read those.
