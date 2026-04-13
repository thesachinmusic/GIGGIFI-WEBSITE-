# GiggFi Live Build Phases

## Phase 1: Frontend foundation

- Luxury-first homepage with a clear value proposition
- Artist discovery section with category and city filtering
- Trust-building examples, testimonials, and service positioning

## Phase 2: Backend lead flow

- `GET /api/home` for homepage content
- `GET /api/artists` for artist discovery
- `GET /api/bookings` for the ops feed
- `POST /api/bookings` for website enquiry capture
- Booking data persisted in [`data/bookings.json`](/Users/sachinchaudhary/Documents/New%20project/data/bookings.json)

## Phase 3: What to build next

- Artist and client authentication
- Payment gateway and booking advances
- Email and WhatsApp notifications
- Admin actions to update booking status
- CMS or database-backed content instead of JSON files

## How to run

1. Run `npm start`
2. Open `http://127.0.0.1:3000`
3. Submit the booking form and confirm the new lead appears in the ops console

## Main files

- Frontend shell: [`index.html`](/Users/sachinchaudhary/Documents/New%20project/index.html)
- Frontend logic: [`src/main.js`](/Users/sachinchaudhary/Documents/New%20project/src/main.js)
- Frontend design: [`src/styles.css`](/Users/sachinchaudhary/Documents/New%20project/src/styles.css)
- Backend server: [`scripts/server.mjs`](/Users/sachinchaudhary/Documents/New%20project/scripts/server.mjs)
- Content source: [`data/site-content.json`](/Users/sachinchaudhary/Documents/New%20project/data/site-content.json)
