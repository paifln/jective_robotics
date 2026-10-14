# JECTIVE server assistant

The OpenAI key belongs on the JECTIVE server. It is never distributed in a student EXE, project, or renderer. This gateway uses a fixed OpenAI endpoint and a server-selected model. Each learner receives a separate expiring, revocable credential, not the provider key.

Requires Node.js 24. No additional dependencies. Run verification with:

```sh
npm run assistant:test
npm run architecture:test
```

## Administrator deployment

1. Generate a random 32-byte master key and put it in the server's secret manager. Supply it as `ASSISTANT_MASTER_KEY` (64 hex characters). Keep it separate from the encrypted file, backups, repository and student devices.
2. Set `OPENAI_API_KEY` and `ASSISTANT_SECRET_FILE` in the administrator environment. Run `node services/assistant/provision.mjs seal`. This creates an AES-256-GCM authenticated encrypted file without overwriting an existing file. Remove `OPENAI_API_KEY` from the environment after provisioning.
3. Set `ASSISTANT_LEARNER_ID` to an opaque learner identifier and run `node services/assistant/provision.mjs credential`. This deliberately outputs a NEW learner token once, plus its SHA-256 registry entry. Deliver the token privately to that learner's device. Store only registry entries in a JSON array at `ASSISTANT_CREDENTIALS_FILE`. Do not copy the token output into source control or logs. Default expiry is 30 days; removing the entry and restarting revokes access.
4. Set `ASSISTANT_SECRET_FILE`, `ASSISTANT_MASTER_KEY`, `ASSISTANT_CREDENTIALS_FILE`, `ASSISTANT_QUOTA_FILE`, and `ASSISTANT_MODEL` on the server. The quota file is a SQLite database on a writable private local disk. The model must be one enabled for your OpenAI account. Start `node services/assistant/server.mjs` under a restricted service account. On Windows, restrict the credential/master-key/quota directories with service-account ACLs; POSIX mode bits alone do not establish Windows access control.
5. The service binds to **127.0.0.1:8787** only. Place it behind an HTTPS reverse proxy on your JECTIVE server. Limit request bodies to 200 KB, apply IP/connection rate limits, and do not expose the loopback HTTP service publicly. Firewall all other inbound access. Proxy `/chat/completions` to the gateway. No browser CORS access is enabled.
6. On each desktop, set `JECTIVE_ASSISTANT_SERVER=https://YOUR-ASSISTANT-HOST` and `JECTIVE_ASSISTANT_TOKEN` to that learner's token for the first launch. The main process stores the token using Electron safeStorage in `assistant.json`, and removes the token from its process environment. Subsequent launches use the encrypted file. An endpoint without credentials does not activate online assistance. The token must not be the OpenAI key. Packaged renderer IPC cannot change assistant credentials.

Packaged student builds also refuse legacy direct-provider configurations. They do not erase a previous administrator's encrypted key automatically. Provision student machines with fresh profiles and no provider credentials; remove legacy provider files from student devices through your administrator deployment procedure. Encrypting a shared provider key on a student-owned computer does not make it secret from that computer's owner.

## Limits and outstanding deployment verification

The gateway caps response tokens, request/response bytes, concurrent upstream requests, daily requests per learner, and daily total requests. The production launcher requires a durable SQLite quota file: atomic reservations survive restarts and are shared by processes using that same local database. Records older than 14 days are removed. Concurrency is per process. Before production, enforce an OpenAI project budget, add monitoring and test your HTTPS proxy. For multiple machines, replace local SQLite quotas with a centralized store; do not use separate files or network-drive SQLite. Requests that pass authentication consume quota even if malformed or cancelled, to bound repeated failures. The injectable test server uses in-memory counters when no quota store is provided; the production launcher does not.

Logs contain request ID, opaque learner ID and status only; no prompts, code, answers, credentials or provider errors. Questions, up to ten recent conversation messages (at most 2,000 characters each) and only user-selected source are submitted by the desktop. The exact current payload is inspectable before sending. Decide retention/privacy policy before deployment; this gateway stores no conversations. A learner token can still be extracted by the owner of their computer: its scope, expiry, revocation and server quotas limit that risk. Desktop encryption is not protection for a shared provider key.

Local tests use a fake upstream. No server hosting, TLS certificate, real OpenAI account/model, production quotas or paid request has been verified. This implementation does not make those claims.

## Structure and deployment templates

`server.mjs` owns HTTP authentication, admission and request lifecycle. `policy.mjs` validates immutable credential snapshots and bounded chat input; `request-body.mjs` bounds upload size and applies the absolute request deadline; `provider.mjs` owns the fixed upstream protocol; `runtime.mjs` owns validated configuration, startup and shutdown. Encryption, bounded private-file reads and persistent quotas remain separate modules. Importing a module does not start the service or load a real key.

`deploy/runtime.env.example`, `deploy/jective-assistant.service` and `deploy/nginx.conf.example` are deployment templates, not an installed service. The [Russian administrator guide](DEPLOYMENT_RU.md) explains the files, credentials, verification and rollback. The service can load its master key from `ASSISTANT_MASTER_KEY_FILE` (an absolute owner-only file) or `ASSISTANT_MASTER_KEY`, never both. The systemd template supplies the file through `LoadCredential`; real keys are never included in the templates.

The 40-second absolute request deadline includes body upload and provider processing. An unfinished upload is closed after the error response and releases its slot while retaining its charged quota. Provider error bodies and oversized streams are cancelled. `/healthz` is a loopback readiness endpoint only: it does not contact OpenAI or certify model availability. The proxy template does not publish it. Service shutdown stops accepting connections and forcibly closes remaining connections after 45 seconds.

Current OpenAI guidance requires keeping provider credentials on the server: [official API authentication documentation](https://developers.openai.com/api/reference/overview). The encrypted key is decrypted in server memory for use; an administrator controlling that server can access it. Keep the master key separate and restrict service-account access.
