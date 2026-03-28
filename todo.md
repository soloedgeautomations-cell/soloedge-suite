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
- [ ] Animated call demo component (future enhancement)
- [ ] "How It Works" section (future enhancement)
- [ ] Testimonials carousel (future enhancement)

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
- [ ] Stripe subscription management (future — requires Stripe secrets)
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
- [ ] Telegram + SMS secrets (webdev_request_secrets — pending user input)
- [ ] Stripe secrets (future)
