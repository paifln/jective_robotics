FROM node:26.13.1-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1
ENV NODE_ENV=production
WORKDIR /app
# Only the dependency-free gateway enters this image. No desktop, SDK or .env.
COPY services/assistant/*.mjs ./services/assistant/
COPY services/assistant/deploy/railway/start.mjs ./services/assistant/deploy/railway/start.mjs
CMD ["node", "services/assistant/deploy/railway/start.mjs"]
