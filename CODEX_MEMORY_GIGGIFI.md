# CLAUDE.md / CODEX_MEMORY.md
## Project: GIGGIFI Website
## Owner: Sachin / thesachinmusic
## Last updated: 2026-04-20

This file is a working memory dump for Codex or any coding agent so it can continue the project without losing context.

---

# 0) Current Handoff Snapshot

## Latest important commit
- Current local `HEAD`: `ef0250a`
- Latest pushed auth fix commit:
  `Fix Google auth redirect and onboarding routing`
- Previous important production recovery commit:
  `Remove auth schema dependency from runtime`

## Current backend/auth state
- The project is no longer using the live JSON mock flow as the main auth/data path.
- Auth is now based on `NextAuth` + `Prisma` + PostgreSQL.
- OTP flow was refactored to use Twilio Verify native OTP generation and verification.
- The old Twilio `customCode` flow was removed because it caused:
  `Custom code not allowed`
- Login UI was also fixed so OTP is not verified twice anymore.
- Google login and OTP login are now treated as authentication methods only, not role selectors.
- New enforced rule implemented in code:
  every authenticated user must have both `phone` and `email` before reaching role selection.
- New shared routing behavior now exists:
  - login
  - mandatory contact completion
  - role choice
  - role-specific onboarding or dashboard
- New contact completion flow was added:
  - Google login without phone -> collect phone + OTP verify
  - OTP login without email -> collect email
- Base authenticated `User` remains separate from `ArtistProfile` and `BookerProfile`.
- Role selection now calls a real API and routes correctly:
  - existing/completed artist -> artist dashboard
  - incomplete/new artist -> artist onboarding
  - existing/completed booker -> booker dashboard
  - incomplete/new booker -> booker onboarding

## Current database state
- Prisma is connected to one shared PostgreSQL database.
- Seed/import was already run previously and the real DB contains starter users, artists, bookers, bookings, and payments.
- All future real end-user data should go into this shared DB through Prisma.
- Important production note:
  a temporary schema change adding `User.lastAuthProvider` was pushed and caused a production runtime failure because the live DB schema did not have that column yet.
- That schema-dependent change was rolled back in commit `8264631` so production works again without requiring an immediate migration.

## Current Vercel state
- Project: `giggifi-website`
- Team: `thesachinmusics-projects`
- Production deploys are coming from GitHub branch `main`
- Current latest production recovery deployment:
  - commit `8264631`
  - deployment id `dpl_5qnTNZGcALrsqEmASjgNTLsZSaom`
- The previously broken deployment was:
  - commit `e91a3ef`
  - deployment id `dpl_5fxnU4tNtTZ8hRiTsYf6XJBZvTWz`
- Fresh Vercel runtime evidence after recovery:
  - `GET /` returned `200`
  - Prisma `500` errors stopped after the recovery deployment became ready

## Current live domains observed on Vercel
- `https://giggifi.com`
- `https://www.giggifi.com`
- `https://giggifi-website.vercel.app`
- `https://giggifi-website-thesachinmusics-projects.vercel.app`
- `https://giggifi-website-git-main-thesachinmusics-projects.vercel.app`

## Current auth issues remaining

### Google login
- Website-side auth routing and first-pass callback handling were updated again on 2026-04-20.
- `NextAuth` now routes auth failures back to `/login` instead of exposing `/api/auth/error` as the user-facing page.
- Login UI now maps additional Google auth errors like:
  `OAuthSignin`, `OAuthCallback`, `Configuration`, `AccessDenied`, `Signin`
- A real callback crash was found and fixed:
  `Invalid prisma.user.update() invocation ... No record was found for an update`
- Root cause:
  `callbacks.signIn` was trying to update Prisma user data before first-time Google users were safely resolved to a DB `User.id`
- Fix applied:
  moved the post-login Prisma update from `callbacks.signIn` to `events.signIn`
  and changed the write to a safer `updateMany`
- Main remaining issue is now Google OAuth configuration / final production validation, not the core website routing logic.
- Google login must be tested only on a stable public domain, not on random temporary deployment URLs.
- The observed sequence on the website was:
  - click `Continue with Google`
  - choose Google account
  - first saw `/api/auth/error` with raw Prisma update failure
  - after code fix, saw Google-hosted `Error 400: redirect_uri_mismatch`
