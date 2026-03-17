---
description: Automates the build-test-fix loop across backend, web, admin, and mobile platforms.
---

1. Parse `AGENTS.md` for the latest build and test commands for all components.
2. Execute the test suite for the component currently under development (or all components if not specified).
   - Backend: `dotnet test`
   - Web/Admin: `npm run lint` and `npm test` (if available)
   - Mobile: `npm run lint` and `npm test`
3. Capture and analyze any error logs or stack traces from failed tests.
4. Search the codebase for relevant files causing the failures.
5. Apply fixes to resolve the bugs while adhering to safety rules in `conductor/workflow.md`.
6. Rerun the tests to verify the fix.
7. Repeat until all tests pass.
