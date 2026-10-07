# Movie Ticket Booking System

A full-stack movie ticket booking application built with the MERN stack. Users can browse movies, choose a screening and seats, and manage their bookings. Administrators manage the movie catalogue and show schedule and can review all reservations.

## Features

- Responsive movie catalogue with movie details and available screenings
- Account registration, login, session restoration, and logout
- Role-protected user and administrator pages
- Interactive seat map showing available, selected, and occupied seats
- Booking history for the signed-in user
- Admin dashboard for movie and show management and all bookings
- Server-side input validation and meaningful HTTP error responses
- Atomic seat reservation to prevent overbooking
- HttpOnly cookie-based JWT sessions

## Roles

| Role | Access |
| --- | --- |
| User | Browse movies and shows, reserve seats, and view their own bookings |
| Admin | User capabilities plus movie and show management and access to all bookings |

Public registration always creates a `user` account. It does not accept a role from the client. Create or promote administrators only through a trusted, operator-managed database process.

## Tech stack

- **Frontend:** React 18, Vite, React Router, Axios
- **Backend:** Node.js 18+, Express 4
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, bcryptjs, HttpOnly cookies
- **HTTP security:** Helmet and credentialed, origin-restricted CORS

## Project structure

```text
backend/
  src/
    config/         Environment validation and MongoDB connection
    controllers/    API request handlers
    middleware/     Authentication, authorization, and error handling
    models/         Mongoose models for users, movies, shows, and bookings
    routes/         Express API routes
    scripts/        Movie seed script
    services/       Database and token operations
    app.js          Express application and middleware
    server.js       Database initialization and HTTP server lifecycle
  .env.example
  package.json
frontend/
  src/
    components/     Shared UI and protected-route components
    context/        Authentication and booking state
    pages/          Catalogue, authentication, booking, history, and admin pages
    services/       Axios API client
    App.jsx         Application routes and layout
    main.jsx        React entry point
    styles.css      Responsive application styles
  .env.example
  package.json
README.md
```

## Environment variables

Copy each example file to `.env` in its respective application directory. Do not commit `.env` files or production credentials.

### Backend: `backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `5000` |
| `MONGODB_URI` | Yes | Local MongoDB or MongoDB Atlas connection string |
| `CLIENT_URL` | Yes | Exact browser origin permitted by CORS, without a path |
| `JWT_SECRET` | Yes | Unique secret of at least 32 bytes used to sign tokens |
| `NODE_ENV` | Deployment | Set to `production` in production to enable Secure auth cookies |

Example local configuration is provided in `backend/.env.example`. Its JWT secret value is intentionally blank. Generate a unique secret and store it only in your ignored `backend/.env` or deployment secret manager:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### Frontend: `frontend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend API base URL, including the `/api` prefix |

The local value is provided in `frontend/.env.example`. Vite embeds this value at build time; configure it before running a production build.

## Installation and local development

Requirements: Node.js 18 or newer, npm, and a running local MongoDB instance or an Atlas database.

Use two terminals from the project root.

### 1. Configure and start the backend

In PowerShell:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and set `MONGODB_URI`, `CLIENT_URL`, and a generated `JWT_SECRET`. Start MongoDB, then seed the sample movie catalogue and run the API:

```powershell
npm run seed
npm run dev
```

The API listens on `http://localhost:5000` by default. Check database/API readiness at `http://localhost:5000/api/health`.

### 2. Configure and start the frontend

In a second PowerShell terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The local frontend URL is normally `http://localhost:5173`. Set `VITE_API_URL` in `frontend/.env` if the API is running at another address.

For Command Prompt, use `copy .env.example .env` in place of `Copy-Item`. For macOS/Linux shells, use `cp .env.example .env`.

## API overview

The API is rooted at `/api`. JSON write requests must use `Content-Type: application/json`.

### Health

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Reports API and MongoDB connection status |

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a user |
| `POST` | `/api/auth/login` | Public | Sign in |
| `GET` | `/api/auth/me` | Signed in | Restore the current session |
| `POST` | `/api/auth/logout` | Public | Clear the session cookie |

