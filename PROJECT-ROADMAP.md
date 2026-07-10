# PROJECT-ROADMAP.md — ExamForge Implementation Plan

**Derived from:** ARCHITECTURE-REVIEW.md, 01-PRD.md, 02-TRD.md, 03-UI-UX.md, 04-Document-Processing.md, 05-Database-API.md  
**Phase Gates:** Each phase must meet Definition of Done (CLAUDE.md §6) before next phase begins.  
**Task Granularity:** ~2-4 hours each. One focused feature per task.

---

## Phase 1 — Project Setup & Foundation (Week 1-2)

### 1.1 Monorepo & Tooling

| ID    | Task                                                                                                    | Dependencies | Est. | Status                                                      |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------ | ---- | ----------------------------------------------------------- |
| 1.1.1 | Initialize pnpm workspace with `apps/web`, `apps/doc-processor`, `packages/db`, `packages/shared-types` | —            | 2h   | ✅                                                          |
| 1.1.2 | Configure TypeScript strict config for web; Ruff + MyPy for processor                                   | 1.1.1        | 1h   | ✅                                                          |
| 1.1.3 | Set up ESLint (Next.js), Prettier, Husky, lint-staged                                                   | 1.1.1        | 1h   | 🔄 ESLint+Prettier added; Husky/lint-staged pending (1.1.5) |
| 1.1.4 | Create `Makefile` with all standard commands (CLAUDE.md §8)                                             | 1.1.1        | 1h   | ✅                                                          |
| 1.1.5 | Configure GitHub Actions CI: lint, typecheck, test, build, contract                                     | 1.1.3        | 2h   | ☐                                                           |
| 1.1.6 | Add `.env.example` with all required keys (DB, Auth, Storage, Parser secret)                            | 1.1.1        | 0.5h | ✅                                                          |
| 1.1.7 | Set up Vercel project (web) + Railway/Render project (processor) preview deployments                    | 1.1.5        | 2h   | ☐                                                           |

### 1.2 Database Schema (Prisma)

| ID    | Task                                                                                                     | Dependencies | Est. | Status |
| ----- | -------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 1.2.1 | Define Prisma schema per 05-Database-API.md §3 (all models, enums, indexes)                              | 1.1.1        | 3h   | ☐      |
| 1.2.2 | Add soft-delete middleware for `User`, `Exam`, `ExamVersion`, `UploadedFile`, `ParserJob`, `ReviewQueue` | 1.2.1        | 1h   | ☐      |
| 1.2.3 | Create initial migration; verify `prisma migrate dev` works cleanly                                      | 1.2.2        | 1h   | ☐      |
| 1.2.4 | Seed script: create ADMIN role, one admin user, default settings (confidence thresholds)                 | 1.2.3        | 1h   | ☐      |
| 1.2.5 | Generate Prisma client; verify types in `packages/shared-types`                                          | 1.2.3        | 0.5h | ☐      |

### 1.3 Shared Types & Contracts

| ID    | Task                                                                       | Dependencies | Est. | Status |
| ----- | -------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 1.3.1 | Create shared Zod schemas & infer DTOs from Zod to `packages/shared-types` | 1.2.5        | 0.5h | ✅     |
| 1.3.2 | Create shared API request contracts and parser contracts                   | 1.1.1        | 1h   | ✅     |
| 1.3.3 | Create shared enums and error types                                        | 1.3.2        | 0.5h | ✅     |
| 1.3.4 | Create reusable validation utilities                                       | 1.3.1, 1.3.3 | 1h   | ✅     |

### 1.4 Authentication Foundation

