CREATE TABLE "member_join_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "requester_id" UUID NOT NULL,
  "mess_id" UUID NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
  "review_note" TEXT,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "member_join_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "member_join_requests_mess_id_status_idx" ON "member_join_requests"("mess_id", "status");
CREATE INDEX "member_join_requests_requester_id_idx" ON "member_join_requests"("requester_id");
CREATE INDEX "member_join_requests_status_created_at_idx" ON "member_join_requests"("status", "created_at");

ALTER TABLE "member_join_requests" ADD CONSTRAINT "member_join_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_join_requests" ADD CONSTRAINT "member_join_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_join_requests" ADD CONSTRAINT "member_join_requests_mess_id_fkey" FOREIGN KEY ("mess_id") REFERENCES "messes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
