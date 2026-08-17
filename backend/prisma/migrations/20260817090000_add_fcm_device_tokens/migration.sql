CREATE TYPE "PushDevicePlatform" AS ENUM ('ANDROID');

CREATE TABLE "fcm_device_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "PushDevicePlatform" NOT NULL DEFAULT 'ANDROID',
    "app_version" VARCHAR(40),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "fcm_device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fcm_device_tokens_token_key" ON "fcm_device_tokens"("token");
CREATE INDEX "fcm_device_tokens_user_id_is_active_idx" ON "fcm_device_tokens"("user_id", "is_active");

ALTER TABLE "fcm_device_tokens"
ADD CONSTRAINT "fcm_device_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
