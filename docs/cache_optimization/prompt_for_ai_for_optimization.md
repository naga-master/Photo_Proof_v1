What you should follow:

- First should understand the existing backend and frontend and DB
- document everything as a md file
- for every todo's are plan you finished, you have to document that insided docs folder by creating new folder and you hae to document how can we test this locally, using browser and how should we validate the implemented feature
- everthing should be configurable, when i cahnge parameter in some config file it should be reflected

AI-Assisted Implementation Strategy
Phase 0: Knowledge Foundation (You Must Learn These First)
Core Concepts to Understand:

State management lifecycle (where data lives, when it dies)
Browser storage APIs (what can persist, what can't)
Cache invalidation patterns (when to refresh)
Memory management basics (how browsers handle limits)
HTTP caching headers (how CDN works)

Time Investment: taek your own time reading documentation and understand
Resources:

MDN: IndexedDB, Service Workers, Cache API
React docs: State management patterns
Web.dev: Browser storage best practices

Why Critical: You need to evaluate suggestions, not blindly accept them.

The AI-Proof Architecture Plan
"Create configuration file at [exact path]. All cache logic must read from this config. No hardcoded values anywhere. Config must be hot-reloadable without rebuild."
Benefit: Change any behavior by editing one file, no code diving.

1. Configuration-First Design (Your Control Center)
   Create Single Configuration File
   All cache behavior controlled from one place:
   config/cache-strategy.ts

   Export plain object with:

   - Role profiles (client vs studio limits)
   - Cache TTLs (how long data lives)
   - Storage quotas (max sizes)
   - Eviction thresholds (when to cleanup)
   - Feature flags (enable/disable strategies)
   - API endpoints (which modes to use)

2. Observable Architecture (Everything Logs) - "Implement event emitter at [path]. Every cache operation must emit event before and after. Include timestamp, operation-id, metadata. Add dev-mode console logger. Add production analytics hook."
   Your Benefit: Real-time visibility into what's happening. Debug issues by reading logs, not guessing.
   Instrumentation Requirements
   Every cache operation emits events:
   Events to track:

   - cache.hit (source: memory/indexeddb/service-worker)
   - cache.miss (requested key, fallback path)
   - cache.set (key, size, ttl)
   - cache.evict (key, reason: time/lru/space)
   - storage.quota (used, available, percentage)
   - api.call (endpoint, payload-size, duration)
   - prefetch.start/complete/cancel

3. Layered Implementation (Incremental + Rollback) - "Implement Stage N only. Do not touch code from previous stages. Provide rollback script to disable this stage. Include test script that validates only this stage's requirements."
   Benefit: If Stage 3 breaks, rollback and Stage 1-2 still work. Ship incrementally.

Build in Stages, Each Independently Testable
Stage 1: Foundation (1)

Global stores (no caching yet)
Config system
Logging infrastructure
AI deliverable: Stores work, config changes reflect, logs visible

Stage 2: Memory Cache (2)

In-memory caching only
Test: Navigation doesn't refetch
AI deliverable: Cache hit rate >90% for navigation

Stage 3: Persistence (3)

Add IndexedDB
Test: Refresh doesn't refetch
AI deliverable: Cold start uses cached data

Stage 4: Role-Based (4)

Split client/studio logic
Test: Studio evicts, client doesn't
AI deliverable: Memory stays under limits

4. Metrics Dashboard (Validation Layer) -"Create metrics collection service. Every cache event updates metrics. Create React dashboard component displaying real-time metrics. Include export-to-CSV function. Use this exact schema: [provide schema]."
   Benefit: Objective validation. If cache hit rate is 20%, you know it's broken. If it's 95%, you know it works.
   Before AI Codes Anything, Define Success Metrics
   Metrics to Track:
   Dashboard shows: 1. API calls per session (target: <5 for client, <10 for studio) 2. Cache hit rate by source (memory/indexeddb/SW) 3. Storage usage (current/quota/percentage) 4. Average navigation time 5. Eviction frequency and reasons 6. API response sizes 7. Memory usage over time

5. Working Agreement (Prompt Contract) - Use this prompt template every session. AI outputs code + tests + docs.
   Benefit: Consistent, testable, documented outputs. can't skip critical requirements.
   Every Session Starts With This Prompt:
   CONTEXT:

- Codebase: [attach critical files]
- Current stage: [1/2/3/4]
- Config location: /config/cache-strategy.ts
- Logging: must use EventEmitter at /services/logger

CONSTRAINTS:

- All values from config, zero hardcoding
- Every cache operation logs to EventEmitter
- TypeScript strict mode, no 'any'
- Must work with existing API client
- Backwards compatible (feature flag for rollback)

DELIVERABLES:

- Working code for Stage N only
- Unit tests (cache hit/miss scenarios)
- Integration test (full user flow)
- Config documentation (what each value does)
- Rollback instructions
- document How to test the implemented feature and how to validate the implemented feature

VALIDATION:

- Run metrics dashboard
- Export logs for this session
- Confirm [specific metric] meets target

6. Progressive Validation (Test Before Ship) - "Generate test plan for Stage N. Include: local test steps, expected metrics, rollback procedure, monitoring checklist."
   Benefit: Catch issues before users see them. Data-driven decision to ship or rollback.

Testing Strategy Per Stage
Local Dev Testing:

Run metrics dashboard
Perform typical user flow
Check logs for expected events
Validate metrics against targets
Test rollback flag works

Staging Testing:

Deploy with feature flag off
Enable for 10% of users
Monitor metrics for 24 hours
Compare to control group
Rollback if metrics worse

Production:

Gradual rollout (10% → 50% → 100%)
Monitor continuously
Keep rollback ready for 1 week

7. Documentation-Driven Development - "Before writing code for Stage N, write architecture doc explaining: problem, solution, alternatives considered, trade-offs, integration points. Get my approval before coding."
   Benefit: You understand the system. When hallucinates, you catch it in docs review, not production.
   AI Writes Docs First, Code Second
   Required Documentation:
   For each stage:
1. Architecture decision record (why this approach)
1. Config reference (every option explained)
1. Troubleshooting guide (common issues + fixes)
1. Migration guide (if upgrading existing code)
1. Performance impact (expected metrics before/after)
   AI Instruction Pattern:

The Collaboration Workflow
MY Role (30% effort, 100% control):

Design: Define stage requirements and success metrics
Review: Evaluate AI's architecture docs before code
Configure: Set cache limits in config file
Validate: Run metrics, check logs, approve shipping
Debug: Read logs when issues occur, direct AI to fix

AI's Role (70% effort, your oversight):

Implement: Write code following your requirements
Test: Generate test cases and run them
Document: Explain what it built and why
Iterate: Fix issues based on your metrics feedback
Optimize: Tune performance within your constraints
