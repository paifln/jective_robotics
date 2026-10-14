# Timeout and disconnect verification

Seven AssistantService tests PASS; typecheck/lint PASS. New explicit transport fixture verifies the 45000 ms request deadline: signal not aborted at 44999 ms, aborted at 45000 ms, interrupted error returned, no automatic retry, reservation released and a manual next request succeeds. Fake timers advance the application deadline; no paid request is sent.

Five Node gateway tests PASS. New real loopback HTTP disconnect test cancels the client while an explicit upstream fixture waits; server aborts its provider signal, logs bounded status 504, releases the single concurrency slot and serves the next request. Both reservations still count toward a limit of two, so a third request receives 429 without another upstream call. This verifies the prepared local gateway, not a deployed proxy or live provider cancellation/billing behavior.

Only automated tests changed. Current application/server source and previous package remain unchanged. No live provider, remote TLS proxy, physical hardware or installer claims. Prior full 548-test/coverage run remains independently scoped.
