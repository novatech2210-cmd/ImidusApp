---
name: gsd:health
description: Diagnose planning directory health and optionally repair issues
argument-hint: [--repair]
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---

<objective>
Validate `.planning/` directory integrity and report actionable issues. Checks for missing files, invalid configurations, inconsistent state, and orphaned plans.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/health.md
</execution_context>

<context>
**Source of Truth:** INI_Restaurant database (MS SQL Server 2005 Express) — health checks validate planning state aligns with database integration requirements.
</context>

<process>
Execute the health workflow from @./.claude/get-shit-done/workflows/health.md end-to-end.
Parse --repair flag from arguments and pass to workflow.
</process>
