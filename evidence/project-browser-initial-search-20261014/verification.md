# Interrupted initial project browser load

Source Electron fixture holds the first guarded workspace state response, changes search before it completes, verifies the new project title and count and enabled Refresh button, then releases the obsolete response and confirms the title stays current. The existing held old-list response, pagination, 65-project search, narrow layout and actual Studio opening checks also passed in the same test.

One scoped Electron test passed; this is new evidence for the metadata retry logic implemented in the preceding responsiveness change. No production source change in this turn. Fixture wraps original IPC handlers only in the isolated source test, not a production package.
