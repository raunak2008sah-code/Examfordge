-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'REVIEWER', 'STUDENT');

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('QUESTION_PAPER', 'ANSWER_KEY');

-- CreateEnum
CREATE TYPE "ParserStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExamVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "OptionLabel" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('JEE_MAIN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "roleId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "purpose" "FilePurpose" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parser_jobs" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "answerKeyFileId" UUID,
    "status" "ParserStatus" NOT NULL,
    "resultJson" JSONB,
    "overallConfidence" DOUBLE PRECISION,
    "errorSummary" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parser_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_queues" (
    "id" UUID NOT NULL,
    "parserJobId" UUID NOT NULL,
    "workingJson" JSONB NOT NULL,
    "status" "ReviewStatus" NOT NULL,
    "assignedTo" UUID,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "review_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "ownerId" UUID NOT NULL,
    "currentVersionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_versions" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ExamVersionStatus" NOT NULL,
    "snapshotJson" JSONB,
    "publishedBy" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "exam_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "examVersionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "order" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" "OptionLabel" NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "examVersionId" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION,
    "lastAutosaveAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_responses" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "selectedOptionId" UUID,
    "answeredAt" TIMESTAMP(3),
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attempt_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_storagePath_key" ON "uploaded_files"("storagePath");

-- CreateIndex
CREATE INDEX "uploaded_files_uploadedBy_idx" ON "uploaded_files"("uploadedBy");

-- CreateIndex
CREATE INDEX "uploaded_files_checksum_idx" ON "uploaded_files"("checksum");

-- CreateIndex
CREATE INDEX "parser_jobs_status_idx" ON "parser_jobs"("status");

-- CreateIndex
CREATE INDEX "parser_jobs_fileId_idx" ON "parser_jobs"("fileId");

-- CreateIndex
CREATE INDEX "parser_jobs_overallConfidence_idx" ON "parser_jobs"("overallConfidence");

-- CreateIndex
CREATE UNIQUE INDEX "review_queues_parserJobId_key" ON "review_queues"("parserJobId");

-- CreateIndex
CREATE INDEX "review_queues_status_idx" ON "review_queues"("status");

-- CreateIndex
CREATE INDEX "review_queues_assignedTo_idx" ON "review_queues"("assignedTo");

-- CreateIndex
CREATE INDEX "exams_ownerId_idx" ON "exams"("ownerId");

-- CreateIndex
CREATE INDEX "exams_examType_idx" ON "exams"("examType");

-- CreateIndex
CREATE INDEX "exam_versions_status_idx" ON "exam_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_versions_examId_versionNumber_key" ON "exam_versions"("examId", "versionNumber");

-- CreateIndex
CREATE INDEX "sections_examVersionId_idx" ON "sections"("examVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "sections_examVersionId_order_key" ON "sections"("examVersionId", "order");

-- CreateIndex
CREATE INDEX "questions_sectionId_idx" ON "questions"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "questions_sectionId_order_key" ON "questions"("sectionId", "order");

-- CreateIndex
CREATE INDEX "options_questionId_idx" ON "options"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "options_questionId_label_key" ON "options"("questionId", "label");

-- CreateIndex
CREATE INDEX "attempts_userId_idx" ON "attempts"("userId");

-- CreateIndex
CREATE INDEX "attempts_examVersionId_idx" ON "attempts"("examVersionId");

-- CreateIndex
CREATE INDEX "attempts_status_idx" ON "attempts"("status");

-- CreateIndex
CREATE INDEX "attempt_responses_questionId_idx" ON "attempt_responses"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_responses_attemptId_questionId_key" ON "attempt_responses"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parser_jobs" ADD CONSTRAINT "parser_jobs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parser_jobs" ADD CONSTRAINT "parser_jobs_answerKeyFileId_fkey" FOREIGN KEY ("answerKeyFileId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queues" ADD CONSTRAINT "review_queues_parserJobId_fkey" FOREIGN KEY ("parserJobId") REFERENCES "parser_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queues" ADD CONSTRAINT "review_queues_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queues" ADD CONSTRAINT "review_queues_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "exam_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_versions" ADD CONSTRAINT "exam_versions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_versions" ADD CONSTRAINT "exam_versions_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "exam_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_examVersionId_fkey" FOREIGN KEY ("examVersionId") REFERENCES "exam_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Custom Migration: Partial unique index for active attempts
CREATE UNIQUE INDEX attempts_active_idx ON attempts("userId", "examVersionId") WHERE status = 'IN_PROGRESS';

