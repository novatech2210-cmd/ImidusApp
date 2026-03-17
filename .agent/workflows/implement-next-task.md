---
description: Automatically identifies the next pending task from the project roadmap and executes it.
---

1. Read `.planning/ROADMAP.md` to identify the first incomplete phase and first missing/incomplete plan.
2. Verify the plan file exists in `.planning/phases/`.
3. Extract the tasks from the identified PLAN.md file.
4. Set the `task_boundary` to the identified phase and plan.
5. Execute the implementation tasks sequentially using `run_command` or other relevant tools.
6. Verify each task completion against the success criteria in the plan.
7. Update the `ROADMAP.md` and `task.md` upon successful completion of each task and plan.
