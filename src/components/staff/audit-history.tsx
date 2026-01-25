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
    History,
} from "lucide-react";

interface AuditHistoryProps {
    refundId: string;
    isOpen: boolean;
    onToggle: () => void;
}

const actionConfig: Record<
    string,
    { icon: React.ReactNode; color: string; bgColor: string; label: string }
> = {
    CREATE: {
        icon: <Edit size={12} />,
        color: "#3b82f6",
        bgColor: "#eff6ff",
        label: "Created Request",
    },
    UPDATE: {
        icon: <Edit size={12} />,
        color: "#f59e0b",
        bgColor: "#fffbeb",
        label: "Updated",
    },
    APPROVE: {
        icon: <CheckCircle size={12} />,
        color: "#22c55e",
        bgColor: "#f0fdf4",
        label: "Approved",
    },
    REJECT: {
        icon: <XCircle size={12} />,
        color: "#ef4444",
        bgColor: "#fef2f2",
        label: "Rejected",
    },
    UPLOAD: {
        icon: <Upload size={12} />,
        color: "#8b5cf6",
        bgColor: "#faf5ff",
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
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Skeleton loader for loading state
function SkeletonItem() {
    return (
        <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0' }}>
            <div style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '50%',
                backgroundColor: '#f4f4f5',
                animation: 'pulse 2s ease-in-out infinite'
            }} />
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '6rem', height: '0.875rem', backgroundColor: '#f4f4f5', borderRadius: '0.25rem' }} />
                    <div style={{ width: '3rem', height: '0.875rem', backgroundColor: '#f4f4f5', borderRadius: '0.25rem' }} />
                </div>
                <div style={{ width: '8rem', height: '0.75rem', backgroundColor: '#f4f4f5', borderRadius: '0.25rem' }} />
            </div>
        </div>
    );
}

export function AuditHistory({ refundId, isOpen, onToggle }: AuditHistoryProps) {
    const { data: logs = [], isLoading: loading, isError } = useQuery({
        queryKey: ["auditLogs", refundId],
        queryFn: () => getRefundAuditLogs(refundId),
        enabled: isOpen,
        staleTime: 3000,
        refetchOnWindowFocus: true,
        refetchInterval: isOpen ? 5000 : false,
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
                    marginTop: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#fafafa",
                    borderRadius: "0.375rem",
                    border: "1px solid #f4f4f5",
                    fontSize: "0.75rem",
                    color: "#52525b",
                    lineHeight: 1.5,
                }}
            >
                {items.map((item, i) => (
                    <div key={i}>{item}</div>
                ))}
            </div>
        ) : null;
    };

    return (
        <div
            style={{
                backgroundColor: 'white',
                border: '1px solid #e4e4e7',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                overflow: 'hidden',
                marginTop: '1.5rem'
            }}
        >
            {/* Header - matches Expense Details style */}
            <button
                onClick={onToggle}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "1rem 1.5rem",
                    background: isOpen ? "#fafafa" : "white",
                    border: "none",
                    borderBottom: isOpen ? "1px solid #f4f4f5" : "none",
                    cursor: "pointer",
                    transition: "background 150ms",
                }}
            >
                <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#18181b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <History size={14} style={{ color: '#71717a' }} />
                    Activity History
                </h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#71717a'
                }}>
                    {!isOpen && logs.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                        </span>
                    )}
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>

            {/* Content */}
            {isOpen && (
                <div style={{ padding: "1rem 1.5rem" }}>
                    {/* Loading State */}
                    {loading && (
                        <div>
                            <SkeletonItem />
                            <SkeletonItem />
                        </div>
                    )}

                    {/* Error State */}
                    {isError && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem',
                            backgroundColor: '#fef2f2',
                            borderRadius: '0.5rem',
                            color: '#dc2626',
                            fontSize: '0.875rem'
                        }}>
                            <XCircle size={16} />
                            Failed to load history
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !isError && logs.length === 0 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '2rem 1rem',
                            color: '#a1a1aa'
                        }}>
                            <Clock size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                            <span style={{ fontSize: '0.875rem' }}>No activity yet</span>
                        </div>
                    )}

                    {/* Timeline */}
                    {!loading && logs.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            {/* Timeline line */}
                            <div style={{
                                position: 'absolute',
                                left: '0.8125rem',
                                top: '1.75rem',
                                bottom: '1rem',
                                width: '2px',
                                backgroundColor: '#f4f4f5',
                            }} />

                            {logs.map((log, index) => {
                                const config = actionConfig[log.action] || {
                                    icon: <Edit size={12} />,
                                    color: "#71717a",
                                    bgColor: "#f4f4f5",
                                    label: log.action,
                                };

                                return (
                                    <div
                                        key={log.id}
                                        style={{
                                            display: "flex",
                                            gap: "1rem",
                                            paddingBottom: index < logs.length - 1 ? "1.25rem" : "0",
                                            position: "relative",
                                        }}
                                    >
                                        {/* Timeline dot */}
                                        <div
                                            style={{
                                                width: "1.625rem",
                                                height: "1.625rem",
                                                borderRadius: "50%",
                                                backgroundColor: config.bgColor,
                                                border: `2px solid ${config.color}`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: config.color,
                                                flexShrink: 0,
                                                zIndex: 1,
                                            }}
                                        >
                                            {config.icon}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* User row */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    flexWrap: "wrap",
                                                    marginBottom: "0.25rem",
                                                }}
                                            >
                                                {/* Avatar */}
                                                {log.user.image ? (
                                                    <img
                                                        src={log.user.image}
                                                        alt={log.user.name || "User"}
                                                        style={{
                                                            width: "1.5rem",
                                                            height: "1.5rem",
                                                            borderRadius: "0.25rem",
                                                            border: "1px solid #e4e4e7",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "1.5rem",
                                                            height: "1.5rem",
                                                            borderRadius: "0.25rem",
                                                            backgroundColor: "#f4f4f5",
                                                            border: "1px solid #e4e4e7",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#71717a",
                                                        }}
                                                    >
                                                        <User size={12} />
                                                    </div>
                                                )}

                                                {/* Name */}
                                                <span
                                                    style={{
                                                        fontSize: "0.875rem",
                                                        fontWeight: 600,
                                                        color: "#18181b",
                                                    }}
                                                >
                                                    {log.user.name || log.user.email}
                                                </span>

                                                {/* Role badge */}
                                                <span
                                                    style={{
                                                        fontSize: "0.625rem",
                                                        fontWeight: 500,
                                                        color: log.user.role === 'STAFF' ? '#7c3aed' : '#71717a',
                                                        backgroundColor: log.user.role === 'STAFF' ? '#f5f3ff' : '#f4f4f5',
                                                        padding: "0.125rem 0.375rem",
                                                        borderRadius: "0.25rem",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.025em",
                                                    }}
                                                >
                                                    {log.user.role}
                                                </span>

                                                {/* Time */}
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

                                            {/* Action label */}
                                            <div
                                                style={{
                                                    fontSize: "0.875rem",
                                                    fontWeight: 500,
                                                    color: "#3f3f46",
                                                }}
                                            >
                                                {config.label}
                                            </div>

                                            {/* Details */}
                                            {renderDetails(log.details as Record<string, unknown>, log.action)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
