# Cloud Deployment

The frontend is already hosted on Netlify. The backend must also run on a
public host for the app to work while your computer is off. The current local
backend configuration already uses a MongoDB Atlas-style `mongodb+srv://`
connection string; use the same Atlas cluster and database when deploying.

## Deploy the backend

1. Push this repository to the Git provider connected to your hosting account.
2. In Render, create a new Blueprint instance from this repository and accept
   the settings in `render.yaml`.
3. Enter the following values for the service's prompted environment variables:
   - `MONGO_URI`: the Atlas connection string for the existing database.
   - `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`: the admin login to use.
   Render generates `JWT_SECRET` automatically.
4. In MongoDB Atlas, add a database user for the service and allow Render to
   connect. For Render's free service, its outbound IP is not fixed; Atlas
   network access may need `0.0.0.0/0`. Use a unique, strong database password.
5. Wait for the Render service to deploy, then verify its `/check` URL returns
   `Working...`. Its URL will be `https://mkt-backend-cloud.onrender.com`.

The Render free service may sleep when idle, so its first request can take a
while to wake. The frontend and database remain hosted independently of your
computer.

## Point Netlify at the backend

In the Netlify site's environment variables, set:

```text
VITE_BASE_URL=https://mkt-backend-cloud.onrender.com/api
VITE_BASE_URL_IMG=https://mkt-backend-cloud.onrender.com/uploads
```

Trigger a new Netlify deploy after changing these values. Do not put `MONGO_URI`
or any other server secret in Netlify's frontend environment variables.

## Uploaded files

Request attachments are currently written to the backend's local `uploads/`
directory. Cloud hosts can discard that directory during redeploys or restarts.
Before relying on attachments in production, configure persistent disk storage
for the backend or move uploads to an object-storage service. MongoDB stores
the attachment filenames, not the file contents.

## Local development

The ignored `mkt-frontend/.env` should use the local backend:

```text
VITE_BASE_URL=http://localhost:5000/api
VITE_BASE_URL_IMG=http://localhost:5000/uploads
```

The backend reads `MONGO_URI` from `mkt-backend/.env`; it can point at the same
Atlas database, so local development and cloud hosting share data.