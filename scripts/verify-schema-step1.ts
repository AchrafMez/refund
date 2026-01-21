import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.certificateCatalog.count();
    console.log(`✅ CertificateCatalog exists with ${count} records.`);
    
    if (count > 0) {
        const certs = await prisma.certificateCatalog.findMany();
        console.log("Sample:", certs[0].name);
    }
  } catch (error) {
    console.error("❌ Verification Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
