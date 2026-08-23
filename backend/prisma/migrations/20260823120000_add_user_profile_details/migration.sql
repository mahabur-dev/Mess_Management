ALTER TABLE "users"
  ADD COLUMN "nid_number" VARCHAR(32),
  ADD COLUMN "nid_image_url" TEXT,
  ADD COLUMN "location" VARCHAR(255),
  ADD COLUMN "state" VARCHAR(100),
  ADD COLUMN "city" VARCHAR(100),
  ADD COLUMN "zipcode" VARCHAR(20);

CREATE UNIQUE INDEX "users_nid_number_key" ON "users"("nid_number");
