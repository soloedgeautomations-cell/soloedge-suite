# SoloEdge Project — Prompt Library

Reusable prompts for Manus tasks. Copy and paste into Manus.

**Credit-conservation defaults (apply to every task in this project automatically):**
- Single browser session. Do not re-visit pages.
- Exact URLs only — no exploratory browsing.
- Plain-text output only — no screenshots unless explicitly requested.
- Max 3 scrolls per section; capture visible content; note "TRUNCATED" if longer.
- If blocked, rate-limited, or paywalled: stop and report what was collected. No retries.
- No action buttons of any kind unless explicitly instructed.

**Context tags:**
- `[SOLOEDGE — PRODUCT]` for dashboard, agent, and infrastructure work
- `[GARY — PERSONAL / JOB SEARCH]` for LinkedIn, resume, and job search work

---

## Prompt 1: LinkedIn Profile + Company Pages Read-Only Pull
**Context: [GARY — PERSONAL / JOB SEARCH]**
**Goal:** Extract data needed to rewrite Gary's LinkedIn for AI Engineer positioning. Read-only, single session, output one text doc.

```
TASK: Read-only extraction of my LinkedIn profile and Company Pages. Single browser session. Plain-text output. No interactions of any kind.

CONSTRAINTS (to conserve credits — STRICT):
- One browser session. Do not re-visit pages.
- Read-only: never click follow, like, connect, send, save, apply, accept, or any action button.
- Visit ONLY the pages listed below.
- Do not open individual posts unless they appear in the Featured section.
- No screenshots. Plain text output only.
- Max 3 scrolls per section; capture visible content; note "TRUNCATED" if longer.
- If a section is empty/missing/blocked, write "EMPTY" or "BLOCKED" and move on. Do not retry.
- If you hit a paywall, rate limit, or sign-in wall, stop and report what you have.
- Do not browse beyond what is listed.

PAGES TO VISIT (in this exact order):

1. https://www.linkedin.com/in/gary-murphy-58a620403/

   Extract:
   - Profile photo: present / missing
   - Banner image: present / missing
   - Full name as displayed
   - Headline (line under the name)
   - Pronouns (if shown)
   - Location
   - "Open To Work" / "Hiring" badges (if any)
   - Connection count (e.g., "500+", "1,234")
   - Premium badge: yes / no
   - About section: full expanded text (click "see more")
   - Featured section: title and type of each pinned item (post / article / link / document)
   - Experience: every entry with dates, title, company, location, full description
   - Education: every entry with dates, school, degree, field
   - Licenses & Certifications: every entry with name, issuer, date, credential ID
   - Skills: top 30 listed
   - Recommendations: count given and received (just numbers)
   - Recent Activity: last 5 posts or reactions (date + first 100 chars of each)

2. Settings or "Edit public profile and URL" page

   Extract:
   - Current vanity URL slug (the part after /in/)
   - Whether the slug "garydmurphy" is claimed by this account, available, or taken by someone else

3. Profile menu → Manage / Pages section

   Extract:
   - List every Company Page where the account holder is an admin
   - For each page: exact name, URL, admin role, follower count

4. For each Company Page found above, visit it ONCE

   Extract per page:
   - Page name (exact)
   - URL slug (everything after /company/)
   - Tagline (one-liner under name)
   - About section (full text)
   - Industry, Company size, Headquarters
   - Follower count (exact number)
   - Last 3 post dates and titles only (do not extract post bodies)
   - Verified badge: yes / no

OUTPUT FORMAT:

- One single plain-text document
- Sections separated by lines of equals signs (=====)
- Section headers in ALL CAPS
- No HTML, no markdown styling, no images
- Append an "ERRORS" section at the end if anything failed

PROHIBITED ACTIONS (do not do any of these):

- Edit any LinkedIn content
- Send messages of any kind
- Apply to jobs
- Follow anyone
- Accept or send connection requests
- Like, comment, or react to anything
- Modify any settings
- Click "Premium free trial" or upgrade buttons
- Any action not explicitly listed in this prompt

When complete, output the full text document. Stop after that. Do not suggest next steps or take additional actions.
```

---

## Prompt 2: LinkedIn Job Search
**Context: [GARY — PERSONAL / JOB SEARCH]**
**Status: Draft — do not run yet (scheduled for next week)**

```
TASK: Find AI Engineer roles I should apply to. Read-only. Output: ranked list with JD summaries.

[draft for next week — don't run yet]
```

---

## Credit-Conservation Tips (General)

- Always set "single session, no re-visits" upfront
- List exact URLs; never let Manus "explore"
- Add explicit "do not click X" lists
- Demand plain-text output (HTML / screenshots cost more)
- Cap retries with "if blocked, stop"
- Max 3 scrolls per section — note "TRUNCATED" if content is longer
- Run during off-hours if your plan rate-limits during peak