Registration body: `name`, `email`, and `password`. Login body: `email` and `password`. Successful registration and login set the `cinebook_session` HttpOnly cookie. Browser clients send it automatically; the frontend does not store the JWT in browser storage. Non-browser clients can authenticate with a Bearer token.

### Movies

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/movies` | Public | List movies |
| `GET` | `/api/movies/:id` | Public | Get one movie |
| `POST` | `/api/movies` | Admin | Create a movie |
| `PUT` / `PATCH` | `/api/movies/:id` | Admin | Update a movie |
| `DELETE` | `/api/movies/:id` | Admin | Delete a movie when it has no shows |

Movie fields: `title`, `genre` (array of 1–8 strings), `duration` (1–600 minutes), `language`, and `description`.

### Shows

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/shows?movie=:id&date=YYYY-MM-DD` | Public | List available shows; filters are optional |
| `GET` | `/api/shows/:id` | Public | Get one show |
| `GET` | `/api/shows/admin/all` | Admin | List all shows, including sold-out shows |
| `POST` | `/api/shows` | Admin | Create a show |
| `PUT` / `PATCH` | `/api/shows/:id` | Admin | Update a show |
| `PATCH` | `/api/shows/:id/seats` | Admin | Set the available-seat count |
| `DELETE` | `/api/shows/:id` | Admin | Delete a show if it has no bookings or reserved seats |

Show fields: `movie`, `date` (`YYYY-MM-DD`), `time` (24-hour `HH:mm`), `theatre`, `screen`, `totalSeats`, and `availableSeats`.

### Bookings

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/bookings/shows/:showId/seats` | Public | Read occupied and available seat information |
| `POST` | `/api/bookings` | Signed-in user | Reserve seats |
| `GET` | `/api/bookings/my` | Signed-in user | List the current user's bookings |
| `GET` | `/api/bookings` | Admin | List all bookings |

Booking request example:

```json
{
  "show": "MONGOOSE_SHOW_ID",
  "seatsBooked": ["C4", "C5"]
}
```

Seat IDs must be unique, use the `A1`–`H12` format, and number no more than eight per booking. Seat reservations update availability atomically. A seat that has already been taken or insufficient remaining capacity returns `409 Conflict`. Users can only retrieve their own booking history; the all-bookings endpoint is admin-only.

## Deployment

Deploy MongoDB, the backend API, and the static frontend. The frontend and API should use HTTPS in production.

1. **Provision MongoDB.** Create a production database and configure network access and a database user with appropriate permissions. Keep the connection string private.
2. **Deploy the backend as a Node.js service.** Use `backend` as its working directory, install dependencies with `npm install`, and start with `npm start`. Configure `MONGODB_URI`, a unique `JWT_SECRET` (32 bytes or longer), `CLIENT_URL` set to the frontend's exact origin, `NODE_ENV=production`, and the platform-provided `PORT`. Do not expose secrets in source control or build logs.
3. **Deploy the frontend as a static site.** Use `frontend` as the working directory, install with `npm install`, and build with `npm run build`. Publish the `frontend/dist` directory. Set `VITE_API_URL` to the deployed API base URL ending in `/api` before building.
4. **Configure SPA routing.** Configure the static host to serve `index.html` for frontend routes such as `/account/bookings`, `/book/:movieId`, and `/admin`.
5. **Keep the browser session compatible with deployment origins.** The API allows the exact `CLIENT_URL` origin and sets an HttpOnly, `SameSite=Strict`, `Secure` cookie in production. Host the frontend and API on the same site (for example, on subdomains of the same registrable domain) so browsers send the session cookie. Separate cross-site domains are not compatible with the current Strict cookie settings.
6. **Verify deployment.** Check `GET /api/health`, then verify registration/login, cookie-backed session restoration, booking access, and admin-only routes using appropriately provisioned accounts.

The health endpoint returns `200` when the API is connected to MongoDB and `503` when the database is unavailable. The server initializes the booking and show indexes before accepting requests.
