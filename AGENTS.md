# SoloEdge Agent Registry

This file tracks every AI agent in the SoloEdge system — their identity, where they live, what they do, and the version history of their prompts.

**Rule:** Any time an agent's prompt changes, add a version entry below. Never delete old entries.

---

## Agent: Riley

**Role:** AI Receptionist, Demo Guide, Scheduling Assistant, Communication Assistant, Email Support Assistant, Live Interpreter

**Personality:** Direct, warm, relaxed, fast-talking, practical. Not a chatbot. Not a phone tree. Sounds like a real person who knows what they're doing and isn't trying too hard. No filler words. Gets to the point fast. Asks one question at a time.

**Languages:** English, Spanish, Chinese (responds in whatever language the caller/user uses)

**Prompt file:** `server/prompts/riley.ts` — exports `RILEY_RECEPTIONIST_PROMPT` and `RILEY_VOICE_PROMPT`

**Used by:**
- Website chat (FloatingRiley widget) → `RILEY_RECEPTIONIST_PROMPT` via `server/routers.ts`
- Phone calls (737) 259-5692 → `RILEY_VOICE_PROMPT` via `server/voice.ts`

**Voice engine:** OpenAI Realtime API (WebSocket, live audio — NOT text-to-speech)
**Voice:** shimmer
**VAD:** server_vad (voice activity detection — Riley stops when caller speaks)

---

### Riley Version History

| Version | Date | Checkpoint | What Changed |
|---|---|---|---|
| v1.0 | 2026-03-28 | `47949c51` | Full personality restored from Murphy's original server.js source file |
| v1.1 | 2026-03-28 | `3ac51663` | Voice handler rebuilt with OpenAI Realtime WebSocket (replaced broken TTS) |
| v1.2 | 2026-03-28 | *(current)* | Voice tuning: faster pace, warmer/cooler tone, tighter intro ("SoloEdge, this is Riley — what can I help you with?"), 2-sentence max responses |

---

## Agent: Riley SR Ops Manager

**Role:** Advanced operations coordinator for construction GCs, field crews, and service businesses

**Personality:** Seasoned operations manager. Proactive, structured, bilingual. Uses construction jargon fluently. Flags risks and blockers clearly.

**Prompt file:** `server/prompts/riley.ts` — exports `RILEY_OPS_MANAGER_PROMPT`

**Used by:** Dashboard Ops Manager mode → `server/routers.ts`

---

### Riley SR Ops Manager Version History

| Version | Date | Checkpoint | What Changed |
|---|---|---|---|
| v1.0 | 2026-03-28 | `47949c51` | Initial version — construction coordination, bilingual summaries, crew routing |

---

## How to Update an Agent

1. Edit `server/prompts/riley.ts` — this is the **only** file to touch
2. Test on the live site (chat) and by calling (737) 259-5692 (voice)
3. Add a version entry to this file describing what changed and why
4. Save a checkpoint in Manus and note the version ID above
5. Never write a second copy of the prompt anywhere else

## How to Restore an Agent

If Riley ever sounds wrong, go to Manus Management UI → three-dot menu → Version history → find the last known-good checkpoint ID from the table above → click Rollback.

You do not need to involve the AI agent to roll back. You can do it yourself in under 30 seconds.
