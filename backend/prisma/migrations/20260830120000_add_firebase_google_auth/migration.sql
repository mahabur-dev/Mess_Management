-- Link Firebase identities to Messzen users while keeping the existing
-- password sign-in path available for accounts that already use it.
ALTER TABLE "users" ADD COLUMN "firebase_uid" VARCHAR(128);

CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");
