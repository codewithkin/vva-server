/*
  Warnings:

  - You are about to drop the column `admissionId` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Student_admissionId_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "admissionId";

-- CreateIndex
CREATE UNIQUE INDEX "Student_name_key" ON "Student"("name");
