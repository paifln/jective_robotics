FROM node:26.12.1-bookworm-slim@sha256:88e480776c6149ff1d098cd304f44bf18057fb5d284a3329b78162d29821e28c
ENV NODE_ENV=production
WORKDIR /app
# Only the dependency-free gateway enters this image. No desktop, SDK or .env.
COPY services/assistant/*.mjs ./services/assistant/
COPY services/assistant/deploy/railway/start.mjs ./services/assistant/deploy/railway/start.mjs
CMD ["node", "services/assistant/deploy/railway/start.mjs"]
