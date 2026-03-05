'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = 'http://localhost:8000'

interface Application {
    id: string
    status: string
    applied_at: string
    notes: string | null
    job: {
        title: string
        company_name: string
        location: string
        apply_link: string
    }
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    applied:   { label: 'Applied', color: '#60a5fa', bg: '#1e3a5f' },
    interview: { label: 'Interviewing', color: '#eab308', bg: '#713f12' },
    offer:     { label: 'Offer', color: '#22c55e', bg: '#14532d' },
    rejected:  { label: 'Rejected', color: '#ef4444', bg: '#3f1515' },
    ghosted:   { label: 'Ghosted', color: '#888', bg: '#222' },
}

export default function ApplicationsPage() {
    const router = useRouter()
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${API_BASE}/applications/`)
            const data = await res.json()
            setApplications(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (appId: string, status: string) => {
        setUpdatingId(appId)
        try {
            await fetch(`${API_BASE}/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            await fetchApplications()
        } catch (e) {
            console.error(e)
        } finally {
            setUpdatingId(null)
        }
    }

    const stats = {
        total: applications.length,
        interview: applications.filter(a => a.status === 'interview').length,
        offer: applications.filter(a => a.status === 'offer').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#666' }}>Loading...</p>
        </div>
    )
    return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: "'DM Mono', monospace", padding: '48px 32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>Application History</h1>
                    <p style={{ color: '#666', marginTop: '6px', fontSize: '0.85rem' }}>Track your job search progress</p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    ← Back to List
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxWidth: '860px', marginBottom: '32px' }}>
                {[
                    { label: '总投递', value: stats.total, color: '#f0f0f0' },
                    { label: '面试中', value: stats.interview, color: '#eab308' },
                    { label: 'Offer', value: stats.offer, color: '#22c55e' },
                    { label: '已拒绝', value: stats.rejected, color: '#ef4444' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '16px 20px' }}>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>{stat.label}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {applications.length === 0 ? (
                <div style={{ maxWidth: '860px', padding: '48px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#444', margin: 0 }}>No applications yet</p>
                    <button
                        onClick={() => router.push('/')}
                        style={{ marginTop: '16px', padding: '10px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        Go to Job Listings
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '860px' }}>
                    {applications.map(app => {
                        const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.applied
                        return (
                            <div key={app.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{app.job.title}</h3>
                                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.8rem' }}>{app.job.company_name} · {app.job.location}</p>
                                    <p style={{ margin: '4px 0 0', color: '#444', fontSize: '0.75rem' }}>{new Date(app.applied_at).toLocaleDateString('zh-CN')}</p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <span style={{ padding: '4px 12px', background: statusInfo.bg, color: statusInfo.color, borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {statusInfo.label}
                  </span>

                                    <select
                                        value={app.status}
                                        onChange={e => handleStatusChange(app.id, e.target.value)}
                                        disabled={updatingId === app.id}
                                        style={{ padding: '6px 10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#888', fontSize: '0.8rem', cursor: 'pointer' }}
                                    >
                                        <option value="applied">Applied</option>
                                        <option value="interview">Interviewing</option>
                                        <option value="offer">Offer</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="ghosted">Ghosted</option>
                                    </select>


                                    <a
                                        href={app.job.apply_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            padding: '6px 12px',
                                            background: 'transparent',
                                            border: '1px solid #333',
                                            borderRadius: '6px',
                                            color: '#888',
                                            fontSize: '0.8rem',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Job Link →
                                    </a>
                            </div>
                    </div>
                    )
                    })}
                </div>
            )}
        </div>
    )
}