- This confirms the remaining blocker is Google Cloud OAuth client configuration.
- Full end-to-end Google sign-in on the real domain still needs manual click testing after Google Cloud settings are corrected.

### OTP login
- OTP now works technically through Twilio Verify for numbers allowed by the Twilio account.
- If OTP works only for the owner’s own verified number and not for public numbers, that means the Twilio account is still on `trial`.
- Twilio trial accounts can only send SMS to numbers manually verified inside Twilio.
- Public OTP for all users requires upgrading the Twilio account from trial to paid.

## Required Google OAuth setup

### Stable public domain choice
- Prefer:
  `https://giggifi.com`

### Vercel env var expectation
- `NEXTAUTH_URL` should be:
  `https://giggifi.com`
- Local `.env.local` had a malformed `NEXTAUTH_URL` entry on 2026-04-20 and was corrected to:
  `https://giggifi.com`

### Google OAuth authorized JavaScript origins
- `https://giggifi.com`
- `https://www.giggifi.com`
- `https://giggifi-website.vercel.app`
- `https://giggifi-website-thesachinmusics-projects.vercel.app`
- `http://localhost:3000`

### Google OAuth authorized redirect URIs
- `https://giggifi.com/api/auth/callback/google`
- `https://www.giggifi.com/api/auth/callback/google`
- `https://giggifi-website.vercel.app/api/auth/callback/google`
- `https://giggifi-website-thesachinmusics-projects.vercel.app/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

## Required Twilio production note
- Keep using Twilio Verify.
- The app code is ready for Twilio-generated OTP codes.
- Public OTP will still fail until the Twilio account is upgraded from trial.

## Important files changed in the latest auth phase
- `lib/otp.ts`
- `lib/auth.ts`
- `components/giggifi-app.tsx`
- `middleware.ts`
- `app/api/auth/send-otp/route.ts`
- `app/api/auth/verify-otp/route.ts`
- `app/api/auth/contact/route.ts`
- `app/api/auth/contact/send-phone-otp/route.ts`
- `app/api/auth/contact/verify-phone/route.ts`
- `app/api/onboarding/role/route.ts`
- `lib/auth-routing.ts`
- `lib/services/auth-user-service.ts`
- `app/api/onboarding/route.ts`
- `app/api/onboarding/draft/route.ts`
- `app/[[...slug]]/page.tsx`
- `types/next-auth.d.ts`
- `SETUP_VERCEL_DATABASE.md`
- `.env.example`
- `.env.local`

## Important 2026-04-20 follow-up
- Pushed commit:
  `ef0250a Fix Google auth redirect and onboarding routing`
- Commit included:
  - NextAuth `pages.error = "/login"`
  - safer Google post-login Prisma update in `events.signIn`
  - login page Google error-state messaging improvements
  - onboarding/contact redirect preservation fixes
  - docs update for `giggifi.com` and `www.giggifi.com` Google OAuth setup
- Local build passed after the changes.
- Production still requires manual Google Cloud Console changes.
- User was guided to update Google Cloud Console here:
  `APIs & Services -> Credentials -> OAuth 2.0 Client ID`
- Required Google OAuth authorized JavaScript origins:
  - `https://giggifi.com`
  - `https://www.giggifi.com`
  - `http://localhost:3000`
- Required Google OAuth redirect URIs:
  - `https://giggifi.com/api/auth/callback/google`
  - `https://www.giggifi.com/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google`
- User also needs to confirm Vercel production env has:
  `NEXTAUTH_URL=https://giggifi.com`

## Important production incident on 2026-04-14
- Commit `e91a3ef` introduced the new contact-completion + role-routing logic successfully at code level.
- That same phase also introduced a new Prisma schema field `lastAuthProvider`.
- Local build passed, but production runtime failed with a generic application error page and digest because the production DB schema was out of sync.
- Vercel runtime logs showed repeated `PrismaClientKnownRequestError` on:
  - `GET /`
  - `GET /favicon.ico`
- Recovery action taken:
  - removed the `lastAuthProvider` schema dependency from runtime code
  - deleted the pending migration for that field
  - pushed recovery commit `8264631`
