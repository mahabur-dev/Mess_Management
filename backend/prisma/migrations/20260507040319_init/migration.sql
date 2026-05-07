-- AlterEnum
ALTER TYPE "GlobalRole" ADD VALUE 'ORGANIZER';

-- AlterEnum
ALTER TYPE "MembershipRole" ADD VALUE 'ORGANIZER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" VARCHAR(6),
ADD COLUMN     "otp_expiry" TIMESTAMPTZ;
