# AGENTS.md

Tic-Tac-Doh — React Native (Expo SDK 54) tic-tac-toe game for iOS, Android, and web; human/CPU matches.

## Reference Docs

See `.agents/reference/` for this project's reference docs — one topic per file,
each with a `name` and `description` in its own frontmatter. Read the ones
relevant to what you're working on before scanning source.

See `.agents/decisions/` for this project's architectural decision records —
what was chosen, what was rejected, and why. Read its index before proposing an
approach; a past decision may already settle the question, or may have rejected
the approach you are about to take.

Whenever anything in the architecture changes (UI, APIs, database schema, permissions, features, deployment, etc.), update the relevant reference file(s) in the *same* change — not as a follow-up. This is mandatory, not best-effort: reference docs are the first-line summary of the project's actual state, used to explain the system and to ground all planning and implementation work. A stale reference doc is worse than no doc — it actively misleads. If you discover a reference doc that no longer matches the code, correct it immediately, even if it's unrelated to the change you're making.

# Development Process

Work every issue through this loop:

1. **Refine the issue** — clarify acceptance criteria, edge cases, and non-goals before writing any code.
2. **Plan** — short technical plan: approach, files touched, schema/API changes, risks. Post as an issue comment.
3. **Implement**
   - Follow red/green TDD: write a failing test, make it pass, refactor.
   - Update e2e tests for any user-facing flow touched. For API changes, the e2e test must exercise the route itself, not the handler directly.
4. **Update reference docs** in `.agents/reference/` in the same change (see above — not a follow-up).
5. **Open a PR**: link the issue (both the `Closes #N` keyword and the full issue URL), describe what changed, and give a `- [ ]` checklist under "How to test" so testing progress can be tracked and checked off.
6. **Execute the manual test plan** — walk the PR checklist, checking off each item as it's verified. If something can't be verified (no device, no external service), leave it unchecked and say so explicitly.
7. **Before pushing**, run lint, type-check, and tests on affected code — do not rely on CI to catch these. (See `.agents/reference/commands.md` for the exact commands.)
8. **Merge and update the issue** — close it, link the PR, check off acceptance criteria.
9. **Log a short summary** of what was done, any deviations from the plan, and follow-up issues created.

# Guardrails

**GitHub Actions need explicit permission.** Never create, edit, or delete
anything under `.github/workflows/` or `.github/actions/` unless the user has
explicitly said to, in this session. In an autonomous run an issue that asks for
a workflow is *not* that permission — stop and ask. Supervised, an issue that
names the workflow explicitly, or the user saying so in conversation, is enough.
Actions run with the repo's secrets, which is why this is gated.

**Web publishing goes through the `deploy-app` skill.** Merging to `main` does not deploy. Do not trigger the Pages workflow or publish the web build any other way.
