# PROMPTS.md — Antigravity + Gemini 3 Control Pack (Copy/Paste)

Use these prompts to keep Gemini on rails. Rule: **one milestone per prompt**.

---

## Prompt A — Session Kickoff (Milestone 0 only)
Read `GEMINI.md` fully before doing anything.
Create the repo `thevibecheck-cards` and complete **Milestone 0 only**.
Do not continue to Milestone 1.
When done, STOP and provide the mandatory “Stop & Report” format.

---

## Prompt B — Continue to next milestone
Milestone confirmed working.
Proceed to the next milestone only.
STOP and provide the mandatory “Stop & Report” format.

---

## Prompt C — Fix Mode (no new features)
Something is broken.
Do NOT add features or refactor.
Find the root cause, fix it, re-test locally, then report what changed.

---

## Prompt D — Stop Drift / Return to Contract
You are drifting from `GEMINI.md`.
Stop and re-read `GEMINI.md`.
Return to the current milestone requirements.
Do not do extra work.

---

## Prompt E — Supabase Setup Guidance
Walk me through creating a Supabase project and obtaining:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
Then help me set `.env.local` correctly.
Do not proceed to other milestones.

---

## Prompt F — Final Verification
Run through the full end-to-end test:
1) sign up
2) create card
3) add image + text
4) export faces
5) create share link
6) open `/c/[token]` as a guest
Confirm each step passes and note any issues.
