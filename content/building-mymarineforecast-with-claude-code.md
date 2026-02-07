# How I Built a Production SaaS in 18 Days Using Claude Code

## From Idea to MyMarineForecast.com: What I Learned Building a Full-Stack Application with AI

I'm not a professional developer. But on January 20, 2026, I opened Claude Code with a product requirements document and an idea for a fishing weather app. Eighteen days later, I had a production freemium SaaS deployed at MyMarineForecast.com -- complete with Stripe payments, user authentication, 7 data visualizations, 5 SEO articles, and error monitoring. Here's how it happened, what the numbers look like, and what I'd do differently next time.

---

## The Project: MyMarineForecast.com

MyMarineForecast is a mobile-first web application that gives fishermen and boaters a single place to check wind, tides, water temperature, wave conditions, solunar feeding times, and marine alerts for any US coastal location. Users pick a spot on an interactive map, and the app pulls real-time data from NOAA, the National Weather Service, and Open-Meteo into a customizable dark-themed dashboard.

The app runs a freemium model: anyone can check a location for free, but saving locations, customizing the dashboard, and accessing advanced features like solunar charts and wind maps requires a subscription ($4.99/month or $39.99/year).

---

## The Build: By the Numbers

| Metric | Value |
|---|---|
| **Calendar days from first to last commit** | 18 (Jan 20 - Feb 6, 2026) |
| **Active coding days** | 13 |
| **Total commits** | 92 |
| **Average commits per active day** | ~7 |
| **Busiest days** | Jan 23 and Feb 5 (19 commits each) |
| **Lines of source code** | ~14,900 |
| **React components** | 42 |
| **API integrations** | 4 (NOAA, NWS, Open-Meteo weather, Open-Meteo marine) |
| **Serverless API functions** | 5 |
| **SEO articles written** | 5 |
| **Third-party services integrated** | 7 (Supabase, Stripe, Resend, Sentry, Vercel, Google Analytics, Microsoft Clarity) |
| **Branches used** | 3 (main, freemium_build, freemium_features) |
| **Total dependencies** | 34 |

### Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Recharts, Leaflet, @dnd-kit
- **Backend:** Vercel Serverless Functions
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **Payments:** Stripe (subscriptions, webhooks, billing portal)
- **Email:** Resend (transactional emails)
- **Monitoring:** Sentry (errors), Google Analytics + Microsoft Clarity (usage)

---

## The Timeline: How It Unfolded

### Week 1 (Jan 20-26): Core Product -- 47 commits

I started with a detailed PRD that I had written before touching Claude Code. That first evening, Claude scaffolded the entire React/TypeScript/Vite project, set up routing, and built the initial map view and weather dashboard. By the end of day one, I had a working app that could display weather data for a clicked location.

The next five days were a sprint. Tide station selection, moon phases, solunar feeding times, wind direction fixes, temperature charts, barometric pressure, and a 10-day forecast all came together. January 23rd was the most intense day -- 19 commits -- as the app evolved from a generic weather dashboard into a purpose-built fishing forecast tool. I deployed to Vercel on day 2 and was iterating on a live site from that point forward.

Several commits during this period were fixing TypeScript build errors and deployment issues. Claude would generate code that worked locally but failed Vercel's stricter build. This became a recurring pattern.

### Week 2 (Jan 29-Feb 2): Content & Monetization Foundation -- 14 commits

With the core product stable, I shifted focus. Claude helped write five educational articles for SEO (barometric pressure and fishing, solunar feeding times, how tide stations work, why wind is hard to predict, and tide coefficients). These were rendered through a markdown-based article system Claude built.

Then came the biggest single commit of the project: on February 2nd, one massive commit added the entire freemium stack -- Supabase authentication, saved locations, Stripe checkout, webhooks, upgrade modals, and feature gating. This was roughly 3,000+ lines of new code in a single session.

### Week 3 (Feb 4-6): Production Hardening & Launch -- 31 commits

The final stretch was about making it real. Dashboard customization with drag-and-drop, wave conditions charts, Small Craft Advisory alerts, and then the production gauntlet: signup flow testing, trial period logic, email verification, Stripe webhook debugging, rate limiting middleware, CORS configuration, password validation, error boundaries, terms of service, privacy policy, a contact form, and a help center.

February 5th matched January 23rd at 19 commits -- nearly all of them were fixing issues found during real testing of the signup-to-payment flow. On February 6th, I tried switching to Esri maps, hated the result within minutes ("Esri sucked rolling back" reads the commit message), merged the freemium branch, added forgot-password functionality, and hooked up Microsoft Clarity analytics.

---

## The Top 5 Lessons for Building Better with Claude Code

### 1. Start with a Real PRD -- It's the Highest-Leverage Time You'll Spend

My 650-line PRD was the single best investment in the entire project. It defined user stories, functional requirements, data structures, the tech stack, the UI design system, and even the API endpoints. When I handed this to Claude Code, it didn't have to guess what I wanted. It had a specification to implement.

**What I'd do differently:** I'd break the PRD into phases with explicit acceptance criteria for each. My PRD listed "Out of Scope" items (user accounts, monetization, weather alerts) that I ended up building two weeks later anyway. If I had written a phased PRD upfront -- Phase 1 MVP, Phase 2 Monetization, Phase 3 Content -- Claude would have had architectural context from the start instead of retrofitting features onto an app that wasn't designed for them.

