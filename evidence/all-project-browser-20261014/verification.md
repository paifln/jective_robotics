# All saved projects browser

Dedicated typed workspace:projects IPC returns up to 50 metadata records per page and a total count. Its strict request schema limits query length, offset, and page size; main uses the existing trusted sender/origin and restore exclusion guards. Startup workspace state still returns its original recent 20.

SQLite search uses a deterministic NFKC/lowercase Unicode function and parameterized literal substring matching (percent/underscore are literal). Sorting uses saved_at descending and id ascending to make tied timestamps deterministic. UI searches the complete database and exposes localized Show more. Existing file operations and unsaved-change confirmation remain.

552 unit tests passed. New unit test stores 65 records, verifies both pages, uniqueness, unchanged recent limit, mixed-case Cyrillic/Kazakh search, literal percent/underscore, SQL-like text and request limits. Source Electron UI test passed with 65 additional saved projects: first page, Show more, oldest project's search, narrow layout and opening in Studio. Reading UI regression passed. Build, typecheck and lint passed.

First UI attempt failed because Playwright's default dialog dismissal canceled the existing unsaved-change confirmation. Corrected test explicitly accepts it; both reports retained. No production bypass was added.

Offset pages are not a transaction snapshot: concurrent saves can move records between pages; Refresh reloads the current order. No updated packaged EXE/installer, hardware or Windows 10 verification is claimed. This supersedes the 20-project browsing limitation noted in the preceding project-list design report.
