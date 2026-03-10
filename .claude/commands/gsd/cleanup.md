---
name: gsd:cleanup
description: Archive accumulated phase directories from completed milestones
---

<objective>
Archive phase directories from completed milestones into `.planning/milestones/v{X.Y}-phases/`.

Use when `.planning/phases/` has accumulated directories from past milestones.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/cleanup.md
</execution_context>

<context>
**Source of Truth:** INI_Restaurant database (MS SQL Server 2005 Express) — archived phases maintain historical record of database integration work.
</context>

<process>
Follow the cleanup workflow at @./.claude/get-shit-done/workflows/cleanup.md.
Identify completed milestones, show a dry-run summary, and archive on confirmation.
</process>
