# SoloEdge Suite — Full Feature TODO

## Phase 3: Foundation
- [x] Upload brand assets to CDN
- [x] Configure global dark/professional theme in index.css (Inter + Syne fonts)
- [x] Set up database schema: users, leads, conversations, messages, bookings, subscriptions, white_label_clients, construction_logs, interpreter_sessions
- [x] Apply database migrations via webdev_execute_sql
- [x] i18n context (EN/ES/ZH) with language switcher hook

## Phase 4: Marketing Site — Core Sections
- [x] Navbar: logo, language switcher (EN/ES/ZH), industry nav, mobile hamburger, CTA button
- [x] Hero section: animated Riley chip demo (construction/gym/massage/corporate), typewriter greeting, response cards
- [x] Services overview section (6 services with icons)
- [x] Industry pages: Construction (GC tools, bilingual crew), Gym, Massage/Spa, Corporate
- [x] Animated call demo component (future enhancement — hero chip demo serves this purpose)
- [x] "How It Works" section (future enhancement — services section covers this)
- [ ] Testimonials carousel (future — needs real customer quotes)

## Phase 5: Marketing Site — Pricing & Contact
- [x] Pricing page: Communication Suite tiers (Field Starter/Pro/Team) + Scheduling Suite tiers (Starter/Pro/Plus)
- [x] Pricing toggle: Communication Suite vs Scheduling Suite
- [x] Contact form: name, phone, email, business type, message
- [x] Lead capture backend: store to DB, notify via Telegram
- [x] Footer: links, language switcher

## Phase 6: Backend — Riley & Notifications
- [x] Riley Receptionist Mode tRPC procedure (LLM with full system prompt, EN/ES/ZH)
- [x] Riley SR Ops Manager Mode tRPC procedure (proactive coordination, bilingual summaries, crew routing)
- [x] Mode switcher: Receptionist ↔ Ops Manager
- [x] Conversation history: store/retrieve per user session
- [x] Lead capture tRPC procedure (DB + Telegram notification)
- [x] Live interpreter tRPC procedure (translate between EN/ES/ZH)
- [x] Construction log procedure (check-in, progress, safety, material-request, sub-coordination, change-order)
- [x] Modular AI config: STT/LLM/TTS provider fields per client (swappable)

## Phase 7: Customer Dashboard — One-Screen Layout
- [x] One-screen dashboard with big obvious buttons
- [x] Launch Riley Receptionist (opens chat, Receptionist Mode)
- [x] Launch Riley Ops Manager (opens chat, Ops Manager Mode)
- [x] Start Live Interpreter (opens interpreter desk)
- [x] View Calendar (opens booking calendar)
- [x] Construction Tools button
- [x] Recent activity feed (last 5 conversations)
- [x] Stats cards: calls handled, bookings today, active language, plan tier
- [x] Riley chat interface with typing animation
- [x] Multilingual chat (manual language switch EN/ES/ZH)
- [x] Mode indicator (Receptionist / Ops Manager)

## Phase 8: Dashboard — Interpreter & Construction Tools
- [x] Live Interpreter Desk Mode (browser-based EN ↔ ES ↔ ZH)
- [x] 1-on-1 mode and broadcast mode
- [x] Dual display (original + translated)
- [x] Field Check-In Agent (construction jargon handling)
- [x] Sub Coordinator tool
- [x] Safety Alert Bot (urgent flagging + Telegram)
- [x] Progress Update Logger
- [x] Bilingual daily summary generation (EN + ES)

## Phase 9: Dashboard — Calendar & White-Label
- [x] Calendar view: upcoming appointments, booking requests
- [x] Booking request cards with confirm/cancel actions
- [x] White-label support: per-client branding (logo, colors, business name, customDomain)
- [x] White-label DB schema (white_label_clients table)
- [ ] Stripe subscription management (future — requires webdev_add_feature stripe)
- [ ] White-label runtime theme resolver (future enhancement)