- Result:
  production recovered and `GET /` returned `200` again.

## Important caution for future sessions
- The user exposed `NEXTAUTH_SECRET` in chat/editor during setup.
- That secret should be rotated in both:
  - local `.env.local`
  - Vercel environment variables

## Best next steps from here
1. Manually click-test the live auth flow on `https://giggifi.com/login`
2. Verify both paths:
   - Google -> missing phone -> OTP verify -> role choice
   - OTP -> missing email -> save email -> role choice
3. Confirm no redirect loops for returning users with:
   - completed artist profile
   - incomplete artist onboarding
   - completed booker profile
   - incomplete booker onboarding
4. Keep Vercel `NEXTAUTH_URL` set to `https://giggifi.com`
5. Add the stable Google OAuth origins and callback URIs listed above if any are still missing
6. Upgrade Twilio from trial if public OTP is required
7. Only add future Prisma schema changes alongside an actual production migration plan
8. After auth is fully stable, continue with payment integration readiness

---

# 1) Product Overview

GIGGIFI is a booking platform connecting **bookers/clients** with **artists**.

Core idea:
- Booker lands on a professional homepage
- Searches artists by category and location
- Sees featured/premium artists
- Opens artist profile
- Sends enquiry / books artist
- Proceeds to payment
- Artist receives enquiry/booking in dashboard
- Artist manages media, press kit, profile, and stats

Target launch path:
- Start with Mumbai-focused onboarding
- Website live first
- Later scale across India
- Real payments, real login, real OTP, real Google sign-in

---

# 2) Expected Main User Flows

## Booker flow
1. Land on homepage
2. Search artist by category/location
3. View premium/featured artists
4. Open artist profile
5. Select booking option/date/package
6. See booking summary
7. Pay
8. Booking saved
9. Booker sees booking status
10. Artist sees enquiry/booking

## Artist flow
1. Sign up / login
2. Continue as artist
3. Complete registration/profile
4. Open dashboard
5. Upload press kit, reels, photos, videos
6. View enquiries
7. Respond/bid
8. Track stats/revenue/ratings

---

# 3) UI / UX Expectations

The website should feel professional and premium.

Must have:
- Proper landing page
- Sticky top navigation
- Clear hero section
- Search artists section
- Category browsing
- Featured and premium artist cards
- Location-based discovery
- How it works
- Trust / safety / credibility section
- Final CTA
- Good desktop and mobile responsiveness

Important preferences:
- Use actual profile images where relevant instead of generic icons
- Avoid clutter
- Keep polished spacing, hierarchy, clean layout
- Logo should be used in important places instead of plain text brand name

---

# 4) Important Functional Expectations

Everything must work for real, not as placeholders.

Needs to be checked and/or implemented:
- All buttons and links must work
- No dead CTAs
- Navbar sticky behavior must work
- Logo click returns to homepage
- Continue as artist must open proper flow
- Continue with Google must be real
- OTP must be real
- Payment must be real
- Protected routes must work
- Session persistence must work
- Dashboard pages must actually navigate
- Booking flow must save records
- Artist must see incoming enquiries/bookings
- Booker must see booking/payment state

---

# 5) Tech Stack Observed

This is the **website project**, not the Expo/mobile project.

Observed in the correct folder:
- `app/`
- `components/`
- `lib/`
- `prisma/`
- `public/`
- `src/`
- `middleware.ts`
- `next.config.js`
- `tailwind.config.js`

This strongly suggests:
- **Next.js App Router**
- Tailwind CSS
- Prisma
- next-auth
- likely TypeScript support in parts of project

There was earlier confusion with another wrong project folder that was an Expo/React Native style app. That Expo folder is NOT the website to deploy.

---

# 6) Known Deployment / Build History

## Local environment
The correct website folder eventually ran successfully locally.

Important terminal history:
- `npm install` initially failed because of dependency conflict
- `npm install --legacy-peer-deps` succeeded
- `npm run dev` worked locally
- site opened on `localhost:3001` instead of `3000`
- `npm run build` also succeeded locally

This means:
- the website code is at least capable of local build
- the main deployment issue was not purely code quality

## Vercel deployment issue #1
Initial Vercel failure:
- dependency conflict between `next-auth@4.24.13` and `nodemailer@8.0.5`

