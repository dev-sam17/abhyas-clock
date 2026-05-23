/*
  Warnings:

  - You are about to drop the column `collection_id` on the `test_presets` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "test_presets" DROP CONSTRAINT "test_presets_collection_id_fkey";

-- DropIndex
DROP INDEX "test_presets_collection_id_idx";

-- AlterTable
ALTER TABLE "test_presets" DROP COLUMN "collection_id",
ADD COLUMN     "chapter_id" INTEGER;

-- CreateTable
CREATE TABLE "chapters" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "chapter_number" INTEGER NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chapters_collection_id_idx" ON "chapters"("collection_id");

-- CreateIndex
CREATE INDEX "test_presets_chapter_id_idx" ON "test_presets"("chapter_id");

-- AddForeignKey
ALTER TABLE "test_presets" ADD CONSTRAINT "test_presets_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