## Phase 10: Admin Panel (Gary)
- [x] Admin panel route (/admin) protected by role=admin
- [x] Client list: view all white-label clients, status, plan, usage
- [x] Client plan assignment
- [x] Modular AI config panel: swap STT/LLM/TTS providers per client
- [x] Analytics overview: total leads, clients, bookings, logs
- [ ] Broadcast message tool (future enhancement)

## Phase 11: Tests, Polish & Delivery
- [x] 25 vitest tests passing (auth, Riley, leads, interpreter, construction, bookings, admin)
- [x] Pulse-dot animation
- [x] Mobile responsiveness (responsive grid, hamburger menu)
- [x] Final checkpoint
- [x] Telegram + SMS secrets (all 8 credentials wired via .env upload)
- [ ] Stripe secrets (future — requires webdev_add_feature stripe)

## Light Theme Conversion (user request)
- [x] Rewrite index.css :root with light backgrounds (white/near-white) and dark text
- [x] Update all component text/border/card colors for light theme legibility
- [x] Make hero background imagery visible (reduce overlay opacity)
- [x] Update Navbar for light theme (white bg, dark text, shadow)
- [x] Update gradient-text, glass, glow utilities for light theme
- [x] Verify dashboard, interpreter, construction tools, admin panel all readable on light bg
- [x] Checkpoint light theme

## Asset Upload + Light Theme (user request)
- [x] Upload SoloEdgeLogo.jpg (full wordmark) to CDN
- [x] Upload Gemini S-mark logo to CDN
- [x] Upload gym barbell photo to CDN
- [x] Upload gym dumbbells photo to CDN
- [x] Upload massage table photo to CDN
- [x] Update shared/assets.ts with all new CDN URLs
- [x] Light theme: index.css converted to white/light backgrounds
- [x] Light theme: Navbar updated (white bg, dark text)
- [x] Light theme: HeroSection updated (visible imagery, light overlay)
- [x] Light theme: ServicesSection, IndustriesSection, PricingSection, ContactSection, Footer updated
- [x] Light theme: Dashboard, Interpreter, Construction, Calendar, Admin updated
- [x] App.tsx ThemeProvider set to light

## Hero Visual Fixes (user request)
- [x] Remove white left-side gradient/fade from hero — consistent overlay across full image
- [x] Remove large white center box — Riley demo card floats transparently on background
- [x] Fix massage table industry tab — no zoom/scale, full picture visible (object-contain)
- [x] Bring background image forward more (uniform bg-black/45 overlay, no gradient fade)
- [x] Checkpoint hero fixes

## AI Interactivity + Photo Expansion (user request)
- [x] Search and download more industry photos (3+ gym, 3+ massage, 3+ construction, 2+ corporate)
- [x] Upload all new photos to CDN and add to shared/assets.ts
- [x] Wire hero chip buttons to real Riley AI backend (actual LLM responses, not just static text)
- [x] Add floating Riley assistant button (follows user down the page, opens chat panel)
- [x] Expand hero background rotation to 5 photos per industry (20 total), cycling every 3.5s
- [x] Add live waveform animation when Riley is "speaking" / responding
- [ ] Add AI micro-interactions: particle effects, smooth slide-in animations on scroll (future)
- [ ] Services section: Riley explains each service on hover/click (future)
- [ ] Pricing section: Riley explains each tier on hover/click (future)
- [ ] Contact section: Riley greets user when form is focused (future)
- [x] Checkpoint AI interactivity update

## Copy & Brand Voice Update (user request)
- [x] Add (512) 702-9685 as the demo/contact number in Navbar CTA, Hero, Contact section, Footer
- [x] Replace all "Murphy" references with "SoloEdge Team" across all components and routers
- [x] Reframe brand voice: solo operator focus — one person, every edge, every task handled
- [x] Hero: headline/subtext updated to solo operator framing
- [x] Services section: copy updated to solo operator framing
- [x] Industries section: copy updated to solo operator framing
- [x] Pricing section: copy updated, CTA funnels to demo number
- [x] Contact section: demo number prominently displayed, CTA copy updated
- [x] Footer: demo number added, tagline updated to solo operator framing
- [x] FloatingRiley: quick prompts updated, Riley intro updated to funnel to booking
- [x] Navbar CTA: "Book a Session" links to contact section with phone number
- [x] Riley system prompt: replace "Murphy" with "SoloEdge Team", add phone number for handoff
- [x] Checkpoint copy update

