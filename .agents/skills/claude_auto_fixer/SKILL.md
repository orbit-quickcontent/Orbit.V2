---
name: claude_auto_fixer
description: Autonomous Claude-level agent that scans all files across web apps, backend, and Android mobile apps for compilation, syntax, linting, and runtime errors and automatically patches them.
---

# Autonomous Claude-Level Error Scanner & Auto-Fixer

This skill empowers the agent to perform multi-stage error detection and resolution across the Orbit codebase.

## Workflow

1. **Project-Wide Diagnostic Scan**:
   - Run `node scripts/auto_fix_runner.js` to get a structured overview of errors across Backend, Dashboard Web App, Editor Web App, and Android Partner App.

2. **Automated Auto-Fix Steps**:
   - Execute `npm run lint -- --fix` on web and backend applications.
   - For TypeScript compiler errors (`tsc --noEmit`), analyze exact line numbers and apply minimal, type-safe fixes.
   - For Android Kotlin errors, verify brace balancing, import statements, and REST/WebSocket DTO contracts against the backend.

3. **Verification**:
   - Re-run `node scripts/auto_fix_runner.js` to confirm all errors have been cleanly resolved (0 failures).
