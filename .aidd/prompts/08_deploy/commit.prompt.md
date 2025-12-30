---
name: commit
description: Create git commit with proper message format
argument-hint: auto 
---

# Commit Prompt

## Goal

Generate git commit with standardized message following project conventions.

## Rules

- **If `auto` mode is enabled, do not ask for user confirmation**.
- Respect already defined commit rules
- Keep commits atomic and focused
- Clear and concise change description
- Follow previous commit message format
- Include change type prefix
- Reference issues if applicable
- Imperative mood ("Add feature" not "Added feature")
- Explain "why", not "what"
- Never skip git hooks if any, fix issues if any

## Context

### Commit rules

```markdown
@.aidd/templates/vcs/commit.md
```

### Previous commits

```text
!`git log -5 --pretty=%B`
```

## Process steps

1. If branch does not exist, propose a name based on changes + **WAIT FOR USER APPROVAL**
2. Check staged changes
3. Determine change type (feat, fix, docs, etc)
4. Suggests splitting commits for different concerns:
   1. Make a list of functional changes with clear commit messages
   2. **WAIT FOR USER APPROVAL** before committing
5. Execute git add patch for dedicated part of the feature
6. Run git commit with generated messages
7. If pre-commit errors, fix and retry to commit:
   1. loop here until you can commit
8. Verify commits success
9. List them to user
10. If `auto` mode: push the branch to remote
11. Notify user of completion
