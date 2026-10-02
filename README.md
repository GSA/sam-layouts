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

One more branch is retained: `thread`, which branches off `master`'s history (merge base `67d8d0b`, 7 commits ahead) and is pending a disposition decision — see [Retired branches](#retired-branches) below.

`main` has no merge base with `master` or with the `angular-18` head. `angular-18` is deleted, but GitHub keeps its head at `refs/pull/49/head`, so any clone can still fetch it:

```sh
git merge-base origin/main origin/master  # exit 1, no output

git fetch origin refs/pull/49/head        # angular-18 head, a79508e
git merge-base origin/main FETCH_HEAD     # exit 1, no output
```

`angular-19` and `feature/IAEMOD-57632` **are** ancestors of `main`, so their commits are in every clone even though the branches are gone — check them by SHA, not by ref:

```sh
git merge-base --is-ancestor ffc454ec4939207010d70932c2f3b2913639ec54 origin/main # true, angular-19
git merge-base --is-ancestor caf221fba36a9bfe3c801667ef2bdff23bbcc79a origin/main # true, feature/IAEMOD-57632
```

### No feature work was lost

When `main` was scaffolded fresh via Nx, it looked like 30+ Jira fixes from the `angular-18` line had been dropped. They were not — this was re-verified:

```sh
git fetch origin refs/pull/49/head # angular-18 head, a79508e
git diff -w --stat FETCH_HEAD:layouts/src/lib origin/main:sam-layouts/src/lib
# 28 files changed, 47 insertions(+)
```

- **Zero deletions** across the entire library diff — nothing on `angular-18` was dropped.
- All 47 added lines are `standalone: false,` stamped onto existing components. (Before [#58](https://github.com/GSA/sam-layouts/pull/58) removed the leftover Nx scaffold component `layouts.component.{ts,html,css}` — `<p>Layouts works!</p>` — this diff read `31 files changed, 58 insertions(+)`, the extra 11 lines being that scaffold.)
- Spot-check: `stepper.component.html`, `stepper.component.scss`, and `stepper.module.ts` are **byte-identical** between the `angular-18` head and `main` — IAEMOD-39957 (stepper list icon) and IAEMOD-39122 (screen-reader message) are both present on `main`.

**This is a git-hygiene problem, not a content-recovery problem.** No cherry-pick or port of any `angular-*`/`IAEMOD-*` commit is required.

### `master` / `old-main` — retained, read-only

`master` and `old-main` are kept but must not be modified or deleted:

1. They are the pre-Nx historical tree.
2. `master` is the **live GitHub Pages source** — `gh api repos/GSA/sam-layouts/pages` returns `{"branch":"master","path":"/docs"}`, serving https://gsa.github.io/sam-layouts/. **Deleting `master` takes the public docs site down.** It stays until the Wave 2 Storybook Pages deploy replaces that source.

### Retired branches

**40 stale branches** (the `angular-*`/`IAEMOD-*` chain and assorted misc branches) have been deleted from `origin`, taking it from 46 branches down to four long-lived refs — `main`, `master`, `old-main`, `thread` — plus whatever short-lived `gh-*` branches are in flight. Every one was verified to contain no content absent from `main`, or to have had its content explicitly dispositioned, before deletion. The full branch → SHA list is in the closing comments on [#53](https://github.com/GSA/sam-layouts/issues/53).

Recoverability is **not uniform**. Of the 40:

- **34 are durably recoverable from `origin` itself.** 32 heads are reachable from a `refs/pull/N/head` ref, which GitHub retains indefinitely and does not prune; `angular-19` (`ffc454e`) and `feature/IAEMOD-57632` (`caf221f`) are ancestors of `main`.
- **6 are reachable by SHA only, and only until GitHub garbage-collects them** — `ang13` (`5ceb702`), `angular-14` (`d13c943`), `angular-14-2` (`c939d2c`), `footer` (`8df95f7`), `IAEMOD-29493` (`4d3833e`), `IAEMOD-29493-1` (`e04d266`). `git fetch origin <sha>` works today, but no ref on `origin` points at them, so that is not a guarantee. All six were verified content-complete on `main` before deletion (see #53); no durable archive ref has been pushed for them.
- **The only complete archive is a local `git bundle`** of all 46 pre-deletion `origin` branches, held on one workstation at `.branch-backup/`. It is not team-accessible and should not be relied on.

Restore a branch:

```sh
# from a PR ref (durable)
git fetch origin refs/pull/49/head && git push origin FETCH_HEAD:refs/heads/angular-18

# by SHA (works only while the object survives on origin)
git fetch origin 5ceb702886aa7f9a789f9ea78b93740839e48585 && git push origin FETCH_HEAD:refs/heads/ang13
```

Three of those 40 carried content that was **not** on `main`, and were deleted only after a deliberate decision:

| Branch                       | Unique content                                                                  | Disposition                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `help-slide-search`          | `helpSearchEvent` output on the header, wiring help-dialog search               | PR [#14](https://github.com/GSA/sam-layouts/pull/14) closed with the gap recorded; reapply against `main` if still wanted |
| `footerfix` / `angular-14-2` | A one-line footer fix (`margin-left-neg-10`) on neither `main` nor `angular-18` | Discarded — trivial to reapply                                                                                            |

**`thread` is retained** pending a disposition decision. It holds a complete, never-merged comment-thread component (859 lines, 11 files, last touched 2022-05-20) that exists on **no other branch in this repo**; its head commit `b2b34ab` is additionally preserved at `refs/pull/6/head` from closed PR [#6](https://github.com/GSA/sam-layouts/pull/6). Tracked on [#61](https://github.com/GSA/sam-layouts/issues/61).

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
