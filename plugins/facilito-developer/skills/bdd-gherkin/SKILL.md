---
name: bdd-gherkin
description: >
  Set up and write BDD (Behavior-Driven Development) tests using Gherkin for Next.js frontend apps and NestJS backend APIs in a TypeScript monorepo. Use this skill whenever the user mentions BDD, Gherkin, Cucumber, feature files, Given/When/Then, acceptance tests, scenario testing, or asks how to add BDD testing to a Next.js or NestJS project. Also use it when the user is setting up vitest-cucumber, @cucumber/cucumber, or writing step definitions for TypeScript projects.
---

# BDD / Gherkin Testing — Next.js + NestJS

This skill covers the end-to-end setup for writing BDD tests with Gherkin (`.feature` files and step definitions) in a TypeScript monorepo, using the right library for each tier:

| Tier | Library | Test runner |
|------|---------|-------------|
| **Frontend** (Next.js) | `@amiceli/vitest-cucumber` | Vitest (existing) |
| **Backend** (NestJS) | `@cucumber/cucumber` | Cucumber CLI (standalone) |

---

## Frontend — Next.js with `@amiceli/vitest-cucumber`

### Install

`@amiceli/vitest-cucumber` v5 requires **Vitest ≥ 3.1**. If the project has Vitest 2, upgrade both together:

```bash
pnpm --filter <app> add -D vitest@^3.1 @amiceli/vitest-cucumber@^5.2
# v6 of vitest-cucumber requires Vitest ^4 — pick the pair that matches
```

### Directory layout

```
apps/my-app/
  features/
    album.feature          ← Gherkin scenarios
  src/
    __tests__/
      album.feature.spec.mts   ← Vitest spec that maps steps
  vitest.config.mts
```

### Write the `.feature` file

```gherkin
# features/album.feature
Feature: Album sticker collection

  Scenario: User starts with an empty collection
    Given the user has no stickers
    Then the collection should be empty
    And the completion percentage should be 0

  Scenario: User marks a sticker as collected
    Given the user has no stickers
    When the user collects sticker number 1
    Then the collection should contain sticker 1
```

### Write the spec file

Use `.mts` extension so Vitest picks it up in ESM mode.

```typescript
// src/__tests__/album.feature.spec.mts
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'

// ⚠️ Path is relative to the project's CWD (root), NOT the spec file location
const feature = await loadFeature('features/album.feature')

describeFeature(feature, ({ Scenario }) => {
  Scenario('User starts with an empty collection', ({ Given, Then, And }) => {
    let collection: number[] = []

    Given('the user has no stickers', () => {
      collection = []
    })
    Then('the collection should be empty', () => {
      expect(collection).toHaveLength(0)
    })
    And('the completion percentage should be 0', () => {
      expect(collection.length).toBe(0)
    })
  })

  Scenario('User marks a sticker as collected', ({ Given, When, Then }) => {
    let collection: number[] = []

    Given('the user has no stickers', () => {
      collection = []
    })
    When('the user collects sticker number {int}', (_ctx, n: number) => {
      collection.push(n)
    })
    Then('the collection should contain sticker {int}', (_ctx, n: number) => {
      expect(collection).toContain(n)
    })
  })
})
```

### Run

```bash
pnpm --filter <app> test          # vitest run (picks up *.spec.mts automatically)
pnpm --filter <app> test:watch    # watch mode
```

### Key gotchas — frontend

- **`loadFeature` resolves relative to CWD**, not the calling spec file. If Vitest runs from `apps/my-app/`, then `loadFeature('features/album.feature')` works. Do **not** use `../../features/…` relative paths.
- **Vitest version pairing**: v5.x of vitest-cucumber → Vitest 3.x. v6.x → Vitest 4.x. Mixing versions causes an unmet peer dependency error.
- **Step parameters**: use `{int}`, `{string}`, `{float}` in Gherkin step text; the step callback receives `(ctx, ...params)` — `ctx` is always first.
- **Global config** (tags, language): call `setVitestCucumberConfiguration()` in a Vitest setup file referenced via `setupFiles` in `vitest.config.mts`.

---

## Backend — NestJS with `@cucumber/cucumber`

### Install

