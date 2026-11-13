FROM node:26.13.0-bookworm-slim@sha256:add5c17c14752c54d2f3d519ec46a3815684d41c33f198bcb09fb998f7dcbf68
ENV NODE_ENV=production
WORKDIR /app
# Only the dependency-free gateway enters this image. No desktop, SDK or .env.
COPY services/assistant/*.mjs ./services/assistant/
COPY services/assistant/deploy/railway/start.mjs ./services/assistant/deploy/railway/start.mjs
CMD ["node", "services/assistant/deploy/railway/start.mjs"]
