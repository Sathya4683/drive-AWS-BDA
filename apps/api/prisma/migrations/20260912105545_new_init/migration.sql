/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_name_key" ON "public"."Folder"("userId", "name");