| ID    | Task                                                                                      | Dependencies | Est. | Status |
| ----- | ----------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 1.4.1 | Install Better Auth; configure email/password + Prisma adapter                            | 1.2.5        | 2h   | ☐      |
| 1.4.2 | Create `AuthService` interface (getSession, requireRole, requireOwnership) per TRD §5.2   | 1.4.1        | 2h   | ☐      |
| 1.4.3 | Implement Better Auth config with RBAC plugin (roles: ADMIN, REVIEWER, STUDENT)           | 1.4.2        | 1h   | ☐      |
| 1.4.4 | Add session cookie config: httpOnly, secure, sameSite=lax, 7-day sliding                  | 1.4.3        | 0.5h | ☐      |
| 1.4.5 | Create audit log table + `auditService.log(event, metadata)` per 05-Database-API.md §3.15 | 1.2.1        | 1h   | ☐      |
| 1.4.6 | Middleware: protect all `/admin/*` routes (requireRole ADMIN), `/api/v1/*` (requireAuth)  | 1.4.2        | 1h   | ☐      |

---

## Phase 2 — Auth & RBAC Hardening (Week 2-3)

### 2.1 Auth UI & Flows

| ID    | Task                                                                                    | Dependencies | Est. | Status |
| ----- | --------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 2.1.1 | Build `/login` page per UI/UX §7.1 (form, validation, error states, rate-limit display) | 1.4.6        | 3h   | ☐      |
| 2.1.2 | Implement login/logout Server Actions using Better Auth                                 | 2.1.1        | 1h   | ☐      |
| 2.1.3 | Build `/admin/users` page: list, create student, change role, deactivate (soft delete)  | 1.4.6, 2.1.1 | 3h   | ☐      |
| 2.1.4 | Build student dashboard (`/`) — empty state per UI/UX §7.11                             | 1.4.6        | 1h   | ☐      |
| 2.1.5 | Add top bar for student: logo, name, logout (UI/UX §5)                                  | 2.1.4        | 1h   | ☐      |
| 2.1.6 | Add left rail for admin: Exams, Students, Audit Log (UI/UX §5)                          | 2.1.3        | 1h   | ☐      |

### 2.2 RBAC Enforcement

| ID    | Task                                                                            | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 2.2.1 | Implement permission matrix checks in `AuthService` per 05-Database-API.md §7.4 | 1.4.2        | 1h   | ☐      |
| 2.2.2 | Add ownership checks to all student-scoped endpoints (attempts, results)        | 2.2.1        | 1h   | ☐      |
| 2.2.3 | Add CSRF protection on all state-changing Server Actions                        | 1.4.4        | 1h   | ☐      |
| 2.2.4 | Rate limiting: login (5/min/IP), upload (10/min/user) — in-memory for v0        | 1.4.4        | 1h   | ☐      |

---

## Phase 3 — Database & Migrations (Week 3)

### 3.1 Repository Layer

| ID    | Task                                                                                        | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 3.1.1 | Create `ExamRepository` (CRUD, versioning, publish transaction per 05-Database-API.md §9.2) | 1.2.5        | 3h   | ☐      |
| 3.1.2 | Create `AttemptRepository` (start, autosave, submit, resume per §8-9)                       | 1.2.5        | 3h   | ☐      |
| 3.1.3 | Create `ParserJobRepository` (status transitions, resultJson storage)                       | 1.2.5        | 2h   | ☐      |
| 3.1.4 | Create `ReviewQueueRepository` (workingJson edits, approve/reject)                          | 1.2.5        | 2h   | ☐      |
| 3.1.5 | Create `UploadRepository` (file metadata, checksum dedupe)                                  | 1.2.5        | 1h   | ☐      |
| 3.1.6 | Create `SettingsRepository` (in-memory cache + DB sync per 05-Database-API.md §13.5)        | 1.2.5        | 1h   | ☐      |

### 3.2 Migration & Seed Hardening

| ID    | Task                                                                                             | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 3.2.1 | Add partial unique index: `Attempt` (userId, examVersionId) WHERE status=IN_PROGRESS             | 1.2.2        | 0.5h | ☐      |
| 3.2.2 | Add composite indexes for query patterns (ReviewQueue status, ParserJob status+confidence)       | 1.2.2        | 0.5h | ☐      |
| 3.2.3 | Write migration test: apply → verify schema → rollback → reapply                                 | 3.2.1, 3.2.2 | 1h   | ☐      |
| 3.2.4 | Seed realistic dev data: 1 exam, 2 versions, 3 students, 2 attempts (1 in-progress, 1 submitted) | 1.2.4        | 1h   | ☐      |

