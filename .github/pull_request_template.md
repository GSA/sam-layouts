<!--- Start the title with a verb (e.g. Add, Fix, Update, Remove) -->
<!--- Use the imperative mood (e.g. Fix, not Fixed or Fixes) -->

## Description

<!--- Describe your changes in detail -->

## Motivation and Context

<!--- Link to the GitHub issue for this change (e.g. Closes #123) -->
<!--- If there is no existing issue, explain why this change is required and what problem it solves -->

Closes #<!-- issue number, e.g. 123 -->

## Type of Change (Select One and Apply Label)

- [ ] Bug fix (non-breaking change which fixes an issue) → Apply `bug` label
- [ ] New feature (non-breaking change which adds functionality) → Apply `enhancement` label
- [ ] Breaking change (fix or feature that would cause existing functionality to change) → Apply `breaking` label
- [ ] Documentation / configuration update → Apply `documentation` label
- [ ] Tooling, CI, or housekeeping → Apply `maintenance` label

## Manifest Changes

<!--- Dependency manifest edits must be serialized across in-flight PRs (see #52) -->
<!--- Reviewers need to see this at a glance before approving in parallel with other work -->

- [ ] This PR touches `package.json` and/or `package-lock.json`

## How to Test

<!--- Describe the steps a reviewer should follow to verify this change works as expected -->
<!--- Note: the Nx project names differ from the repo name — `layouts` is the library, `sam-layouts` is the demo app -->

1. <!-- Step one: e.g. `npx nx build layouts` -->
2. <!-- Step two: e.g. open the app and navigate to … -->
3. <!-- Step three: e.g. confirm the expected output -->

**Expected result:** <!-- Describe what a passing result looks like -->

## Screenshots (if appropriate)

<!--- Add screenshots or screen recordings showing the change in action. If not applicable, write "N/A". -->

## Checklist

<!--- All commands run through Nx. There are two separate projects: -->
<!--- `layouts` is the library, `sam-layouts` is the demo app. They are not interchangeable. -->

- [ ] Branch name follows convention (e.g. `gh-<number>-<slug>`)
- [ ] PR title starts with a verb in the imperative mood
- [ ] I have self-reviewed my own code
- [ ] `lint` is clean (`npm run lint:baseline`) — zero ESLint errors, and warnings at or below the per-project ceiling in `eslint-baseline.json`; if you paid debt down, run `npm run lint:baseline:bump` and commit the lowered ceiling on its own
- [ ] `build` passes for the library (`npx nx build layouts`)
- [ ] `build` passes for the demo app (`npx nx build sam-layouts`)
- [ ] Tests pass for the library (`npx nx test layouts`)
- [ ] Tests pass for the demo app (`npx nx test sam-layouts`)
- [ ] Storybook builds (`npx nx build-storybook sam-layouts`) — required if this PR touches components, stories, or dependencies
- [ ] If this change requires a documentation update, I have updated it accordingly
- [ ] If there are dependent changes, they have been merged and published in downstream modules
