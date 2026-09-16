# NexusHub — freelance platform API

The backend companion to [freelance-frontend](https://github.com/EvgenyPonomarevNova/freelance-frontend).

## Stack

Node.js, Express 4, PostgreSQL, Sequelize, JWT, bcrypt, request validation and file-upload middleware.

## Repository guide

- `server.js` — server entry point.
- `routes/` — HTTP routes.
- `controllers/` — request handling.
- `models/` — persistence models.
- `middleware/` — shared request middleware.
- `config/` — application configuration.

## Local development

Install dependencies with `npm ci`. Review the database and authentication configuration, provide your own local environment variables, and point the application at an isolated development database. Then run:

```sh
npm run dev
```

`npm start` runs the Node entry point. Root-level diagnostic scripts are not a substitute for an automated test suite.

## Status

Earlier application prototype. This documentation update does not assert production readiness or validate the current external OAuth configuration.

---

[Evgeny Ponomarev](https://github.com/EvgenyPonomarevNova/EvgenyPonomarevNova)
