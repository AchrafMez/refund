import { prisma } from "@/lib/prisma";

export interface CertificateStats {
  popularCerts: { name: string; count: number }[];
  validationRate: number; // Percentage 0-100
  avgCompletionDays: number;
}

export async function getCertificateStats(): Promise<CertificateStats> {
  // 1. Popular Certificates
  // Group by certificateId and count
  const popularRaw = await prisma.refundRequest.groupBy({
    by: ["certificateId"],
    _count: {
      certificateId: true,
    },
    where: {
      type: "CERTIFICATION",
      certificateId: { not: null },
    },
    orderBy: {
      _count: {
        certificateId: "desc",
      },
    },
    take: 5,
  });

  // Fetch names
  const popularCerts = await Promise.all(
    popularRaw.map(async (item) => {
      const cert = await prisma.certificateCatalog.findUnique({
        where: { id: item.certificateId! },
        select: { name: true },
      });
      return {
        name: cert?.name || "Unknown Cert",
        count: item._count.certificateId,
      };
    })
  );

  // 2. Validation Rate (Approved vs Rejected)
  // We consider "PAID" and "VERIFIED_READY" (approved by logic) vs "DECLINED"
  // Or strictly PAID vs DECLINED as completed states.
  // Prompt says: "Validation rate: Approved vs Rejected"
  const [approvedCount, rejectedCount] = await Promise.all([
    prisma.refundRequest.count({
      where: {
        type: "CERTIFICATION",
        status: { in: ["PAID", "VERIFIED_READY"] }, // Assuming these mean approved/valid
      },
    }),
    prisma.refundRequest.count({
      where: {
        type: "CERTIFICATION",
        status: "DECLINED",
      },
    }),
  ]);

  const totalDecided = approvedCount + rejectedCount;
  const validationRate = totalDecided > 0 
    ? (approvedCount / totalDecided) * 100 
    : 0;

  // 3. Average Completion Time
  // Creation to Last Update for PAID requests
  const completedRequests = await prisma.refundRequest.findMany({
    where: {
      type: "CERTIFICATION",
      status: "PAID",
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  let totalDays = 0;
  if (completedRequests.length > 0) {
    totalDays = completedRequests.reduce((acc, req) => {
      const diff = req.updatedAt.getTime() - req.createdAt.getTime();
      return acc + diff;
    }, 0) / (1000 * 60 * 60 * 24); // ms to days
  }

  const avgCompletionDays = completedRequests.length > 0 
    ? totalDays / completedRequests.length 
    : 0;

  return {
    popularCerts,
    validationRate: parseFloat(validationRate.toFixed(1)),
    avgCompletionDays: parseFloat(avgCompletionDays.toFixed(1)),
  };
}
