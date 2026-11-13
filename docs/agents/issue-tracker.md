# Issue tracker workflow

## Identity and access

- Tracker: GitHub issues at <https://github.com/GSA/sam-layouts/issues>.
- Repository: `GSA/sam-layouts`; host: `github.com` (public GitHub, not Helix).
- Use authenticated GitHub CLI with an explicit repository, for example:
  `GH_HOST=github.com gh issue view 104 --repo GSA/sam-layouts --json url,body,state`.
- Confirm the returned canonical issue URL before working. Jira references provide
  context; they do not replace the GitHub issue's acceptance criteria.

## Issue contract

Implementation issues must declare `Type` (`AFK` or `HITL`), `Acceptance criteria`,
and `Blocked by` in their bodies. Missing or ambiguous fields require clarification.
Do not infer automation authority from labels. Closed blockers require evidence
that their relevant changes are integrated into the approved base and checks pass.

## Branches and worktrees

- Issue branches: `gh-<number>-<slug>`.
- Spec aggregation branches: `spec/<slug>`, distinct from shared `main`.
- Select and explicitly approve the base ref and exact SHA before creating branches.
- Use the approved isolated worktree backend; one writer per checkout. Serialize
  integrations and shared manifest/lockfile changes.
- An existing branch or worktree is a collision unless explicitly approved for resume.

## Approval boundaries

Approve the scope, public-interface TDD plan, checks, and integration permissions
before implementation. AFK allows execution of that approved plan, not bypassing
human handback or final review. HITL checkpoints must be explicitly confirmed.

No automatic push, PR creation, issue closure, merge to `main`, worktree cleanup,
tagging, publication, credential changes, or protected-setting changes. These
require separate authorization. Angular 21 is the supported migration endpoint;
release of public `@gsa-sam/layouts` remains separately human-gated.
