---
description: Run the full speckit workflow end-to-end — specify, plan, tasks, implement, and review.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

This command orchestrates the complete speckit pipeline in sequence. Each step must fully complete before proceeding to the next. If any step fails or the user requests a stop, halt the pipeline. Each step must be execute in a new context.

### Pipeline Steps

Execute the following skills **in order**, one at a time:

1. **Specify** — `/speckit.specify $ARGUMENTS`
   - Creates the feature branch and writes the specification
   - Wait for full completion (including any clarification questions)
   - If the user cancels or the spec fails validation after 3 iterations, **stop the pipeline**

2. **Plan** — `/speckit.plan`
   - Generates the technical implementation plan from the spec
   - Wait for full completion before proceeding

3. **Tasks** — `/speckit.tasks`
   - Breaks the plan into an actionable, dependency-ordered task list
   - Wait for full completion before proceeding

4. **Implement** — `/speckit.implement`
   - Executes all tasks phase by phase following TDD approach
   - Wait for full completion (all tasks marked done, tests passing)
   - If implementation fails on a critical task, **stop the pipeline** and report status

5. **Review** — `/speckit.review`
   - Runs the comprehensive code review across all changed files
   - Reports findings with the standard summary format

### Execution Rules

- **Sequential only**: Each step depends on the output of the previous one
- **No skipping**: All 5 steps must run in order
- **User interaction**: If any step requires user input (clarifications, checklist confirmation), pause and wait for the response before continuing
- **Error handling**: On failure, report which step failed, what went wrong, and stop — do not attempt to continue with downstream steps
- **Progress reporting**: After each step completes, print a brief status line:

  ```
  [1/5] Specify   — done
  [2/5] Plan      — done
  [3/5] Tasks     — done
  [4/5] Implement — done
  [5/5] Review    — done
  ```

### Completion

After the review step finishes, provide the final summary:

- Feature branch name
- Spec, plan, tasks file paths
- Review results (critical/important issues count)
- Recommended next actions (fix issues, create PR, etc.)
