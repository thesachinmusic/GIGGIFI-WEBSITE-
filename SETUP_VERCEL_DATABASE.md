# GiggiFi Setup Guide

This project is now using:
- `Prisma` for database access
- `PostgreSQL` as the real shared database
- `NextAuth` for login/session
- `Google` login
- `Twilio Verify` for OTP login

All end-user data will go into one database through Prisma once `DATABASE_URL` is connected.

## 1. Your Vercel project

Your linked Vercel project is:
- Project name: `giggifi-website`
- Team: `thesachinmusics-projects`

Useful links:
- Project dashboard:
  `https://vercel.com/thesachinmusics-projects/giggifi-website`
- Last successful deployment:
  `https://giggifi-website-c5zu3uei7-thesachinmusics-projects.vercel.app`
- Main Vercel domain to use for now:
  `https://giggifi-website-thesachinmusics-projects.vercel.app`

Use this URL for `NEXTAUTH_URL` in production:

```env
NEXTAUTH_URL="https://giggifi-website-thesachinmusics-projects.vercel.app"
```

## 2. Create the real database

Recommended easiest option: `Neon`

### Steps
1. Go to `https://neon.tech`
2. Create an account
3. Create a new project
4. Create a database
5. Copy the connection string

It will look similar to:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
```

That is the single shared database for all users.

## 3. Create local env file

In this project folder:

1. Copy `.env.example`
2. Create `.env.local`
3. Paste your real values

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-random-secret"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_VERIFY_SERVICE_SID=""

DEV_SHOW_OTP_PREVIEW="true"
```

## 4. Generate `NEXTAUTH_SECRET`

Run this in terminal:

```bash
openssl rand -base64 32
```

Copy the output and paste it into:

```env
NEXTAUTH_SECRET="paste-output-here"
```

## 5. Set environment variables in Vercel

Go to:

`Vercel Dashboard -> giggifi-website -> Settings -> Environment Variables`

Add these variables there:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Add them at least for:
- `Production`
- `Preview`

## 6. Create Google login credentials

Go to:

`https://console.cloud.google.com/`

### Steps
1. Create or select a project
2. Open `APIs & Services`
3. Open `Credentials`
4. Create `OAuth Client ID`
5. Choose `Web application`

### Add these URLs

Authorized JavaScript origins:

```text
http://localhost:3000
https://giggifi-website-thesachinmusics-projects.vercel.app
```

Authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://giggifi-website-thesachinmusics-projects.vercel.app/api/auth/callback/google
```

Then copy:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## 7. Create Twilio OTP credentials

Go to:

`https://console.twilio.com/`

### Steps
1. Create/login to Twilio account
2. Open `Verify`
3. Create a Verify Service
4. Copy:
   - `Account SID`
   - `Auth Token`
   - `Verify Service SID`

Then use them for:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

## 8. Check env values locally

Run:

```bash
npm run check:env
```

If something is missing, it will list exactly what is missing.

## 9. Prepare the database

After `DATABASE_URL` is filled:

```bash
npm run prisma:generate
npx prisma migrate dev --name init_auth_cutover
npm run prisma:seed
```

This will:
- generate Prisma client
- create database tables
- import current demo/sample data into PostgreSQL

## 10. Run locally

```bash
npm run dev
```

Open:

`http://localhost:3000`

If your port changes, use that port for local testing.

## 11. Deploy to Vercel

Once env vars are added in Vercel and code is pushed to GitHub:

1. Push latest code
2. Vercel auto-deploys from GitHub
3. Open `Deployments` in Vercel
4. Check if it shows `READY`

## 12. What still needs your account

These values cannot be invented by code and must come from your own accounts:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Once you provide those, the app can use one real shared PostgreSQL database for all users through Prisma.