---

## Phase 4 — Admin Dashboard (Week 4-5)

### 4.1 Exam List & Navigation

| ID    | Task                                                                                            | Dependencies | Est. | Status |
| ----- | ----------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 4.1.1 | Build `/admin` dashboard: exam table (title, status chip, question count, last edited, actions) | 2.1.6, 3.1.1 | 2h   | ☐      |
| 4.1.2 | Implement status chips: Draft/Processing/Review/Published/Archived (UI/UX §18 StatusChip)       | 4.1.1        | 1h   | ☐      |
| 4.1.3 | Add empty state + "New Exam" CTA (UI/UX §7.2)                                                   | 4.1.1        | 0.5h | ☐      |

### 4.2 Upload Wizard

| ID    | Task                                                                                                | Dependencies | Est. | Status |
| ----- | --------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 4.2.1 | Build `/admin/exams/new` 3-step wizard (Files → Details → Confirm) per UI/UX §7.3                   | 2.1.1        | 3h   | ☐      |
| 4.2.2 | Drag-drop zones with magic-byte pre-check (client-side) for question paper + answer key             | 4.2.1        | 2h   | ☐      |
| 4.2.3 | Upload API: multipart → Supabase Storage → create `UploadedFile` rows → create `ParserJob` (QUEUED) | 3.1.5, 3.1.3 | 3h   | ☐      |
| 4.2.4 | Redirect to processing status page with stage labels (Detecting → Extracting → Parsing → Ready)     | 4.2.3        | 1h   | ☐      |

### 4.3 Processing Status & Review Queue

| ID    | Task                                                                                     | Dependencies | Est. | Status |
| ----- | ---------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 4.3.1 | Build polling status page for ParserJob (stage, progress, errors)                        | 4.2.4        | 2h   | ☐      |
| 4.3.2 | Build `/admin/review-queue` list: filter by status, sort by confidence (low first)       | 3.1.4        | 2h   | ☐      |
| 4.3.3 | Build review screen `/admin/exams/[id]/review` per UI/UX §7.4 (left list + right editor) | 4.3.2        | 4h   | ☐      |
| 4.3.4 | Editor panel: stem (KaTeX), 4 options, correct selector, confidence dot, raw OCR toggle  | 4.3.3        | 3h   | ☐      |
| 4.3.5 | Inline "Mark Reviewed" checkbox per question; "Add Question Manually" button             | 4.3.4        | 2h   | ☐      |
| 4.3.6 | PATCH `/api/v1/review-queue/:id` — save workingJson edits                                | 3.1.4        | 1h   | ☐      |

### 4.4 Configure & Publish

| ID    | Task                                                                                                                    | Dependencies | Est. | Status |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 4.4.1 | Build `/admin/exams/[id]/configure`: duration, marks/question, negative marking, instructions (rich text)               | 3.1.1        | 3h   | ☐      |
| 4.4.2 | Build `/admin/exams/[id]/publish` checklist per UI/UX §7.6 (all reviewed, answers resolved, duration set, ≥1 student)   | 4.4.1        | 2h   | ☐      |
| 4.4.3 | Implement publish transaction (05-Database-API.md §9.2) — ExamVersion PUBLISHED, Exam.currentVersionId update, AuditLog | 3.1.1        | 2h   | ☐      |
| 4.4.4 | Version creation on edit: "Edit Published Exam" → new Draft ExamVersion → configure → publish                           | 4.4.3        | 2h   | ☐      |

### 4.5 Admin Monitor (Lite)

| ID    | Task                                                                               | Dependencies | Est. | Status |
| ----- | ---------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 4.5.1 | Build `/admin/exams/[id]/monitor`: polling table (student, status, time remaining) | 3.1.2        | 2h   | ☐      |

---

