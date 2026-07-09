# Multi-stage build: compile the frontend, then serve it from the Express
# backend so the whole app runs as a single container on one origin.

# --- Stage 1: build the React frontend ---
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: backend runtime (also serves the built frontend) ---
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
# The backend serves ../frontend/dist relative to its own directory.
COPY --from=frontend /app/frontend/dist /app/frontend/dist

EXPOSE 3001
CMD ["node", "server.js"]
