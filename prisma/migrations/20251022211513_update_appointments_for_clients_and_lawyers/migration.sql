-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'client',
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "caseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
