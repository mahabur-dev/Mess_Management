CREATE TABLE "push_notification_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "push_notification_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_notification_subscriptions_endpoint_key" ON "push_notification_subscriptions"("endpoint");

CREATE INDEX "push_notification_subscriptions_user_id_is_active_idx" ON "push_notification_subscriptions"("user_id", "is_active");

ALTER TABLE "push_notification_subscriptions"
ADD CONSTRAINT "push_notification_subscriptions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