## Phase 5 — Upload System & Storage (Week 5-6)

### 5.1 Supabase Storage Integration

| ID    | Task                                                                                                 | Dependencies | Est. | Status |
| ----- | ---------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 5.1.1 | Create `StorageService` abstraction (upload, signedUrl, delete, exists) per 05-Database-API.md §10.1 | 1.1.6        | 2h   | ☐      |
| 5.1.2 | Configure Supabase buckets: `question-papers`, `answer-keys`, `question-images` (separate policies)  | 5.1.1        | 1h   | ☐      |
| 5.1.3 | Implement signed URL generation (TTL: 4h for exam assets, 15min for uploads)                         | 5.1.2        | 1h   | ☐      |
| 5.1.4 | Async cleanup job: soft-deleted UploadedFile → delete from Storage after 30 days                     | 5.1.1        | 1h   | ☐      |

### 5.2 Upload Hardening

| ID    | Task                                                                    | Dependencies | Est. | Status |
| ----- | ----------------------------------------------------------------------- | ------------ | ---- | ------ |
| 5.2.1 | Server-side validation: magic bytes `%PDF-`, size ≤25MB, page count ≤60 | 4.2.3        | 2h   | ☐      |
| 5.2.2 | SHA-256 checksum on upload; dedupe by checksum (return existing file)   | 5.2.1        | 1h   | ☐      |
| 5.2.3 | MIME type verification via `file-type` package (not extension)          | 5.2.1        | 1h   | ☐      |

---

## Phase 6 — Python Parser Service (Week 6-9)

> **Note:** Parser extraction logic depends on real JEE Main PDFs (Q1). Interface and pipeline built first; extraction stubbed.

### 6.1 FastAPI Service Foundation

| ID    | Task                                                                                             | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 6.1.1 | Initialize FastAPI app with structured logging (structlog + correlation ID)                      | 1.1.2        | 1h   | ☐      |
| 6.1.2 | Implement health endpoint (`/health`) + readiness (`/ready` checks DB/Storage)                   | 6.1.1        | 0.5h | ☐      |
| 6.1.3 | Add Pydantic models for `ParsedExam`, `ParsedQuestion`, `ParsedOption` per 04-Doc-Processing §10 | 1.3.2        | 1h   | ☐      |
| 6.1.4 | Create parser callback endpoint: `PATCH /api/v1/parser/jobs/:id` (service-to-service auth)       | 1.3.2, 3.1.3 | 1h   | ☐      |

### 6.2 Pipeline Orchestration

| ID    | Task                                                                                                          | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 6.2.1 | Implement pipeline stages as classes: Validation → Classification → OCR → Parsing → Confidence → ReviewBridge | 6.1.1        | 3h   | ☐      |
| 6.2.2 | Orchestrator: runs stages sequentially, handles retries (OCR: 2x), emits structured logs per stage            | 6.2.1        | 2h   | ☐      |
| 6.2.3 | Background job runner: pick QUEUED ParserJob → run pipeline → callback to Next.js with result                 | 6.2.2, 6.1.4 | 2h   | ☐      |

### 6.3 PDF Processing & OCR

| ID    | Task                                                                                        | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 6.3.1 | PDF validation: magic bytes, page count, encryption check, question-content heuristic       | 6.2.1        | 2h   | ☐      |
| 6.3.2 | Classification: per-page digital vs scanned (text char count >50, embedded fonts)           | 6.3.1        | 2h   | ☐      |
| 6.3.3 | Digital text extraction via PyMuPDF (per page, preserve layout hints)                       | 6.3.2        | 2h   | ☐      |
| 6.3.4 | Scanned page rasterization (PyMuPDF) → preprocessing (deskew, denoise, binarize via OpenCV) | 6.3.2        | 3h   | ☐      |
| 6.3.5 | Tesseract OCR via pytesseract; capture per-word confidence                                  | 6.3.4        | 2h   | ☐      |

### 6.4 Parser Plugin Architecture

