# `groqd v0.x` Workflow

This `groqd-legacy` package is the source for the `v0.x` releases of `groqd`.

If we need to publish a release for `groqd @ 0.x`, please use the following workflow:

# TL;DR:

- Merge a normal PR into `main`
- Merge `main` into `groqd-legacy-publish`
- Merge the auto-generated PR (**Version Packages (legacy)**)

# Step 1: a normal PR

Create a normal PR:

- Branch from `main`
- Make changes to `groqd-legacy` code
- Create PR into `main`
- Add a Changeset file to this PR with a description of the change 
  - Run `npm run changeset`
  - or when the PR is created, click the automated "create changeset" comment
- Merge PR into `main`

# Step 2: merge into `groqd-legacy-publish` branch

- Merge `main` into the `groqd-legacy-publish` branch.
- This will create an automated PR called **Version Packages (legacy)**.
- ✨ **IMPORTANT STEP** In this PR, the version will be bumped with a "prerelease" tag, like `v0.15.15-legacy.0`
  - Manually edit `package.json`, and remove the `-legacy.0` part.  Then commit it to the PR.
  - This ensures we don't release as a "prerelease".
- Approve and merge this PR into `groqd-legacy-publish`.