**The takeaway:** Spend a full session writing your PRD before you write a line of code. Claude Code is an extraordinary builder, but it builds what you describe. Vague requirements produce code you'll rewrite. Precise requirements produce code you'll ship.

### 2. Deploy on Day One and Keep the Build Green

I deployed to Vercel on day two and immediately regretted not doing it on day one. Multiple commits in the first week were fixing TypeScript errors and client-side routing issues that only showed up in production. The gap between "works in dev" and "works deployed" is real, and Claude Code doesn't always catch it.

**What I'd do differently:** Set up CI/CD with build checks before the first feature commit. I'd also ask Claude to run `npm run build` after every significant change and treat build failures as blockers, not afterthoughts. Several times I'd have Claude make a batch of changes, push, and then spend the next three commits fixing build errors that cascaded.

**The takeaway:** Make the production build your source of truth from minute one. Ask Claude to verify the build compiles after every change. The cost of checking is seconds; the cost of debugging a broken deploy is an hour.

### 3. Commit Small and Often -- One Feature Per Commit

Looking at my git history, the pattern is clear: my best days had focused commits ("add barometric pressure", "fix wind arrow direction") and my worst days had sprawling ones. The February 2nd mega-commit that added the entire freemium stack in one shot was technically impressive but practically dangerous -- if anything in that auth/payment/location stack had a subtle bug, bisecting it would have been nearly impossible.

**What I'd do differently:** I'd enforce a discipline of one logical feature per commit, and I'd ask Claude to help me commit after each completed feature rather than batching. I'd also use branches more strategically -- I only used 3 branches for the whole project, and the main branch took direct commits for most of the build.

**The takeaway:** Treat your git history as documentation. When you ask Claude to add a feature, finish it, test it, commit it, then move on. Your future self (and Claude in future sessions) will thank you for the clean history.

### 4. Test the Integration Points Yourself -- Claude Can't Click Buttons

The hardest bugs weren't in the algorithms or UI components. They were in the seams: Stripe webhooks not reaching Supabase, unverified email accounts getting stuck in limbo, trial period logic showing the wrong day count, the Vercel serverless function failing because Stripe was initialized at the module level instead of inside the handler.

Claude Code is exceptional at writing the code for each piece. But it can't test the flow of a user signing up, verifying their email, starting a trial, entering payment info, and having their subscription status update in real-time. That end-to-end testing fell entirely on me, and I found critical bugs every time.

**What I'd do differently:** I'd build integration tests early. Even simple ones -- "create a user, verify subscription is 'free', simulate a Stripe webhook, verify subscription is 'active'" -- would have caught issues that took multiple debugging commits to resolve. I'd also keep a running checklist of user flows and test them after every session.

**The takeaway:** Claude builds the pieces; you test the puzzle. Budget real time for manual testing of every user-facing flow, especially anything involving authentication, payments, or third-party webhooks.

### 5. Use Mockups and Visual References -- Claude Code Thinks in Structure

Three mockup files in my repo (MOCKUP.md, DESKTOP_LAYOUT_MOCKUP.md, SOLUNAR_MOCKUP.md) were ASCII-art wireframes that told Claude exactly how components should be laid out. When I provided these, Claude nailed the implementation on the first try. When I didn't -- like with the various iterations of the solunar component (four commits on January 23rd: "Add solunar", "Convert to area chart", "Simplify UI", "Split into two blocks") -- we went back and forth until I was happy.

**What I'd do differently:** I'd create a mockup for every major component before asking Claude to build it. ASCII art, a sketch on paper photographed and described, or even just a bullet-point layout description -- anything that communicates spatial relationships. I'd also provide screenshots of apps I admire as reference points for styling decisions.

**The takeaway:** Claude Code interprets structure beautifully when you give it structure to interpret. A 10-line ASCII mockup saves you 4 revision commits. The five minutes you spend wireframing pays back tenfold.

---

## The Bigger Picture

In 18 days, working part-time (13 active days with an average of 7 commits per day suggests focused sessions, not marathon coding), I went from an idea to a deployed SaaS with:

- 42 React components
- 7 interactive data visualizations
- Full user authentication with email verification
- Stripe subscription billing with webhooks
- 5 SEO articles
- Transactional email system
- Error monitoring and analytics
- Legal pages (Terms of Service, Privacy Policy)
- Contact form with rate limiting
- Responsive dark-themed UI
- Drag-and-drop dashboard customization

Could I have built this without Claude Code? Honestly, no -- not in this timeframe, and probably not at all without hiring developers. Claude Code didn't just write code faster; it let me build things I wouldn't have known how to architect. Stripe webhook handlers, Supabase Row-Level Security policies, Leaflet map integrations, Recharts custom tooltips -- these are all things I'd have spent days researching individually.

But Claude Code isn't magic. It's a collaborator that's as good as the instructions you give it. The projects that will succeed with AI-assisted development are the ones where the human brings clear requirements, domain expertise, and relentless testing -- and lets the AI handle the implementation at speed.

My next app will be built with these five lessons baked in from day one. The PRD will be phased. The build will be green from the first commit. The commits will be atomic. The integration tests will exist. And every component will start with a mockup.

The code is the easy part now. The thinking is what matters.
