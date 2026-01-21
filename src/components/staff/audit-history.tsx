"use client";

import { getRefundAuditLogs, AuditLogWithUser } from "@/actions/audit";
import { useQuery } from "@tanstack/react-query";
import {
    Upload,
    CheckCircle,
    XCircle,
    Edit,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface AuditHistoryProps {
    refundId: string;
    isOpen: boolean;
    onToggle: () => void;
}

const actionConfig: Record<
    string,
    { icon: React.ReactNode; color: string; label: string }
> = {
    CREATE: {
        icon: <Edit size={16} />,
        color: "#3b82f6",
        label: "Created Request",
    },
    UPDATE: {
        icon: <Edit size={16} />,
        color: "#f59e0b",
        label: "Updated",
    },
    APPROVE: {
        icon: <CheckCircle size={16} />,
        color: "#22c55e",
        label: "Approved",
    },
    REJECT: {
        icon: <XCircle size={16} />,
        color: "#ef4444",
        label: "Rejected",
    },
    UPLOAD: {
        icon: <Upload size={16} />,
        color: "#8b5cf6",
        label: "Uploaded Receipt",
    },
};

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
}

export function AuditHistory({ refundId, isOpen, onToggle }: AuditHistoryProps) {
    // Use TanStack Query for real-time updates across sessions
    const { data: logs = [], isLoading: loading, isError, error, refetch } = useQuery({
        queryKey: ["auditLogs", refundId],
        queryFn: () => getRefundAuditLogs(refundId),
        enabled: isOpen, // Only fetch when opened
        staleTime: 3000, // Consider data fresh for 3 seconds
        refetchOnWindowFocus: true, // Refetch when user returns to tab
        refetchInterval: isOpen ? 5000 : false, // Auto-refresh every 5s when open for cross-session real-time
    });

    const renderDetails = (details: Record<string, unknown>, action: string) => {
        const items: string[] = [];

        if (details.oldStatus && details.newStatus) {
            items.push(`Status: ${details.oldStatus} → ${details.newStatus}`);
        }
        if (details.amountFinal !== undefined) {
            items.push(`Final Amount: DH ${details.amountFinal}`);
        }
        if (details.reason) {
            items.push(`Reason: ${details.reason}`);
        }
        if (details.receiptUrl) {
            items.push(`Receipt uploaded`);
        }
        if (details.amount !== undefined && action === "UPLOAD") {
            items.push(`Amount: DH ${details.amount}`);
        }

        return items.length > 0 ? (
            <div
                style={{
                    marginTop: "0.25rem",
                    fontSize: "0.75rem",
                    color: "#71717a",
                }}
            >
                {items.map((item, i) => (
                    <div key={i}>{item}</div>
                ))}
            </div>
        ) : null;
    };

    return (
        <div style={{ borderTop: "1px solid #e4e4e7", marginTop: "1rem" }}>
            <button
                onClick={onToggle}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#71717a",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    width: "100%",
                }}
            >
                <Clock size={16} />
                Activity History
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div
                    style={{
                        padding: "0.5rem 0 1rem 0",
                        maxHeight: "300px",
                        overflowY: "auto",
                    }}
                >
                    {loading && (
                        <div style={{ color: "#71717a", fontSize: "0.875rem" }}>
                            Loading history...
                        </div>
                    )}

                    {isError && (
                        <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>
                            Failed to load history
                        </div>
                    )}

                    {!loading && !isError && logs.length === 0 && (
                        <div style={{ color: "#71717a", fontSize: "0.875rem" }}>
                            No activity yet.
                        </div>
                    )}

                    {!loading &&
                        logs.map((log, index) => {
                            const config = actionConfig[log.action] || {
                                icon: <Edit size={16} />,
                                color: "#71717a",
                                label: log.action,
                            };

                            return (
                                <div
                                    key={log.id}
                                    style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        padding: "0.5rem 0",
                                        borderLeft:
                                            index < logs.length - 1
                                                ? "2px solid #e4e4e7"
                                                : "2px solid transparent",
                                        marginLeft: "0.5rem",
                                        paddingLeft: "1rem",
                                        position: "relative",
                                    }}
                                >
                                    {/* Timeline dot */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "-0.5rem",
                                            top: "0.625rem",
                                            width: "1rem",
                                            height: "1rem",
                                            borderRadius: "50%",
                                            backgroundColor: config.color,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                        }}
                                    >
                                        {config.icon}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {/* User avatar */}
                                            {log.user.image ? (
                                                <img
                                                    src={log.user.image}
                                                    alt={log.user.name || "User"}
                                                    style={{
                                                        width: "1.25rem",
                                                        height: "1.25rem",
                                                        borderRadius: "50%",
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "1.25rem",
                                                        height: "1.25rem",
                                                        borderRadius: "50%",
                                                        backgroundColor: "#e4e4e7",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <User size={12} />
                                                </div>
                                            )}

                                            <span
                                                style={{
                                                    fontSize: "0.875rem",
                                                    fontWeight: 500,
                                                    color: "#18181b",
                                                }}
                                            >
                                                {log.user.name || log.user.email}
                                            </span>

                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#a1a1aa",
                                                    backgroundColor: "#f4f4f5",
                                                    padding: "0.125rem 0.375rem",
                                                    borderRadius: "0.25rem",
                                                }}
                                            >
                                                {log.user.role}
                                            </span>

                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#a1a1aa",
                                                    marginLeft: "auto",
                                                }}
                                            >
                                                {formatTimeAgo(log.createdAt)}
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "0.875rem",
                                                color: "#52525b",
                                                marginTop: "0.25rem",
                                            }}
                                        >
                                            {config.label}
                                        </div>

                                        {renderDetails(log.details as Record<string, unknown>, log.action)}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
