# SamLayouts

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve sam-layouts
```

To create a production bundle:

```sh
npx nx build sam-layouts
```

To see all available targets to run for a project, run:

```sh
npx nx show project sam-layouts
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Branch of record

`main` is the **branch of record** and the default branch (`gh repo view GSA/sam-layouts --json defaultBranchRef` → `main`). All new work branches from and merges into `main`.

### Three disjoint git histories

This repo has three git histories that share no common ancestor with each other:

| Branch(es)                        | Commits                                                       | Status                          |
| --------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| `main`                            | 7                                                             | **Branch of record**            |
| `master`, `old-main`              | 145 (byte-identical, both `a0739b5`, last touched 2023-05-03) | Retained, read-only — see below |
| `angular-11` … `angular-18` chain | 92                                                            | Retired (deleted)               |

One branch outside these histories — `thread` — is retained pending a disposition decision; see [Retired branches](#retired-branches) below.

`main` has no merge base with `master` or with `angular-18`:

```sh
git merge-base origin/main origin/master    # exit 1, no output
git merge-base origin/main origin/angular-18 # exit 1, no output
```

`angular-19` and `feature/IAEMOD-57632` **are** ancestors of `main`:

```sh
git merge-base --is-ancestor origin/angular-19 origin/main          # true
git merge-base --is-ancestor origin/feature/IAEMOD-57632 origin/main # true
```

### No feature work was lost

When `main` was scaffolded fresh via Nx, it looked like 30+ Jira fixes from the `angular-18` line had been dropped. They were not — this was re-verified:

```sh
git diff -w --stat origin/angular-18:layouts/src/lib origin/main:sam-layouts/src/lib
# 31 files changed, 58 insertions(+), 0 deletions(-)
```

- **Zero deletions** across the entire library diff — nothing on `angular-18` was dropped.
- Of the 58 added lines, **47 are `standalone: false,`** stamped onto existing components; the remaining 11 are the leftover Nx scaffold component `layouts.component.{ts,html,css}` (`<p>Layouts works!</p>`), since deleted in #58.
- Spot-check: `stepper.component.html`, `stepper.component.scss`, and `stepper.module.ts` are **byte-identical** between `angular-18` and `main` — IAEMOD-39957 (stepper list icon) and IAEMOD-39122 (screen-reader message) are both present on `main`.

**This is a git-hygiene problem, not a content-recovery problem.** No cherry-pick or port of any `angular-*`/`IAEMOD-*` commit is required.

### `master` / `old-main` — retained, read-only

`master` and `old-main` are kept but must not be modified or deleted:

1. They are the pre-Nx historical tree.
2. `master` is the **live GitHub Pages source** — `gh api repos/GSA/sam-layouts/pages` returns `{"branch":"master","path":"/docs"}`, serving https://gsa.github.io/sam-layouts/. **Deleting `master` takes the public docs site down.** It stays until the Wave 2 Storybook Pages deploy replaces that source.

### Retired branches

**40 stale branches** (the `angular-*`/`IAEMOD-*` chain and assorted misc branches) have been deleted from `origin`, taking it from 46 refs to 7. Every one was verified to contain no content absent from `main`, or to have had its content explicitly dispositioned, before deletion. They are recoverable from a local `git bundle` of all 54 refs taken immediately before deletion; the full branch → SHA list is recorded in the closing comment on [#53](https://github.com/GSA/sam-layouts/issues/53).

Three of those 40 carried content that was **not** on `main`, and were deleted only after a deliberate decision:

| Branch                       | Unique content                                                                  | Disposition                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `help-slide-search`          | `helpSearchEvent` output on the header, wiring help-dialog search               | PR [#14](https://github.com/GSA/sam-layouts/pull/14) closed with the gap recorded; reapply against `main` if still wanted |
| `footerfix` / `angular-14-2` | A one-line footer fix (`margin-left-neg-10`) on neither `main` nor `angular-18` | Discarded — trivial to reapply                                                                                            |

**`thread` is retained** pending a disposition decision. It holds a complete, never-merged comment-thread component (859 lines, 11 files, last touched 2022-05-20) that exists on **no other ref in this repo**, so deleting it would destroy the only copy. Tracked on [#61](https://github.com/GSA/sam-layouts/issues/61).

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
