# COSC2626 Assignment 2 Frontend

Static frontend for the AWS music subscription web application.

## Files

- `index.html` - Landing page with login and registration forms
- `main.html` - Dashboard page for authenticated users (subscriptions + query)
- `app.js` - Login/registration logic and backend selector for `index.html`
- `utils.js` - Shared helpers: `songKey()` and `makeSongCard()`
- `style.css` - Application styles
- `serve.json` - Configuration for the `serve` static file server

## Pages

### index.html (Login / Register)
- Presents a popup form for login and registration.
- Reads the `?backend=` URL parameter (`ec2`, `ecs`, or `lambda`) and stores the chosen backend in `sessionStorage`.
- On successful login, stores `loggedInEmail` and `loggedInUsername` in `sessionStorage` and redirects to `main.html`.
- Appending `?showLogin=true` automatically opens the login popup (used after logout).

### main.html (Dashboard)
- Requires an active session (`loggedInEmail` in `sessionStorage`); redirects to `index.html` otherwise.
- **User area** — displays the logged-in username and email.
- **Subscriptions area** — loads and renders the user's current subscriptions; each card has a **Remove** button.
- **Query area** — search songs by title, year, artist, and/or album; results show a **Subscribe** button (disabled once already subscribed).

## Backend Selection

Three backend targets are supported:

| Key      | URL |
|----------|-----|
| `ec2`    | `http://ec2-3-91-187-18.compute-1.amazonaws.com` |
| `ecs`    | `http://music-alb-1834554723.us-east-1.elb.amazonaws.com` |
| `lambda` | `https://exb2yo4udg.execute-api.us-east-1.amazonaws.com/prod` |

Pass the key via the URL: `index.html?backend=ec2`. Defaults to `lambda`.

## API Endpoints Used

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and retrieve user info |
| `GET`  | `/subscriptions?email=` | Fetch the user's subscriptions |
| `POST` | `/subscriptions` | Subscribe to a song |
| `DELETE` | `/subscriptions` | Remove a subscription |
| `GET`  | `/music?title=&artist=&year=&album=` | Query the music catalogue |

## Serving Locally

```bash
# from the project root
npx serve frontend
```

The app will be available at `http://localhost:3000`.