Fix applied / recommended:
- Set Vercel install command to:
  `npm install --legacy-peer-deps`
- Change `nodemailer` version from:
  `^8.0.5`
  to:
  `^7.0.7`

## Vercel deployment issue #2
After the dependency conflict was addressed, Vercel reported:

> Couldn't find any `pages` or `app` directory. Please create one under the project root

Interpretation:
- GitHub repository structure is likely incorrect / flattened
- Local project structure is correct, but GitHub upload likely broke folders
- Vercel cannot see the real `app/` folder in the project root

Root cause is likely:
- manual browser upload to GitHub flattened files or uploaded them incorrectly
- GitHub repo contents do not fully match the working local folder structure

---

# 7) Critical Repo / Deployment Context

## GitHub repo
Repo name observed:
- `GIGGIFI-WEBSITE-`

There was a strong signal that GitHub did not preserve the true local folder structure.

Vercel kept building commit:
- `5a1374e`

This suggested:
- either old commit still being deployed
- or repo contents still not matching local working structure

## Important conclusion
Even if local build works, Vercel will fail until the **correct folder structure** is pushed to GitHub properly.

The correct repo root should show folders like:
- `app/`
- `components/`
- `lib/`
- `prisma/`
- `public/`
- `src/`

not just many route/page files dumped incorrectly at the top level.

---

# 8) Immediate Priority To Fix Before Any More UI Audits

## Highest priority
Push the correct website folder to GitHub with the real directory structure preserved.

Recommended path:
- Use **GitHub Desktop** or proper git push from local folder
- Avoid manual drag/upload through GitHub web for complex folder structures

## After repo structure is fixed
1. Redeploy on Vercel
2. Confirm public URL works
3. Then audit:
   - working features
   - broken buttons
   - spacing
   - landing page
   - auth flows
   - payment readiness
   - dashboard behavior

---

# 9) Required Production Integrations

These are desired/needed for real launch readiness.

## Authentication
- Real Google Sign-In
- Real OTP authentication
- Session persistence
- Route protection
- Role-based routing:
  - artist -> artist dashboard
  - booker -> booker flow/dashboard

Possible auth paths:
- next-auth / Auth.js
- Firebase Auth (if architecture better suits it)
- phone OTP or email OTP fallback

## Payments
For India:
- **Razorpay** preferred

Needed flow:
1. Booking record created
2. Payment order created from backend
3. Frontend Razorpay checkout
4. Signature verification on backend
5. Payment + booking status update
6. Success and failure states

## Database / persistence
Observed:
- Prisma present

Needs confirmation:
- actual DB configured?
- booking model present?
- users/roles configured?
- payments/enquiries/bookings stored correctly?

## Storage / media
Needed for artists:
- press kit
- reels
- videos
- photos

Potential services:
- Cloudinary
- Supabase Storage
- S3-compatible storage

---

# 10) Launch Checklist (High Level)

Before ads / live traffic:
- Public deployment works on Vercel
- Custom domain connected
- Landing page polished
- All buttons functional
- Search flow functional
- Artist profile flow functional
- Booking flow functional
- Payment real, not fake
- Google sign-in real
- OTP real
- Booking records saved
- Artist dashboard usable
- Basic legal pages present:
  - privacy policy
  - terms
  - refund / cancellation
  - contact
- Analytics added:
  - GA4
  - Meta Pixel

---

# 11) Known User Priorities / Preferences

The user wants:
- practical step-by-step guidance
- copy-paste prompts for Codex
- real working implementation, not dummy actions
- strong premium UI
- artist images instead of generic icons where relevant
- sticky header behavior fixed
- proper homepage and navigation
- professional audit before going live
- website live first, then ads
- domain already bought on Hostinger

The user is beginner-to-intermediate with deployment and Git/GitHub workflow and benefits from very direct instructions.

---

# 12) Hosting / Deployment Guidance Agreed So Far

Recommended hosting path:
- Code on GitHub
- Deploy on Vercel
- Connect Hostinger domain to Vercel after deployment works

Important note:
- Domain is just the address
- Code must first be deployed on hosting
- Hostinger domain can point to Vercel via DNS after site works

