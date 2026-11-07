# Almirobe API (Java)

Spring Boot backend for Almirobe.

## Prerequisites

- Java 21+ (Homebrew: `export JAVA_HOME=/opt/homebrew/opt/openjdk`)
- Maven 3.9+
- Docker (for Postgres)

## Quick start

```bash
# From repo root
docker compose up -d postgres

cd backend
export JAVA_HOME=/opt/homebrew/opt/openjdk
export JWT_SECRET=dev-secret-change-me-at-least-32-chars-long
export GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

mvn spring-boot:run
```

API: `http://localhost:8080`

## Week 2 (vision)

From the repo root:

```bash
docker compose up -d postgres redis minio minio-init worker
```

The Python worker downloads rembg weights on first run (can take a few minutes).

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/catalog/tags` | Bearer JWT |
| POST | `/api/v1/media/upload-url` | Bearer JWT |
| PUT | `/api/v1/media/objects?key=` | Bearer JWT |
| POST | `/api/v1/image-jobs` | Bearer JWT |
| GET | `/api/v1/image-jobs/{id}` | Bearer JWT |
| POST | `/api/v1/speech/transcribe` | Bearer JWT (501 until Whisper worker) |

## OpenAPI & TypeScript types

Contract: [`../openapi/openapi.yaml`](../openapi/openapi.yaml)

Regenerate frontend types after API changes:

```bash
cd ..
npm run generate:api-types
```

## Tests

Requires Postgres running (`docker compose up -d postgres` from repo root):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk
mvn test
```

## Auth endpoints (Week 1)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/google` | Public |
| POST | `/api/v1/auth/refresh` | Public |
| POST | `/api/v1/auth/logout` | Public |
| GET | `/api/v1/auth/me` | Bearer JWT |