```bash
pnpm --filter <api> add -D @cucumber/cucumber
# ts-node is usually already present in NestJS projects; if not:
pnpm --filter <api> add -D ts-node tsconfig-paths
```

> **Do NOT use `tsx` for TypeScript transpilation.** tsx is esbuild-based and does not support `emitDecoratorMetadata`, which NestJS requires for its dependency injection. Without it, injected services will be `undefined` at runtime and routes return 500. Use `ts-node` instead — it uses the real TypeScript compiler and respects your `tsconfig.json`.

### Directory layout

```
apis/my-api/
  features/
    album.feature                       ← Gherkin scenarios
    step-definitions/
      album.steps.ts                    ← Step definitions
  cucumber.json                         ← Cucumber CLI config
  src/
    app.module.ts
    ...
```

### `cucumber.json`

```json
{
  "default": {
    "requireModule": ["ts-node/register", "tsconfig-paths/register"],
    "require": ["features/step-definitions/**/*.ts"],
    "paths": ["features/**/*.feature"],
    "format": ["progress-bar", "html:reports/cucumber-report.html"]
  }
}
```

### Write the `.feature` file

```gherkin
# features/album.feature
Feature: Album API

  Scenario: API returns a healthy status
    Given the API is running
    When a client sends a GET request to "/"
    Then the response status should be 200
    And the response body should contain a greeting
```

### Write step definitions

```typescript
// features/step-definitions/album.steps.ts
import 'reflect-metadata'  // ⚠️ must be first — NestJS DI needs it
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import * as assert from 'assert'

let app: INestApplication
let response: request.Response

Before(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  app = moduleFixture.createNestApplication()
  await app.init()
})

After(async () => {
  await app.close()
})

Given('the API is running', () => {
  assert.ok(app, 'App should be initialized')
})

When('a client sends a GET request to {string}', async (path: string) => {
  response = await request(app.getHttpServer()).get(path)
})

Then('the response status should be {int}', (status: number) => {
  assert.strictEqual(response.status, status)
})

Then('the response body should contain a greeting', () => {
  assert.ok(response.text, 'Response body should not be empty')
})
```

### Add the script to `package.json`

```json
{
  "scripts": {
    "test:bdd": "cucumber-js"
  }
}
```

### Run

```bash
pnpm --filter <api> test:bdd
```

### Key gotchas — backend

- **`import 'reflect-metadata'` must be the very first import** in any step definition file that loads NestJS modules. NestJS decorators emit metadata only if `reflect-metadata` is already loaded. Forgetting it causes services injected via DI to be `undefined`, giving a 500 response with a misleading error like `Cannot read properties of undefined`.
- **Import style for supertest**: use `import * as request from 'supertest'` (the same style as NestJS's generated e2e tests). This works correctly with ts-node. The `import request = require('supertest')` form is an alternative that also works.
- **`tsconfig-paths/register`** is needed if your `tsconfig.json` defines path aliases (e.g. `@/*`). Safe to include even when not strictly necessary.
- **HTML report**: `cucumber-js` writes `reports/cucumber-report.html` after each run — useful for reviewing scenario results. Add `reports/` to `.gitignore`.
- **Before/After hooks** run once per scenario. For expensive setup (DB seeding, server boot), consider `BeforeAll`/`AfterAll` hooks from `@cucumber/cucumber`.

---

## Gherkin quick reference

```gherkin
Feature: <name>

  Background:           # runs before every Scenario in this file
    Given ...

  Scenario: <name>
    Given <initial state>
    When  <action>
    Then  <expected outcome>
    And   <additional assertion>  # same keyword as the previous step
    But   <negative assertion>

  Scenario Outline: <name with <placeholder>>
    Given a <type> user
    When they do <action>
    Then the result is <result>

    Examples:
      | type  | action | result |
      | admin | login  | dashboard |
      | guest | login  | error  |
```

**Parameter expressions in step text:**

| Expression | TypeScript type | Example text |
|-----------|-----------------|--------------|
| `{int}`   | `number`        | `collects sticker number 1` |
| `{float}` | `number`        | `costs $9.99` |
| `{string}`| `string`        | `sends a GET request to "/"` |
| `{word}`  | `string`        | `user is admin` |

---

## `.gitignore` additions

```
reports/          # cucumber html reports
```