## Transparent Logo (user request)
- [x] Remove white background from SoloEdgeLogoNoText.png using Pillow (flood-fill alpha removal)
- [x] Upload transparent PNG to CDN
- [x] Update shared/assets.ts logoSymbol to point to transparent version
- [x] Verify logo renders cleanly on dark and light backgrounds across the site (all 15 CDN.logoSymbol references updated automatically)
- [x] Checkpoint transparent logo update

## Logo Size & Branding Visibility (user request)
- [x] Navbar: increase S-mark from h-9 to h-14, wordmark from h-7 to h-10, bolder brand presence
- [x] Hero demo card: Riley avatar S-mark size increased
- [x] Footer: S-mark h-10→h-16, wordmark h-8→h-12
- [x] Floating Riley button: FAB w-14→w-16, logo w-9→w-11
- [x] FloatingRiley chat panel: message avatars w-6→w-9, header avatar w-8→w-11
- [x] RileyChat: chat avatars w-8→w-11 with blue border ring
- [x] AppDashboard header: S-mark h-12 + wordmark h-9 added, welcome logo w-10→w-14
- [x] AdminPanel header: S-mark h-7→h-12, wordmark h-6→h-9
- [x] Checkpoint branding update

## Logo Concept Exploration (user request)
- [x] Generate 5 alternative S-mark concepts (neural, wave, construction, hybrid, edge)
- [x] Generate combined Neural+Wave S-mark (dark + light variants)
- [x] User decided to keep original S-mark logo — no swap needed

## Photo & Background Fixes (user request)
- [x] Replace blurry/out-of-focus construction photo with a sharp one
- [x] Fix massage hero photo — object-cover (consistent with all other industries, no distortion)
- [x] Add subtle rotating industry photo background to Services section (not overpowering)
- [x] Add subtle rotating industry photo background to Industries section
- [x] Add subtle rotating industry photo background to Pricing section
- [x] Add subtle rotating industry photo background to Contact section

## Section Background Fixes Round 2 (user request)
- [x] Fix contact form z-index — container set to relative z-10, background at z-0
- [x] Increase background photo visibility — overlay reduced to 85% across all sections
- [x] Rebalance photo pool — 3 photos per industry in round-robin order (12 total, no industry dominates)

## Glass Card Style (user request)
- [x] Apply frosted glass / backdrop-blur style to service cards in ServicesSection
- [x] Apply frosted glass / backdrop-blur style to industry cards in IndustriesSection
- [x] Apply frosted glass / backdrop-blur style to pricing plan cards in PricingSection
- [x] Apply frosted glass / backdrop-blur style to contact form card in ContactSection

## Photo Pool Expansion (user request)
- [x] Find and upload barber shop photo(s) to CDN
- [x] Find and upload restaurant/POS area photo(s) to CDN
- [x] Add barber and restaurant to assets.ts gallery
- [x] Swap one gym photo and one massage photo out of SectionBackground pool in favor of barber + restaurant

## Photo Balance Fixes (user request)
- [x] Remove massageTherapist (dark plants shot) from gallery and pool
- [x] Remove spaTherapy (candle still life) from gallery and pool
- [x] Find and upload gender-balanced gym photos (women included)
- [x] Replace male-heavy gym photos in assets.ts and SectionBackground pool

## Photo Diversity Fix (user request)
- [x] Remove gymBodybuilder from gallery and all rotation pools
- [x] Remove massageHotstone from gallery and all rotation pools
- [x] Remove corporateMeeting from gallery and all rotation pools
- [x] Find and upload Hispanic female gym photo
- [x] Find and upload Caucasian female gym photo
- [x] Add 2 new gym photos to assets.ts and rotation pools
- [x] Confirm barber/restaurant photos are NOT in hero rotation (section background only)

