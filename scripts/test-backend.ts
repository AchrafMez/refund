import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { getCertificateStats } from "@/lib/analytics";
import { AuditAction } from "@prisma/client";

async function main() {
  console.log("🧪 Testing Backend Logic...");

  // 1. Test Audit Logging
  try {
    // Need a user ID. Let's find one or create a dummy one logic if needed.
    // Assuming seed or existing DB has at least one user, or we default to a "system" user if we can.
    // For this test, let's look for a user.
    const user = await prisma.user.findFirst();
    if (user) {
        console.log(`Creating audit log for user ${user.email}...`);
        await logActivity(user.id, AuditAction.UPDATE, "test-entity-id", { test: true });
        
        // Verify it was created
        const log = await prisma.auditLog.findFirst({
            where: { entityId: "test-entity-id" },
            orderBy: { createdAt: 'desc' }
        });
        if (log) {
            console.log("✅ Audit Log verified:", log.action);
        } else {
            console.error("❌ Audit Log NOT found.");
        }
    } else {
        console.warn("⚠️ No user found, skipping audit log test.");
    }
  } catch (e) {
    console.error("❌ Audit Log Test Failed:", e);
  }

  // 2. Test Analytics
  try {
    console.log("Fetching Certificate Stats...");
    const stats = await getCertificateStats();
    console.log("✅ Stats received:", JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error("❌ Analytics Test Failed:", e);
  }

  await prisma.$disconnect();
}

main();
