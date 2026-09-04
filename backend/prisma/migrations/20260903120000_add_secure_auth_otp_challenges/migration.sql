-- Existing password users were allowed to sign in before email verification
-- was enforced. Grandfather them during rollout so the deployment does not
-- unexpectedly lock out active accounts. All new users retain the false default.
UPDATE "users" SET "is_verified" = true;

CREATE TYPE "AuthOtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

CREATE TABLE "auth_otp_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "purpose" "AuthOtpPurpose" NOT NULL,
    "otp_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "resend_available_at" TIMESTAMPTZ NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMPTZ,
    "verification_token_hash" VARCHAR(64),
    "verification_token_expiry" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "auth_otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_otp_challenges_user_id_purpose_key"
ON "auth_otp_challenges"("user_id", "purpose");

CREATE INDEX "auth_otp_challenges_expires_at_idx"
ON "auth_otp_challenges"("expires_at");

ALTER TABLE "auth_otp_challenges"
ADD CONSTRAINT "auth_otp_challenges_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- These legacy columns held plain-text, mixed-purpose OTP state. Clear them;
-- they remain temporarily for backwards-compatible schema rollout.
UPDATE "users" SET "otp" = NULL, "otp_expiry" = NULL;
