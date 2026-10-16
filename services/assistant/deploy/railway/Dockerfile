FROM node:26.11.1-bookworm-slim@sha256:86f07bc9c5dce4578cf37e5a418b7bfc7f817cda25cde66e2b66e95ed86c4567
ENV NODE_ENV=production
WORKDIR /app
# Only the dependency-free gateway enters this image. No desktop, SDK or .env.
COPY services/assistant/*.mjs ./services/assistant/
COPY services/assistant/deploy/railway/start.mjs ./services/assistant/deploy/railway/start.mjs
CMD ["node", "services/assistant/deploy/railway/start.mjs"]
