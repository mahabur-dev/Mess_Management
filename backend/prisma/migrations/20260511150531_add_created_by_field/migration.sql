/*
  Warnings:

  - The values [ORGANIZER] on the enum `MembershipRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MembershipRole_new" AS ENUM ('MANAGER', 'MEMBER');
ALTER TABLE "public"."mess_memberships" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "mess_memberships" ALTER COLUMN "role" TYPE "MembershipRole_new" USING ("role"::text::"MembershipRole_new");
ALTER TYPE "MembershipRole" RENAME TO "MembershipRole_old";
ALTER TYPE "MembershipRole_new" RENAME TO "MembershipRole";
DROP TYPE "public"."MembershipRole_old";
ALTER TABLE "mess_memberships" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterTable
ALTER TABLE "mess_memberships" ADD COLUMN     "created_by" UUID;
