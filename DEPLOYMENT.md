# Production Deployment Guide

This project is already prepared for a same-origin Node deploy where the backend serves the built frontend and all browser API calls use `/api`.

## Recommended host shape

- One web service for the whole app
- Backend serves `frontend/dist`
- Public site and API share the same domain
- Health endpoint: `/api/health`

## What is already handled in code

- Frontend production build is served by the backend
- Public `/api/products`, `/api/assets`, and `/api/taxonomy` now send CDN-friendly cache headers
- Route-wise rate limiting is enabled for customer auth, admin auth, session refresh, contact, uploads, orders, and payment actions
- Response compression is enabled
- Uploads are Cloudinary-first in production
- Health monitoring returns uptime, response time summary, DB state, upload readiness, rolling alert counts, and recent 4xx/5xx alerts

## What you still need to do in hosting

Set the environment variables from [backend/.env.production.example](/Users/kritikatrivedi/Desktop/K:A/backend/.env.production.example:1).

Minimum required:

- `MONGO_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`

Recommended for same-origin production:

- `FRONTEND_ORIGIN=https://your-domain.com`
- `BACKEND_PUBLIC_URL=https://your-domain.com`

If you want online payments with Razorpay:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## Render-specific notes

- Keep the existing root [render.yaml](/Users/kritikatrivedi/Desktop/K:A/render.yaml:1)
- After updating environment variables, trigger a fresh deploy
- When the deploy finishes, open `/api/health`

Healthy result should show:

- `status: ok`
- `database.connected: true`
- `uploads.provider: cloudinary`
- `payments.razorpay.enabled: true` if Razorpay should be live
- `payments.razorpay.webhookEnabled: true` if webhook reconciliation is enabled

The `monitoring` block should also ideally show:

- `state: ok`
- `responseTimeMs.average` and `responseTimeMs.p95` within your target
- `activeAlerts: []`

## Cloudinary

Production uploads now expect Cloudinary by default.

If Cloudinary is missing in production:

- uploads will report as degraded in `/api/health`
- upload API will return `503`

Only use `ALLOW_LOCAL_UPLOADS=true` as a short-term emergency fallback.

## Razorpay

The checkout flow is already wired for Razorpay Orders + signature verification, and the backend now also accepts signed webhooks at:

- `/api/payments/razorpay/webhook`

In the Razorpay Dashboard:

- create Test Mode keys first, then later replace them with Live Mode keys
- enable automatic capture unless you intentionally want a manual capture workflow
- add the webhook URL `https://your-domain.com/api/payments/razorpay/webhook`
- set the same webhook secret in Razorpay and `RAZORPAY_WEBHOOK_SECRET`
- subscribe to `payment.authorized`, `payment.captured`, `payment.failed`, and `order.paid`

Why both client verify and webhook:

- client verify gives the customer an immediate success result after checkout
- webhook reconciles payments if the browser closes, the network drops, or the success callback is interrupted

## Monitoring checklist

Point your uptime monitor at `/api/health` and alert on:

- non-`200` responses
- `monitoring.state !== "ok"`
- sustained `monitoring.activeAlerts` for 5xx bursts
- unusually high `monitoring.responseTimeMs.p95`

This gives you the launch-ready baseline for uptime, latency, and 4xx/5xx visibility without adding extra vendors into the request path.

## Phased rollout

### Launch-ready hardening

Already covered in repo:

- Cloudinary-first production uploads
- stricter per-surface rate limits for auth, session refresh, contact, uploads, orders, and payments
- response compression
- health, latency, and rolling alert visibility

### Growth phase

Recommended next:

- move `appCache` and rate-limit storage to Redis or Upstash so cache and throttle state survive horizontal scaling
- serve frontend static assets from CDN or edge storage while keeping API on the app origin
- keep cacheable public reads flowing through CDN, especially `/api/products`, `/api/assets`, and `/api/taxonomy`

### High-traffic or campaign phase

Recommended when traffic starts spiking:

- enable API autoscaling at the host layer
- move payments, mails, and heavy admin workflows into queues or background jobs
- switch catalog search to text indexes or Algolia/Meilisearch if product count and query volume grow materially

## Admin user

If the admin user does not exist yet, run:

```bash
cd backend
npm run create-admin
```

This uses:

- `MONGO_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Local preflight check

You can validate env setup before or after deployment with:

```bash
cd backend
npm run check:env
```

## Security note

If any real secrets were ever pasted into local files, rotate them in the provider dashboard before production use:

- MongoDB password / connection string
- JWT secret
- Cloudinary API secret
- Razorpay secret
