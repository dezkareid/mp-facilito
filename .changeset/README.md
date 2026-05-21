# Changesets

This directory contains changesets that describe pending version bumps.

## Workflow

1. **After making changes to a plugin**, add a changeset:
   ```sh
   npm run changeset
   ```
   Select the affected plugin(s) and choose the bump type (patch/minor/major).

2. **To apply all pending changesets** and release:
   ```sh
   npm run version
   ```
   This runs `changeset version` (bumps `package.json` versions) and then
   `scripts/sync-versions.mjs` (propagates versions to `plugin.json` and
   `marketplace.json`).

3. **Commit the resulting changes** and push.
