# Assistant server and architecture hardening

Scope: source implementation and isolated fixture verification on the current Windows host. No real OpenAI credentials were loaded or paid requests made. No public service was deployed.

## Changes

- HTTP admission, request policy, body reader, provider adapter, runtime configuration, private-file reader, encryption and SQLite quotas are separate modules. Credentials are immutable snapshots; imports do not start a service.
- The absolute deadline now covers slow request-body uploads. Unfinished uploads receive an error, close their connection and release the concurrency slot; quota remains charged. Oversized bodies cannot reach the upstream. Failed/oversized upstream bodies are cancelled; provider metadata is filtered.
- Bounded reads check file type/size before allocating credential buffers, reject symlink files, check changes across a read and require owner-only permissions on POSIX. Windows ACL administration still requires deployment verification. Server storage paths are absolute and distinct. SQLite files are created privately; startup failures close database handles.
- Provider secret envelope is strict and authenticated AES-256-GCM; Unicode byte limits are enforced. Master key can be supplied by a protected file/systemd credential or environment, never both. Provider/master-key environment values are removed from the running child process after loading. This does not erase a parent's environment or make server administrators unable to read runtime secrets.
- Startup remains loopback-only. Readiness is local and does not contact OpenAI. Shutdown stops admission and bounds connection draining. HTTPS/service templates and Russian deployment/rotation/rollback instructions are supplied; not installed or tested on a Linux server.
- A transitive esbuild dependency guard covers renderer, eight workers, preload and contracts. Only the preload's direct Electron bridge import is allowed. Hidden native imports fail regression tests. This guard runs before desktop builds. Server tests are included in release verification and service code in lint.

## Observed checks

- `npm run assistant:test`: 13 tests passed, zero failures/skips, isolated HTTP/upstream fixtures. Includes incomplete-upload deadline/released slot/quota, encryption tampering, restart quotas, expiry, input bounds, cancellation, metadata/log privacy and actual runtime loading with a fixture secret.
- `npm run architecture:test`: 2 tests passed. Current dependency graphs passed; deliberately introduced transitive Node/Electron imports were refused.
- `npm run build`: exit0; dependency guard reported renderer1684 inputs/eight workers, preload138 and contracts90. Audio hash consistency passed for existing136 EN/RU recordings; Kazakh and human audible review remain unavailable/unperformed.
- `npm run typecheck`: exit0.
- `npm run lint`: exit0, including services.
- `npm test -- --reporter=dot`: 554 tests/187 files passed,33.20s. Existing Vite configuration migration warning remains; not a failing check.
- `npm run security:audit`: exit0, zero reported dependency vulnerabilities. This is an advisory audit, not comprehensive security certification.

Desktop packaging still includes only `dist/**/*` and `package.json`; server files/secrets are not added to the learner package configuration. No new installer was created for this change. Full UI acceptance, Linux/systemd/nginx deployment, public TLS, real OpenAI account/model and physical hardware verification remain separate and unperformed.