| ID    | Task                                                                                                        | Dependencies | Est. | Status |
| ----- | ----------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 6.4.1 | Implement `ExamParser` ABC (detect, parse, confidence, describe) per 04-Doc-Processing §4.1                 | 6.1.3        | 1h   | ☐      |
| 6.4.2 | Create parser registry: priority-ordered list, `detect()` selects first match                               | 6.4.1        | 1h   | ☐      |
| 6.4.3 | **JEE Main Parser stub**: detect() = true for known layouts; parse() returns empty ParsedExam with warnings | 6.4.2        | 2h   | ☐      |

### 6.5 Confidence & Validation

| ID    | Task                                                                                                               | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 6.5.1 | Implement confidence scoring per 04-Doc-Processing §8.1 (OCR 30%, structure 30%, answer match 25%, validation 15%) | 6.3.5, 6.4.3 | 2h   | ☐      |
| 6.5.2 | Validation rules engine per §11 (duplicate numbers, missing options, missing answers, etc.)                        | 6.5.1        | 2h   | ☐      |
| 6.5.3 | ReviewBridge: on COMPLETED, create ReviewQueue row with workingJson = resultJson                                   | 6.5.2, 3.1.4 | 1h   | ☐      |

### 6.6 Golden-File Test Infrastructure

| ID    | Task                                                                                             | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 6.6.1 | Set up `tests/golden_files/` structure: input PDFs + expected `ParsedExam` JSON                  | 6.1.3        | 1h   | ☐      |
| 6.6.2 | Implement test runner: parse PDF → compare JSON (structural match, ignore confidence)            | 6.6.1        | 2h   | ☐      |
| 6.6.3 | CI integration: `make parser:test` runs golden files; `make parser:golden` regenerates (guarded) | 6.6.2        | 1h   | ☐      |

### 6.7 Docker & Deploy

| ID    | Task                                                                                           | Dependencies | Est. | Status |
| ----- | ---------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 6.7.1 | Write Dockerfile: Python 3.11, Tesseract + OpenCV deps, non-root user                          | 6.1.1        | 2h   | ☐      |
| 6.7.2 | Configure Railway/Render: env vars, persistent disk for temp OCR files, health checks          | 6.7.1        | 1h   | ☐      |
| 6.7.3 | Verify end-to-end: upload PDF → web creates job → processor picks up → callback → review queue | 6.7.2, 4.2.3 | 2h   | ☐      |

---

## Phase 7 — Review Queue & Question Editing (Week 9-10)

### 7.1 Review Queue UX Polish

| ID    | Task                                                                           | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 7.1.1 | Keyboard navigation in review list (j/k, enter to edit)                        | 4.3.3        | 1h   | ☐      |
| 7.1.2 | Confidence filter chips: High (≥90), Medium (70-89), Low (<70), Errors         | 4.3.2        | 1h   | ☐      |
| 7.1.3 | Diff view: show machine vs. edited text for each field                         | 4.3.4        | 2h   | ☐      |
| 7.1.4 | Image handling: display extracted images; re-upload/replace via StorageService | 5.1.3        | 2h   | ☐      |

### 7.2 Question Editor (Deep)

| ID    | Task                                                                           | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 7.2.1 | Full-screen question editor `/admin/exams/[id]/questions/[qid]` per UI/UX §7.5 | 4.3.4        | 3h   | ☐      |
| 7.2.2 | KaTeX rendering with fallback to raw text on error (UI/UX §18 QuestionCard)    | 7.2.1        | 1h   | ☐      |
| 7.2.3 | Autosave on blur per field; explicit "Mark Reviewed" button                    | 7.2.1        | 1h   | ☐      |
| 7.2.4 | Validation re-run on save; inline errors per field (UI/UX §11)                 | 6.5.2        | 1h   | ☐      |

### 7.3 Approve Flow