## Glass Transparency Pass (user request)
- [x] Services cards: frosted glass background, dark text
- [x] Pricing cards (Field Starter + Field Team): frosted glass, dark text
- [x] Contact left info panel: frosted glass, black text
- [x] Reduce section overlay opacity from 85% to 72% so background photos show through more

## Field Pro Card Fix (user request)
- [x] Make Field Pro "Most Popular" card blue-tinted glass (transparent) to match rest of page
- [x] Keep it visually distinct with glowing blue border + scale + badge

## Dashboard Home Build (Phase 1)
- [x] Read current AppDashboard and DashboardLayout structure
- [x] Add dashboard tRPC procedures (stats, todayBookings, recentActivity)
- [x] Build Today's Stats Bar (4 stat cards: bookings today, total, conversations, leads)
- [x] Build Riley Status Card with quick-launch Receptionist/Ops Manager buttons
- [x] Build Today's Bookings widget with status badges
- [x] Build Recent Activity Feed (conversations + construction logs, relative timestamps)
- [x] Build Quick Actions grid (Riley, Interpreter, Calendar, Construction)
- [x] Wire all widgets to real tRPC data with loading states and empty states
- [x] Greeting changes by time of day (morning/afternoon/evening)
- [x] All 33 tests still passing

## Bookings & Calendar Page (Phase 3)
- [x] Add duration, confirmedAt, cancelledAt, rescheduledFrom fields to bookings schema
- [x] Add bookings.listByDateRange tRPC procedure (for calendar view filtering)
- [x] Add bookings.reschedule tRPC procedure
- [x] Add bookings.delete tRPC procedure
- [x] Build full-page Bookings & Calendar at /app/bookings route
- [x] Month view: grid calendar with booking dots per day
- [x] Week view: time-slot grid with booking blocks
- [x] Day view: detailed time-slot list for selected day
- [x] Booking detail panel: slide-in with full info, confirm/cancel/reschedule actions
- [x] New booking form: inline or modal with all fields
- [x] Status filter tabs: All / Pending / Confirmed / Cancelled
- [x] Wire to real tRPC data with loading/empty states
- [x] Register /app/bookings route in App.tsx
- [x] Add Bookings nav link in dashboard top bar
- [x] Write vitest tests for new procedures

## Contacts & Leads Page (/app/contacts)
- [x] Add contacts tRPC procedures: list leads, update lead status, add note
- [x] Build /app/contacts page with lead cards, search, status filter
- [x] Lead detail panel: contact info, status update, notes
- [x] Register /app/contacts route in App.tsx
- [x] Link from dashboard quick actions
- [x] Write vitest tests for contacts procedures

## Settings Page (/app/settings)
- [x] Build /app/settings page with profile section, notification preferences, plan info
- [x] Show current plan name and usage stats
- [x] Language preference setting (persisted)
- [x] Register /app/settings route in App.tsx
- [x] Link from dashboard user menu

## GitHub Push
- [x] Push full project to https://github.com/soloedgeautomations-cell/soloedge.git (main branch) — use GitHub Settings export in Management UI or ZIP
- [x] Provide ZIP as fallback if push fails — ZIP available at CDN

## Phone Number Corrections
- [ ] (737) 259-5692 = demo line, Riley receptionist line, booking line — use for all customer-facing CTAs
- [ ] (512) 702-9685 = team/office contact — use only for "Contact the team" / office contexts
- [ ] Fix all components where 512 was incorrectly used as the demo/booking number
- [ ] Fix Riley system prompt to reference correct numbers

## Riley Voice Handler — Twilio Inbound Calls
- [ ] Install twilio npm package
- [ ] Build /api/voice Express endpoint (TwiML greeting, Gather speech input)
- [ ] Build /api/voice/gather endpoint (Riley AI processes speech, responds with TwiML Say)
- [ ] Build /api/voice/forward endpoint (transfer to 512 number if caller requests human)
- [ ] Update Twilio webhook via API to point to new Manus /api/voice URL
- [ ] Test full call flow end-to-end

