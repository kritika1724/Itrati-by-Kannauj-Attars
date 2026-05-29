# Production Deployment Guide

This project is already prepared for a same-origin Node deploy where the backend serves the built frontend and all browser API calls use `/api`.

## Recommended host shape

- One web service for the whole app
- Backend serves `frontend/dist`
- Public site and API share the same domain
- Health endpoint: `/api/health`

## What is already handled in code

- Frontend production build is served by the backend
- Product and asset caching is enabled
- Route-wise rate limiting is enabled for login, session refresh, contact, uploads, orders, and payment actions
- Response compression is enabled
- Uploads are Cloudinary-first in production
- Health monitoring returns uptime, response time summary, DB state, upload readiness, and recent 4xx/5xx alerts

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

## Render-specific notes

- Keep the existing root [render.yaml](/Users/kritikatrivedi/Desktop/K:A/render.yaml:1)
- After updating environment variables, trigger a fresh deploy
- When the deploy finishes, open `/api/health`

Healthy result should show:

- `status: ok`
- `database.connected: true`
- `uploads.provider: cloudinary`

## Cloudinary

Production uploads now expect Cloudinary by default.

If Cloudinary is missing in production:

- uploads will report as degraded in `/api/health`
- upload API will return `503`

Only use `ALLOW_LOCAL_UPLOADS=true` as a short-term emergency fallback.

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