| ID    | Task                                                                                                                          | Dependencies | Est. | Status |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 7.3.1 | POST `/api/v1/review-queue/:id/approve` — server re-validates workingJson, runs publish transaction (05-Database-API.md §9.5) | 4.4.3, 3.1.4 | 2h   | ☐      |
| 7.3.2 | Idempotency key required on approve; duplicate returns original result                                                        | 7.3.1        | 1h   | ☐      |
| 7.3.3 | Reject flow: mark ReviewQueue REJECTED, no Exam created                                                                       | 7.3.1        | 0.5h | ☐      |

---

## Phase 8 — CBT Exam Engine (Week 10-13)

### 8.1 Student Exam Flow

| ID    | Task                                                                                                                    | Dependencies | Est. | Status |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 8.1.1 | Student dashboard: exam cards (Start / Resume / View Result) per UI/UX §7.11                                            | 2.1.4        | 2h   | ☐      |
| 8.1.2 | Instructions page `/exams/[id]/instructions`: admin content + system block + declaration checkbox                       | 4.4.1        | 2h   | ☐      |
| 8.1.3 | "Start Exam" enabled only after scroll-to-bottom + checkbox (UI/UX §7.8)                                                | 8.1.2        | 1h   | ☐      |
| 8.1.4 | POST `/api/v1/exams/:examId/attempts` — create Attempt (IN_PROGRESS), set expiresAt, return snapshotJson (no isCorrect) | 3.1.2        | 2h   | ☐      |

### 8.2 CBT Interface (Core)

| ID    | Task                                                                                                            | Dependencies | Est. | Status |
| ----- | --------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 8.2.1 | Build `/exams/[id]/attempt` layout: fixed header (timer, menu), 70/30 split, palette rail (UI/UX §7.9)          | 8.1.4        | 3h   | ☐      |
| 8.2.2 | Timer component: server-authoritative `expiresAt`, client countdown, calm→urgent at 10% (UI/UX §3.1, §18 Timer) | 8.2.1        | 2h   | ☐      |
| 8.2.3 | QuestionCard: stem (KaTeX), 4 radio options, Clear/Mark+Next/Prev/Save+Next buttons (UI/UX §18)                 | 8.2.1        | 3h   | ☐      |
| 8.2.4 | Palette rail: 40px cells, 5 states (not-visited, not-answered, answered, marked, answered+marked), instant swap | 8.2.1        | 3h   | ☐      |
| 8.2.5 | Keyboard shortcuts: 1-4/A-D select, → Save+Next, ← Prev, M Mark, C Clear, G## Jump (UI/UX §17)                  | 8.2.3, 8.2.4 | 2h   | ☐      |
| 8.2.6 | SyncIndicator: "Saved" / "Saving…" / "Retry" with backoff (UI/UX §10, §13)                                      | 8.2.1        | 2h   | ☐      |

### 8.3 Attempt Persistence

| ID    | Task                                                                                                | Dependencies | Est. | Status |
| ----- | --------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 8.3.1 | PATCH `/api/v1/attempts/:id/responses` — upsert AttemptResponse (selectedOptionId, markedForReview) | 3.1.2        | 1h   | ☐      |
| 8.3.2 | Client debounce (300ms) + flush on navigation/blur; queue retries on failure (UI/UX §13)            | 8.3.1        | 2h   | ☐      |
| 8.3.3 | Resume: GET `/api/v1/attempts/:id` merges AttemptResponse with snapshotJson                         | 8.1.4        | 1h   | ☐      |

### 8.4 Submit & Auto-Submit

| ID    | Task                                                                                                           | Dependencies | Est. | Status |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 8.4.1 | Submit confirmation modal: answered count, unanswered, marked (UI/UX §7.10)                                    | 8.2.1        | 1h   | ☐      |
| 8.4.2 | POST `/api/v1/attempts/:id/submit` — transaction per 05-Database-API.md §9.4 (score compute, status, AuditLog) | 3.1.2        | 2h   | ☐      |
| 8.4.3 | Idempotency key on submit; double-click safe                                                                   | 8.4.2        | 1h   | ☐      |
| 8.4.4 | Auto-submit cron job: find IN_PROGRESS where expiresAt < now → transition to AUTO_SUBMITTED, score             | 8.4.2        | 2h   | ☐      |

