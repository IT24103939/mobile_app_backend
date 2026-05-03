# WMT Node Backend (Express + MongoDB)

This backend matches the React Native app API contract.

## Run

1. Install dependencies
   - `cd backend-node`
   - `npm install`
2. Start development server
   - `npm run dev`

Server default URL:
- `http://localhost:8099`

Health check:
- `GET /api/health`

## Environment

Configured in `.env`:
- `PORT=8099`
- `MONGODB_URI=mongodb://localhost:27017/wmt_garage_db`
- `MONGODB_URI_FALLBACK=mongodb://root:mongodb@localhost:27017/wmt_garage_db?authSource=admin`
- `JWT_SECRET=...`
- `CORS_ORIGIN=*`

## Demo API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/account/me`
- `PUT /api/account/me`
- `DELETE /api/account/me`
- `GET /api/garages`
- `GET /api/garages/:id`
- `GET /api/garages/owner`
- `POST /api/garages`
- `PUT /api/garages/:id`
- `DELETE /api/garages/:id`
- `POST /api/appointments`
- `GET /api/appointments/:id`
- `GET /api/appointments/garage/:garageId`
- `GET /api/appointments/owner/my-appointments`
- `GET /api/appointments/customer/my-appointments`
- `PUT /api/appointments/:id`
- `PATCH /api/appointments/:id/status?status=CONFIRMED`
- `DELETE /api/appointments/:id`

## Notes

- Frontend base URL was updated to `http://192.168.8.162:8099/api` in `src/services/ApiClient.ts`.
- Authentication accepts `Authorization: Bearer <token>` and/or `X-User-Id`.
- Existing plain-text legacy passwords are auto-migrated to bcrypt on successful login.