Order:
1. Fix GitHub repo structure
2. Successful Vercel deploy
3. Test public URL
4. Connect Hostinger domain
5. Only then move toward ads/live promotion

---

# 13) Codex Instructions / Operating Rules

If Codex is continuing this project, it should follow these rules:

1. **Do not rebuild from scratch unnecessarily**
2. Preserve branding and current structure where possible
3. Fix broken UX/UI, routing, auth, and deployment issues incrementally
4. Prioritize production-capable implementations over demos/placeholders
5. Return changed files clearly
6. Explain any required environment variables
7. Keep the app runnable without syntax errors
8. Assume the local project may already work, but the GitHub/Vercel state may be wrong
9. First solve deployment/repo structure before deep feature polish
10. Once deployed, do a full click-path audit of all pages/components

---

# 14) Exact Known Errors Encountered

## Wrong project confusion
An Expo/mobile-style folder was mistaken for the website at one point.
Symptoms:
- had `App.js`, `app.json`, `babel.config.js`
- `npm run dev` missing
- not the correct website

Conclusion:
- ignore that project for website deployment

## Dependency conflict
Vercel/local install error:
- `next-auth@4.24.13`
- `nodemailer@8.0.5`
- peer conflict

Fix:
- `nodemailer` -> `^7.0.7`
- install with `--legacy-peer-deps`

## Vercel build error
Main current deployment blocker:
- `Couldn't find any pages or app directory. Please create one under the project root`

Interpretation:
- GitHub repo structure issue

---

# 15) What Codex Should Do First, In Order

## Phase A: Repo integrity
- Inspect actual local project structure
- Ensure repo root truly contains `app/` or `pages/`
- Ensure `.gitignore` excludes:
  - `node_modules`
  - `.next`
  - `.env`
  - `.env.local`

## Phase B: Deployment integrity
- Ensure GitHub repo mirrors local structure exactly
- Ensure Vercel points to correct repo and root directory
- Confirm build works on Vercel

## Phase C: Product audit
After public deployment works:
- test homepage
- test sticky nav
- test every CTA
- test artist/booker flows
- test auth
- test dashboard
- test responsiveness
- identify dead buttons
- identify unfinished states

## Phase D: Real integrations
- Google sign-in
- OTP
- payments
- database persistence
- dashboards / bookings / enquiries

---

# 16) Ready-Made Prompt For Codex

Use this as a starting prompt:

Act as a senior full-stack engineer continuing the GIGGIFI website project.

Context:
- This is a Next.js website project with app router-style structure.
- The correct local project builds successfully with `npm run build`.
- Vercel deployment currently fails because the GitHub repo likely does not preserve the true folder structure, causing Vercel to report that it cannot find an `app` or `pages` directory at project root.
- There was also a prior dependency conflict between `next-auth@4.24.13` and `nodemailer@8.0.5`; the intended fix is `nodemailer@^7.0.7` and install with `npm install --legacy-peer-deps`.
- Do not rebuild the project from scratch.
- First fix repo/deployment integrity, then audit and fix UI/UX and broken flows.

Tasks:
1. Verify correct project root structure.
2. Ensure deployment configuration works on Vercel.
3. Keep/install command compatible with current dependencies.
4. Once deployment works, audit every page and interaction:
   - homepage
   - sticky navbar
   - booking flow
   - artist flow
   - auth flow
   - dashboard flow
5. Replace dead buttons with real actions or proper disabled/loading/error states.
6. Keep UI polished, responsive, and premium.
7. Return precise file-level changes and explain setup requirements.

---

# 17) Human Next Steps

For the human operator:
1. Push the correct local website folder structure to GitHub using GitHub Desktop or proper git, not manual browser upload.
2. Confirm GitHub repo root visibly contains `app/` folder.
3. Redeploy on Vercel.
4. Share public link for full audit.

---

# 18) Memory Summary

Short version:
- Correct project is a Next.js website, not the Expo app.
- Local dev and local build work.
- Vercel dependency conflict was handled by using legacy peer deps and downgrading nodemailer.
- Current real blocker is wrong GitHub repo structure, causing Vercel not to find the `app` directory.
- Fix the GitHub push first.
- After deployment succeeds, perform a full product/UX/feature audit and then implement real auth/payment/OTP.