### 8.5 Results Page

| ID    | Task                                                                                                               | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 8.5.1 | GET `/api/v1/attempts/:id/result` — full breakdown (score, accuracy, time, per-question correct/incorrect/skipped) | 8.4.2        | 2h   | ☐      |
| 8.5.2 | Build `/attempts/[attemptId]/result` page: summary card + filterable review list (UI/UX §7.11)                     | 8.5.1        | 2h   | ☐      |
| 8.5.3 | Per-question view: stem, options, student answer, correct answer, explanation (if any)                             | 8.5.2        | 2h   | ☐      |

### 8.6 Offline & Resilience

| ID    | Task                                                                                        | Dependencies | Est. | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 8.6.1 | Offline queue in memory (FIFO, replace same question); retry with backoff (1s,2s,4s,8s cap) | 8.3.2        | 2h   | ☐      |
| 8.6.2 | Sync indicator states per UI/UX §13; submit disabled offline with explanation               | 8.6.1        | 1h   | ☐      |
| 8.6.3 | Tab close/reopen: resume from last synced state (no localStorage persistence in v0)         | 8.3.3        | 1h   | ☐      |

---

## Phase 9 — Results & Analytics (Week 13-14)

### 9.1 Student Results

| ID    | Task                                                                   | Dependencies | Est. | Status |
| ----- | ---------------------------------------------------------------------- | ------------ | ---- | ------ |
| 9.1.1 | Attempt history on student dashboard (past attempts with scores)       | 8.5.1        | 1h   | ☐      |
| 9.1.2 | Result sharing: generate signed URL for result page (optional, future) | 8.5.1        | 1h   | ☐      |

### 9.2 Admin Aggregate Results

| ID    | Task                                                                 | Dependencies | Est. | Status |
| ----- | -------------------------------------------------------------------- | ------------ | ---- | ------ |
| 9.2.1 | GET `/api/v1/exams/:examId/results` — paginated attempts with scores | 3.1.2        | 1h   | ☐      |
| 9.2.2 | Admin monitor: live attempt count, average score, completion rate    | 4.5.1        | 1h   | ☐      |

---

## Phase 10 — Testing, Optimization, Deployment (Week 14-15)

### 10.1 Test Coverage

| ID     | Task                                                                               | Dependencies | Est. | Status |
| ------ | ---------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 10.1.1 | Unit tests: AuthService, repositories, scoring logic, confidence calc              | All prior    | 4h   | ☐      |
| 10.1.2 | Integration tests: API endpoints (auth, upload, attempt, submit, review)           | All prior    | 4h   | ☐      |
| 10.1.3 | E2E tests (Playwright): admin upload→review→publish; student attempt→submit→result | All prior    | 4h   | ☐      |
| 10.1.4 | Parser golden-file tests with 3+ real JEE Main PDFs (when available)               | 6.6.3, Q1    | 3h   | ☐      |

### 10.2 Performance & Hardening

| ID     | Task                                                                                 | Dependencies | Est. | Status |
| ------ | ------------------------------------------------------------------------------------ | ------------ | ---- | ------ |
| 10.2.1 | Load test CBT: 50 concurrent attempts, verify autosave <150ms, timer sync            | 8.4.4        | 2h   | ☐      |
| 10.2.2 | Bundle analysis: remove unused deps; ensure CBT route <200KB JS                      | 8.2.1        | 1h   | ☐      |
| 10.2.3 | Database query audit: EXPLAIN ANALYZE on hot paths (attempt start, resume, submit)   | 3.1.2        | 1h   | ☐      |
| 10.2.4 | Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy via Next.js middleware | 1.4.6        | 1h   | ☐      |
| 10.2.5 | Dependency audit: `npm audit`, `pip-audit`; pin versions                             | All          | 1h   | ☐      |

### 10.3 Production Deployment

