'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = 'http://localhost:8000'

interface Job {
    id: string
    title: string
    company_name: string
    location: string
    posted_at: string
    schedule_type: string
    salary: string | null
    apply_link: string
    match_score: number | null
    match_reason: string | null
    is_viewed: boolean
}

interface Resume {
    id: string
    file_name: string
    parsed_data: {
        skills: string[]
        experience_years: number
        education: string
        job_titles: string[]
        languages: string[]
        summary: string
    }
}

export default function JobsPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [analyzing, setAnalyzing] = useState(false)
    const [activeTab, setActiveTab] = useState<'all' | 'analyzed'>('all')
    const analyzedJobs = jobs.filter(job => job.match_score !== null)
    const pendingJobs = jobs.filter(job => job.match_score === null)
    const displayedJobs = activeTab === 'analyzed' ? analyzedJobs : pendingJobs

    // 简历状态
    const [resume, setResume] = useState<Resume | null>(null)
    const [resumeUploading, setResumeUploading] = useState(false)

    // 筛选条件
    const [keywords, setKeywords] = useState('')
    const [locations, setLocations] = useState('Vancouver, British Columbia, Canada')
    const [scheduleType, setScheduleType] = useState('Full-time')
    const [fetching, setFetching] = useState(false)
    const [fetchResult, setFetchResult] = useState<{saved: number} | null>(null)

    useEffect(() => {
        fetchResume()
        fetchJobs()
    }, [])

    const fetchResume = async () => {
        try {
            const res = await fetch(`${API_BASE}/resume/`)
            if (res.ok) {
                const data = await res.json()
                setResume(data)
            } else {
                router.push('/setup')
            }
        } catch (e) {
            router.push('/setup')
        }
    }

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${API_BASE}/jobs/`)
            const data = await res.json()
            setJobs(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const handleAnalyze = async () => {
        if (selected.size === 0) return
        setAnalyzing(true)
        try {
            await fetch(`${API_BASE}/jobs/match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_ids: Array.from(selected) }),
            })
            await fetchJobs()
            setSelected(new Set())
        } catch (e) {
            console.error(e)
        } finally {
            setAnalyzing(false)
        }
    }

    const handleResumeUpload = async (file: File) => {
        setResumeUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch(`${API_BASE}/resume/upload`, {
                method: 'POST',
                body: formData,
            })
            if (res.ok) await fetchResume()
        } catch (e) {
            console.error(e)
        } finally {
            setResumeUploading(false)
        }
    }

    const handleFetchJobs = async () => {
        if (!keywords.trim()) return
        setFetching(true)
        setFetchResult(null)
        try {
            await fetch(`${API_BASE}/filters/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
                    locations: locations.split(',').map(l => l.trim()).filter(Boolean),
                    schedule_type: scheduleType || null,
                    date_range: 7,
                }),
            })
            const fetchRes = await fetch(`${API_BASE}/jobs/fetch`, { method: 'POST' })
            const data = await fetchRes.json()
            setFetchResult(data)
            await fetchJobs()
        } catch (e) {
            console.error(e)
        } finally {
            setFetching(false)
        }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#666', fontFamily: "'DM Mono', monospace" }}>加载中...</p>
        </div>
    )

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f0f0f',
            color: '#f0f0f0',
            fontFamily: "'DM Mono', monospace",
            display: 'flex'
        }}>
        {/* 左栏：职位列表 */}
            <div style={{ flex: 1, padding: '40px 32px', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>Job Listings</h1>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                            onClick={() => setActiveTab('all')}
                            style={{
                                padding: '6px 14px',
                                background: activeTab === 'all' ? '#fff' : 'transparent',
                                color: activeTab === 'all' ? '#000' : '#666',
                                border: '1px solid #333', borderRadius: '20px',
                                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            }}
                        >
                            Pending Analysis ({pendingJobs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('analyzed')}
                            style={{
                                padding: '6px 14px',
                                background: activeTab === 'analyzed' ? '#fff' : 'transparent',
                                color: activeTab === 'analyzed' ? '#000' : '#666',
                                border: '1px solid #333', borderRadius: '20px',
                                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            }}
                        >
                            Analyzed ({analyzedJobs.length})
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => router.push('/applications')}
                        style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#888', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        Application History
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={selected.size === 0 || analyzing}
                        style={{
                            padding: '8px 16px',
                            background: selected.size > 0 ? '#fff' : '#222',
                            border: 'none', borderRadius: '8px',
                            color: selected.size > 0 ? '#000' : '#555',
                            cursor: selected.size > 0 ? 'pointer' : 'default',
                            fontWeight: 600, fontSize: '0.8rem',
                            opacity: analyzing ? 0.6 : 1,
                        }}
                    >
                        {analyzing ? 'Analyzing...' : `Analyze Match${selected.size > 0 ? ` (${selected.size})` : ''}`}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayedJobs.map(job => (
                    <div
                        key={job.id}
                        style={{
                            background: selected.has(job.id) ? '#1e2a1e' : '#1a1a1a',
                            border: `1px solid ${selected.has(job.id) ? '#22c55e' : '#2a2a2a'}`,
                            borderRadius: '12px', padding: '18px 20px',
                            display: 'flex', gap: '14px', alignItems: 'flex-start',
                            cursor: 'pointer',
                        }}
                        onClick={() => toggleSelect(job.id)}
                    >
                        {/* 勾选框 */}
                        <div style={{
                            width: '18px', height: '18px', flexShrink: 0,
                            border: `2px solid ${selected.has(job.id) ? '#22c55e' : '#444'}`,
                            borderRadius: '4px', marginTop: '2px',
                            background: selected.has(job.id) ? '#22c55e' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {selected.has(job.id) && <span style={{ color: '#000', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{job.title}</h3>
                                    <p style={{ margin: '3px 0 0', color: '#888', fontSize: '0.8rem' }}>{job.company_name} · {job.location}</p>
                                </div>
                                {job.match_score !== null && (
                                    <span style={{
                                        padding: '3px 10px',
                                        background: job.match_score >= 80 ? '#14532d' : job.match_score >= 60 ? '#713f12' : '#3f1515',
                                        color: job.match_score >= 80 ? '#22c55e' : job.match_score >= 60 ? '#eab308' : '#ef4444',
                                        borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                                    }}>
                      {job.match_score}分
                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                {job.schedule_type && (
                                    <span style={{ padding: '2px 7px', background: '#222', borderRadius: '4px', fontSize: '0.72rem', color: '#888' }}>{job.schedule_type}</span>
                                )}
                                {job.salary && (
                                    <span style={{ padding: '2px 7px', background: '#222', borderRadius: '4px', fontSize: '0.72rem', color: '#22c55e' }}>{job.salary}</span>
                                )}
                                {job.posted_at && (
                                    <span style={{ padding: '2px 7px', background: '#222', borderRadius: '4px', fontSize: '0.72rem', color: '#666' }}>{job.posted_at}</span>
                                )}
                            </div>

                            {job.match_reason && (
                                <p style={{ margin: '8px 0 0', color: '#888', fontSize: '0.78rem', lineHeight: '1.5' }}>{job.match_reason}</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button
                                onClick={e => { e.stopPropagation(); router.push(`/jobs/${job.id}`) }}
                                style={{ padding: '7px 12px', background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#888', cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                View →
                            </button>
                            <button
                                onClick={async e => {
                                    e.stopPropagation()
                                    await fetch(`${API_BASE}/jobs/${job.id}`, { method: 'DELETE' })
                                    await fetchJobs()
                                }}
                                style={{ padding: '7px 10px', background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    {/* 右栏：简历 + 筛选 */}
    <div style={{
        width: '320px', flexShrink: 0,
        borderLeft: '1px solid #1f1f1f',
        padding: '40px 24px',
        overflowY: 'auto',
        background: '#111',
    }}>

        {/* 简历状态 */}
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>我的简历</h3>

            {resume && (
                <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#22c55e' }}>✓ {resume.file_name}</p>

                    {resume.parsed_data.skills.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#555' }}>Skills</p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#888', lineHeight: '1.5' }}>
                                {resume.parsed_data.skills.slice(0, 8).join(', ')}{resume.parsed_data.skills.length > 8 ? '...' : ''}
                            </p>
                        </div>
                    )}

                    {resume.parsed_data.education && (
                        <div style={{ marginBottom: '8px' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#555' }}>Education</p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#888' }}>{resume.parsed_data.education}</p>
                        </div>
                    )}

                    {resume.parsed_data.summary && (
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#555' }}>Summary</p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#888', lineHeight: '1.5' }}>{resume.parsed_data.summary}</p>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={resumeUploading}
                style={{
                    width: '100%', padding: '9px',
                    background: 'transparent', border: '1px solid #333',
                    borderRadius: '8px', color: '#888',
                    cursor: 'pointer', fontSize: '0.8rem',
                    opacity: resumeUploading ? 0.6 : 1,
                }}
            >
                {resumeUploading ? 'Parsing...' : 'Re-upload Resume'}
            </button>
        </div>

        {/* 分割线 */}
        <div style={{ borderTop: '1px solid #1f1f1f', marginBottom: '28px' }} />

        {/* 筛选条件 */}
        <div>
            <h3 style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>筛选条件</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '5px' }}>关键词（逗号分隔）</label>
                    <input
                        type="text"
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        placeholder="junior software engineer"
                        style={{ width: '100%', padding: '9px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f0f0f0', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '5px' }}>城市</label>
                    <input
                        type="text"
                        value={locations}
                        onChange={e => setLocations(e.target.value)}
                        placeholder="Vancouver, British Columbia, Canada"
                        style={{ width: '100%', padding: '9px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f0f0f0', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '5px' }}>工作类型</label>
                    <select
                        value={scheduleType}
                        onChange={e => setScheduleType(e.target.value)}
                        style={{ width: '100%', padding: '9px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#f0f0f0', fontSize: '0.82rem' }}
                    >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="">All</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleFetchJobs}
                disabled={fetching || !keywords.trim()}
                style={{
                    width: '100%', marginTop: '14px', padding: '10px',
                    background: '#fff', color: '#000',
                    border: 'none', borderRadius: '8px',
                    fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                    opacity: fetching || !keywords.trim() ? 0.4 : 1,
                }}
            >
                {fetching ? 'Fetching...' : 'Fetch Jobs'}
            </button>

            {fetchResult && (
                <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#22c55e', textAlign: 'center' }}>
                    ✓ {fetchResult.saved} new job(s) added
                </p>
            )}
        </div>
    </div>
</div>
)
}