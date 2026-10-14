# Assistant early cancellation

The service previously registered its abort controller after asynchronous configuration loading. An immediate cancel returned false and a request could subsequently be sent. The new regression test reproduced this before the fix.

The service now reserves the request before its first await, uses an operation-local controller and timeout, checks cancellation after configuration and response reads, and clears the reservation on configuration errors. Immediate cancellation prevents transport invocation; concurrent asks are rejected until the pending operation settles; a subsequent ask succeeds.

Typecheck, lint, build PASS. Full Vitest suite: 547 passed, 0 failed. Two source Electron chat tests PASS. Unit transport fixtures and actual local HTTP only; no live provider requests or real credentials. Cancellation after a remote server has already accepted work cannot guarantee avoidance of provider charges.
