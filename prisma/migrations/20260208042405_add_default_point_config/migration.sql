/*
  Warnings:

  - Added the required column `defaultPointConfig` to the `Comp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comp" ADD COLUMN     "defaultPointConfig" JSONB NOT NULL;
