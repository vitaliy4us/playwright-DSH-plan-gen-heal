# Conduit (RealWorld) Test Plan

## Application Overview

[Conduit](https://conduit.bondaracademy.com/) is the RealWorld demo application: a Medium-like blogging platform used as a reference app by the Bondar Academy Playwright course. The parts exercised by this plan are:

- **Authentication** — a "Sign in" link in the navbar opens `/login`; after a successful sign-in the user is returned to the home page and the username is shown in the navbar.
- **Articles** — "New Article" opens the `/editor` page with three fields (Article Title, "What's this article about?", "Write your article"); publishing leads to the article details page at `/article/...`, where "Edit Article" and "Delete Article" are available to the author.
- **Feed** — the home page lists article previews (`.article-preview`) with a Global Feed / Your Feed toggle (`.feed-toggle`).
- **Comments** — the article details page contains a comment form ("Write a comment..." + "Post Comment").

This project automates the same manual test case **twice** — once through **Playwright MCP** and once through **playwright-cli** — in order to compare the two approaches (see `README.md`).

## Test data and environment

- Scenarios sign in with a shared demo account. Credentials default to the course demo user and can be overridden with `CONDUIT_EMAIL` / `CONDUIT_PASSWORD`.
- Articles are created with a unique timestamp suffix in the title, and are deleted at the end of the scenario, so a successful run leaves the site clean.
- Every scenario starts from `tests/seed.spec.ts`, which navigates to the application root.
- **Known limitation:** if a scenario fails before its delete step, the created article stays on the site. The suite mutates shared public data, which is why it is deliberately not wired into CI.

## Test Scenarios

### 1. Articles

**Seed:** `tests/seed.spec.ts`

#### 1.1. Create a new article — automated through Playwright MCP

**File:** `tests/create-new-article.spec.ts`

**Steps:**
  1. Open the application and click "Sign in" in the navbar; sign in with the demo account
    - expect: the URL matches `/login` and the "Sign in" heading is visible
    - expect: after submitting, the URL is the home page and `.navbar` contains the username
  2. Click the "New Article" link
    - expect: the URL matches `/editor`
  3. Fill Article Title, description and body with values carrying a unique timestamp, then click "Publish Article"
    - expect: the URL matches `/article/` and the article heading is visible
    - expect: the article body is visible on the details page
  4. Verify the author controls and the comment form
    - expect: "Edit Article" and "Delete Article" are visible
    - expect: "Write a comment..." and "Post Comment" are visible
  5. Go back to the home page and find the created article in the Global Feed
    - expect: the URL is the home page and the "Global Feed" tab is active ("Your Feed" is not active)
    - expect: an article preview carrying the created title is visible
  6. Open that preview
    - expect: the URL matches `/article/`, the heading is visible and "Delete Article" is available
  7. Delete the article
    - expect: the URL returns to the home page and no heading with that title remains

#### 1.2. Create a new article — automated through playwright-cli

**File:** `tests/create-new-article-cli.spec.ts`

**Steps:** identical to 1.1. The only differences are the article title prefix (`PW CLI Article`) and the way the test was produced: the CLI workflow drives a paused test (`--debug=cli` → `attach` → `step-over` → walk the steps) instead of MCP tool calls.

> Note on step 5: the manual test case asks to verify that the **first** article in the feed is the one just created. With two scenarios sharing one account and running in parallel, that ordering is not guaranteed — a parallel test can publish its own article in between. Both automated scenarios therefore assert that **an article preview with the created title** is present (and open it), which is the meaningful part of the check. See `README.md`.

## Backlog — planned scenarios, not automated yet

These scenarios come from the project plan. They are listed here so the gap between the plan and the suite is explicit; each one still needs to be explored in the live application before it can be generated (the expectations below are intents, not yet verified behaviour).

| # | Scenario | Intent |
|---|---|---|
| 2.1 | should-sign-in-with-valid-credentials | Signing in with the demo account returns to the home page and shows the username in the navbar |
| 2.2 | should-reject-invalid-credentials | Signing in with a wrong password keeps the user on `/login` and shows an error message |
| 2.3 | should-edit-an-existing-article | Editing the title and body of an owned article updates the article details page and the feed entry |
| 3.1 | should-post-a-comment-on-an-article | Posting a comment on an article shows it in the comment list under the article |
| 3.2 | should-delete-own-comment | Deleting an own comment removes it from the comment list |
