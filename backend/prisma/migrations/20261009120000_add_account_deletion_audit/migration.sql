ALTER TABLE "users"
ADD COLUMN "deleted_at" TIMESTAMPTZ,
ADD COLUMN "avatar_public_id" TEXT,
ADD COLUMN "nid_image_public_id" TEXT;

CREATE INDEX "users_is_active_deleted_at_idx"
ON "users"("is_active", "deleted_at");