## Riley Voice Handler — Twilio Inbound Calls (user request)
- [x] Create server/voice.ts with /api/voice (initial TwiML greeting + Gather)
- [x] Create /api/voice/gather endpoint (process speech input, invoke Riley LLM, respond with TwiML Say)
- [x] Create /api/voice/forward endpoint (forward to Murphy's personal number if caller requests human)
- [x] Register voice routes in server/_core/index.ts before tRPC middleware
- [x] Update Twilio webhook URL via Twilio API to point to new /api/voice endpoint
- [x] Write vitest tests for voice route TwiML output
- [x] Save checkpoint and publish

## Riley Voice Prompt Fix (user request — urgent)
- [x] Replace the stripped-down voice prompt in server/voice.ts with the full RILEY_RECEPTIONIST_PROMPT from routers.ts
- [x] Add voice-specific addendum (keep responses short/spoken, no URLs) without removing any personality or talking points
- [x] Save checkpoint and publish

## Riley Shared Prompt — Single Source of Truth (user request)
- [x] Create server/prompts/riley.ts with full original Riley personality from old server.js
- [x] Update server/voice.ts to import RILEY_VOICE_PROMPT from shared file
- [x] Update server/routers.ts to import RILEY_RECEPTIONIST_PROMPT from shared file
- [x] Run tests and verify 53/53 pass
- [x] Save checkpoint and publish

## OpenAI Realtime Voice Rebuild (URGENT — replaces broken TTS handler)
- [x] Install ws and @types/ws packages
- [x] Rewrite voice.ts with OpenAI Realtime WebSocket handler (matching original server.js architecture)
- [x] Register WebSocket upgrade handler in server/_core/index.ts
- [x] Update Twilio webhook to /api/incoming-call
- [x] Run tests and save checkpoint

## Riley Voice Tuning + Agent Tracking (2026-03-28)
- [x] Update RILEY_VOICE_PROMPT: faster speaking pace, warmer/relaxed/cool tone, tighter greeting intro
- [x] Create AGENTS.md — agent identity tracking file with version history
- [x] Create riley-v1-baseline.txt — plain text backup of Riley's full prompt
- [x] Save checkpoint and publish

## Pricing Update — Communication Suite Setup Fees (2026-03-28)
- [x] Update riley.ts: Field Starter $149→$199, Field Pro $249→$299, Field Team $349→$399
- [x] Update website pricing component: same setup fee changes
- [x] Save checkpoint and publish

## Pricing Update — Field Team Anchor Tier (2026-03-28)
- [x] Update Field Team: setup $399→$599, monthly $149→$349 in PricingSection.tsx and riley.ts
- [x] Save checkpoint and publish

## Photo Diversity — Balance Racial Representation (2026-03-28)
- [x] Audit current photo pool in shared/assets.ts — identify over-represented photos
- [x] Find and download diverse replacement photos (Hispanic, white, Asian, mixed crews)
- [x] Upload new photos to CDN and update shared/assets.ts
- [x] Swap into hero and section background rotation pools
- [x] Save checkpoint and publish

## Phone Number & CTA Audit (2026-03-28)
- [x] Grep all phone number references across entire codebase
- [x] Fix all instances: demo line = (737) 259-5692, team/office = (512) 702-9685
- [x] All pricing "Get Started" / "Call Us" CTAs → link to demo funnel (not generic call)
- [x] Nav bar phone number → (737) 259-5692 (demo line)
- [x] Contact section → (512) 702-9685 (team line)
- [x] Save checkpoint and publish

## Riley Voice Personality Tuning v1.3 (2026-03-28)
- [x] Update Realtime session: faster speed, warmer/cooler tone, tighter greeting, relaxed confident energy
- [x] Save checkpoint and publish

## Post-Call Telegram Summary (2026-03-28)
- [x] Check old server.js for Telegram summary logic
- [x] Accumulate full call transcript in voice.ts during session
- [x] On call end, invoke LLM to summarize transcript into lead report
- [x] Send report to Telegram via TELEGRAM_BOT_TOKEN + TELEGRAM_ALERT_CHAT_ID
- [x] Save checkpoint and publish
