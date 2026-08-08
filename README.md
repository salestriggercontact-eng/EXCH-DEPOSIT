# PayDash - Payment Dashboard (MERN)

Full-stack payment dashboard with manual deposit/payout approval flow.
Three separate apps: user client, admin panel, and backend API.

## Structure

```
payment-dashboard/
├── server/     # Node.js + Express + MongoDB backend (serves both client and admin)
├── client/     # React + Vite - user-facing dashboard (port 5173)
└── admin/      # React + Vite - standalone admin panel (port 5174)
```

## Setup

### 1. Backend

```
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — used once by the seed script

Create the first admin login (only needs to be run once):
```
node seedAdmin.js
```

Start the server:
```
npm run dev      # with nodemon, auto-restart
# or
npm start
```
Server runs on `http://localhost:5000` by default.

### 2. User client

```
cd client
npm install
cp .env.example .env
npm run dev
```
Runs on `http://localhost:5173`. Sign up / log in at `/auth/signup` or `/auth/login`.

### 3. Admin panel (separate app)

```
cd admin
npm install
cp .env.example .env
npm run dev
```
Runs on `http://localhost:5174`. Log in at `/login` using the email/password from `seedAdmin.js`.

Both `client` and `admin` point at the same backend (`VITE_API_URL` in each `.env`) — they are
independent apps you can deploy separately (different domains/subdomains, different hosting, etc).

## Key flows

- **Deposits & payouts are 100% manual.** No payment gateway, no blockchain integration.
  User submits a request → sits as `pending` → Admin reviews in the admin panel's Deposits or
  Payouts page → Approve credits/debits the balance atomically and notifies the user, or Reject
  leaves the balance untouched.
- **First-deposit unlock popup**: new users see a locked/blurred balance card on Home. Clicking
  "Make Deposit" opens a popup (amount + TRC20/BEP20 network → 60-min countdown, QR code, address,
  "I sent funds"). This still goes through manual admin review — clicking "I sent funds" only
  marks the request `pending`, balance updates after admin approval.
- **Deposit addresses** (coin, network, wallet address, minimum, QR code) shown on the user's
  Paying page and the unlock popup are configured by the admin in the admin panel's Deposits page
  → "Deposit addresses" panel. These are display-only — there's no wallet generation or
  blockchain monitoring.
- **Balance changes only happen on the backend**, inside the approve endpoints, using an atomic
  `findOneAndUpdate` status guard so a deposit/payout can never be approved (and credited/debited)
  more than once.

## Admin audit log

Every approve/reject/status-change action is recorded in `AdminAuditLog` and visible in the admin
panel's Audit Logs page.

## Notes

- Payment proof uploads are stored on disk under `server/uploads/payment-proofs` and served at
  `/uploads/payment-proofs/<file>`. For production, move this to cloud storage (S3, etc).
- No dummy/demo data is seeded — deposit addresses and users start empty; add your first coin
  address from the admin panel before testing the Paying page or unlock popup.