| ID     | Task                                                                  | Dependencies | Est. | Status |
| ------ | --------------------------------------------------------------------- | ------------ | ---- | ------ |
| 10.3.1 | Production env vars in Vercel/Railway/Supabase dashboards             | 1.1.7        | 1h   | ☐      |
| 10.3.2 | Custom domain + TLS (Vercel)                                          | 10.3.1       | 0.5h | ☐      |
| 10.3.3 | Supabase backup schedule verified; restore test documented            | 10.3.1       | 1h   | ☐      |
| 10.3.4 | Monitoring: Vercel Analytics + Sentry (free tier) for errors          | 10.3.1       | 1h   | ☐      |
| 10.3.5 | Runbook: common incidents (parser stuck, upload failing, auth issues) | All          | 2h   | ☐      |

### 10.4 Validation & Handoff

| ID     | Task                                                                                                            | Dependencies | Est. | Status |
| ------ | --------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ------ |
| 10.4.1 | End-to-end validation with real students: upload real PDF → publish → student takes → result matches hand-check | 10.1.3, Q1   | 4h   | ☐      |
| 10.4.2 | Document known limitations & parser accuracy metrics                                                            | 10.4.1       | 1h   | ☐      |
| 10.4.3 | Retrospective: update CLAUDE.md, ARCHITECTURE-REVIEW.md with lessons learned                                    | All          | 1h   | ☐      |

---

## Dependency Graph (Critical Path)

```
1.1 → 1.2 → 1.3 → 1.4 → 2.1 → 2.2
                    ↓
                3.1 → 4.1 → 4.2 → 4.3 → 4.4 → 4.5
                    ↓         ↓
                5.1 → 5.2      6.1 → 6.2 → 6.3 → 6.4 → 6.5 → 6.6 → 6.7
                                                          ↓
                                                        7.1 → 7.2 → 7.3
                    ↓
                8.1 → 8.2 → 8.3 → 8.4 → 8.5 → 8.6
                    ↓                    ↓
                9.1                  9.2
                    ↓                    ↓
                10.1 → 10.2 → 10.3 → 10.4
```

**Critical Path:** 1.1 → 1.2 → 1.4 → 3.1 → 4.2 → 6.1 → 6.2 → 6.7 → 7.3 → 8.1 → 8.4 → 10.4

---

## Milestones

| Milestone                      | Target Week | Criteria                                                                  |
| ------------------------------ | ----------- | ------------------------------------------------------------------------- |
| **M1: Foundation Ready**       | Week 2      | CI green, Prisma migrated, Auth working, preview deploys                  |
| **M2: Admin Can Publish**      | Week 5      | Upload → review → configure → publish works end-to-end (parser stubbed)   |
| **M3: Parser Pipeline Live**   | Week 9      | Real PDF → processor → review queue → approve → exam published            |
| **M4: Student Can Test**       | Week 13     | Dashboard → instructions → CBT → submit → result (auto + manual)          |
| **M5: v0 Validation Complete** | Week 15     | Real students complete real exams; results match hand-check; docs updated |

---

## Open Questions Tracking

| ID  | Question                                  | Owner | Resolved?                   |
| --- | ----------------------------------------- | ----- | --------------------------- |
| Q1  | Real JEE Main PDFs for parser development | User  | ☐                           |
| Q2  | Email provider (deferred)                 | —     | ✅ Not needed v0            |
| Q3  | Validation group size/timeline            | User  | ✅ Small, correctness-first |
| Q4  | Exam duration configurable                | —     | ✅ Yes (schema supports)    |
| Q5  | Institutional branding                    | —     | ✅ Out of scope             |

---

## Task Conventions

- **Status:** ☐ Not Started | 🔄 In Progress | ✅ Done | ⏸ Blocked
- **One task = one PR** (small, reviewable)
- **Update status in this file** when starting/completing
- **Blockers** noted in Status column with 🔴
- **Definition of Done** per CLAUDE.md §6 applies to every task

---

_This roadmap is the execution contract. Tasks are not optional. Phase gates are enforced. Scope changes require explicit approval._
