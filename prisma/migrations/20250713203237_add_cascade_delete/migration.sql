-- DropForeignKey
ALTER TABLE "Memo" DROP CONSTRAINT "Memo_locationId_fkey";

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
