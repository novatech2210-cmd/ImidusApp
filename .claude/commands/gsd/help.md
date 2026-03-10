---
name: gsd:help
description: Show available GSD commands and usage guide
---

<objective>
Display the complete GSD command reference.

Output ONLY the reference content below. Do NOT add:

- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
  </objective>

<execution_context>
@./.claude/get-shit-done/workflows/help.md
</execution_context>

<context>
**Source of Truth:** INI_Restaurant database (MS SQL Server 2005 Express) — all GSD commands and workflows operate within database integration constraints.
</context>

<process>
Output the complete GSD command reference from @./.claude/get-shit-done/workflows/help.md.
Display the reference content directly — no additions or modifications.
</process>
