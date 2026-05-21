# mp-facilito

Plugin marketplace for Claude Code.

## Structure

```
.claude-plugin/marketplace.json       # Marketplace registry
plugins/<plugin-name>/
  package.json                        # npm package (name + version)
  .claude-plugin/plugin.json          # Plugin manifest (name + version)
  skills/<skill-name>/SKILL.md
```

## Plugin versioning

Versions are managed with [@changesets/cli](https://github.com/changesets/changesets).
The source of truth for each plugin's version is its `plugins/<name>/package.json`.
Running `npm run version` propagates that version into:

- `plugins/<name>/.claude-plugin/plugin.json` — plugin manifest
- `.claude-plugin/marketplace.json` — marketplace registry entry

**Never edit version fields in `plugin.json` or `marketplace.json` by hand.**

### Release workflow

```sh
# 1. After changing a plugin, create a changeset
npm run changeset        # or: npx changeset add

# 2. When ready to release, apply all pending changesets
npm run version          # bumps package.json + syncs plugin.json + marketplace.json

# 3. Commit the result
git add -A && git commit -m "chore: release"
```

### Bump types

| Type    | When to use                              | Example        |
|---------|------------------------------------------|----------------|
| `patch` | Bug fixes, small improvements            | 0.0.1 → 0.0.2 |
| `minor` | New skills or non-breaking features      | 0.0.1 → 0.1.0 |
| `major` | Breaking changes to existing behaviour   | 0.0.1 → 1.0.0 |

### Adding a new plugin

1. Create `plugins/<plugin-name>/package.json` with `name` and `version`.
2. Create `plugins/<plugin-name>/.claude-plugin/plugin.json` with the same `name`.
3. Add an entry to `.claude-plugin/marketplace.json` under `plugins[]` with the same `name`.
4. The sync script (`scripts/sync-versions.mjs`) discovers all plugin directories automatically.
