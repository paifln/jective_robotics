FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
ENV NODE_ENV=production
WORKDIR /app
# Only the dependency-free gateway enters this image. No desktop, SDK or .env.
COPY services/assistant/*.mjs ./services/assistant/
COPY services/assistant/deploy/railway/start.mjs ./services/assistant/deploy/railway/start.mjs
CMD ["node", "services/assistant/deploy/railway/start.mjs"]
