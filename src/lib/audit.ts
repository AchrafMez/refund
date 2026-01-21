import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export async function logActivity(
  userId: string,
  action: AuditAction,
  entityId: string,
  details?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityId,
        details: details ?? {},
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // We don't throw here to avoid failing the main action just because logging failed
  }
}
