'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const API_BASE = 'http://localhost:8000'

interface Job {
    id: string
    title: string
    company_name: string
    location: string
    posted_at: string
    schedule_type: string
    salary: string | null
    description: string
    apply_link: string
    apply_type: string
    match_score: number | null
    match_reason: string | null
    summary: string | null
}

export default function JobDetailPage() {
    const router = useRouter()
    const params = useParams()
    const jobId = params.id as string

    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)

    // Cover Letter
    const [coverLetter, setCoverLetter] = useState('')
    const [generatingCL, setGeneratingCL] = useState(false)
    const [clError, setClError] = useState('')

    // 优化简历
    const [generatingResume, setGeneratingResume] = useState(false)
    const [resumeError, setResumeError] = useState('')
    const [resumeDone, setResumeDone] = useState(false)

    // 投递记录
    const [applied, setApplied] = useState(false)
    const [applying, setApplying] = useState(false)

    useEffect(() => {
        fetchJob()
    }, [jobId])

    const fetchJob = async () => {
        try {
            const res = await fetch(`${API_BASE}/jobs/${jobId}`)
            const data = await res.json()
            setJob(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateCoverLetter = async () => {
        setGeneratingCL(true)
        setClError('')
        try {
            const res = await fetch(`${API_BASE}/cover-letters/${jobId}`, { method: 'POST' })
            if (!res.ok) throw new Error('Generation failed')
            const data = await res.json()
            setCoverLetter(data.content)
        } catch (e) {
            setClError('Generation failed, please try again')
        } finally {
            setGeneratingCL(false)
        }
    }

    const handleGenerateResume = async () => {
        setGeneratingResume(true)
        setResumeError('')
        try {
            const res = await fetch(`${API_BASE}/optimized-resumes/${jobId}`, { method: 'POST' })
            if (!res.ok) throw new Error('Generation failed')
            setResumeDone(true)
        } catch (e) {
            setResumeError('Generation failed, please try again')
        } finally {
            setGeneratingResume(false)
        }
    }

    const handleDownloadResume = async () => {
        const res = await fetch(`${API_BASE}/optimized-resumes/${jobId}/download`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resume_${jobId.slice(0, 8)}.tex`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleApply = async () => {
        setApplying(true)
        try {
            await fetch(`${API_BASE}/applications/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id: jobId }),
            })
            setApplied(true)
            // 打开投递链接
            window.open(job?.apply_link, '_blank')
        } catch (e) {
            console.error(e)
        } finally {
            setApplying(false)
        }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#666' }}>Loading...</p>
        </div>
    )

    if (!job) return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#666' }}>Job Not Found</p>
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: "'DM Mono', monospace", padding: '48px 32px' }}>

            {/* 返回 */}
            <button
                onClick={() => router.push('/')}
                style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '24px', padding: 0 }}
            >
                ← Back to List
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1100px' }}>

                {/* 左：职位信息 */}
                <div>
                    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '28px', marginBottom: '16px' }}>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{job.title}</h1>
                        <p style={{ color: '#888', margin: '0 0 16px', fontSize: '0.9rem' }}>{job.company_name} · {job.location}</p>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                            {job.schedule_type && (
                                <span style={{ padding: '3px 10px', background: '#222', borderRadius: '4px', fontSize: '0.8rem', color: '#888' }}>
                  {job.schedule_type}
                </span>
                            )}
                            {job.salary && (
                                <span style={{ padding: '3px 10px', background: '#222', borderRadius: '4px', fontSize: '0.8rem', color: '#22c55e' }}>
                  {job.salary}
                </span>
                            )}
                            {job.posted_at && (
                                <span style={{ padding: '3px 10px', background: '#222', borderRadius: '4px', fontSize: '0.8rem', color: '#666' }}>
                  {job.posted_at}
                </span>
                            )}
                        </div>

                        {/* 匹配分数 */}
                        {job.match_score !== null && (
                            <div style={{ background: '#111', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Match Score</span>
                                    <span style={{
                                        fontWeight: 700, fontSize: '1.2rem',
                                        color: job.match_score >= 80 ? '#22c55e' : job.match_score >= 60 ? '#eab308' : '#ef4444'
                                    }}>
                    {job.match_score}分
                  </span>
                                </div>
                                {job.match_reason && (
                                    <p style={{ margin: 0, color: '#888', fontSize: '0.8rem', lineHeight: '1.6' }}>{job.match_reason}</p>
                                )}
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={handleGenerateCoverLetter}
                                disabled={generatingCL}
                                style={{
                                    padding: '11px', background: '#fff', color: '#000',
                                    border: 'none', borderRadius: '8px', fontWeight: 600,
                                    cursor: 'pointer', fontSize: '0.9rem', opacity: generatingCL ? 0.6 : 1,
                                }}
                            >
                                {generatingCL ? 'Generating...' : 'Generate Cover Letter'}
                            </button>

                            <button
                                onClick={resumeDone ? handleDownloadResume : handleGenerateResume}
                                disabled={generatingResume}
                                style={{
                                    padding: '11px', background: resumeDone ? '#14532d' : 'transparent',
                                    color: resumeDone ? '#22c55e' : '#888',
                                    border: `1px solid ${resumeDone ? '#22c55e' : '#333'}`,
                                    borderRadius: '8px', fontWeight: 600,
                                    cursor: 'pointer', fontSize: '0.9rem', opacity: generatingResume ? 0.6 : 1,
                                }}
                            >
                                {generatingResume ? 'Generating...' : resumeDone ? 'Download Optimized Resume (.tex)' : 'Generate Optimized Resume'}
                            </button>

                            {resumeError && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{resumeError}</p>}

                            <button
                                onClick={handleApply}
                                disabled={applying}
                                style={{
                                    padding: '11px',
                                    background: applied ? '#1a3a1a' : '#22c55e',
                                    color: applied ? '#22c55e' : '#000',
                                    border: applied ? '1px solid #22c55e' : 'none',
                                    borderRadius: '8px', fontWeight: 700,
                                    cursor: 'pointer', fontSize: '0.9rem',
                                }}
                            >
                                {applying ? 'Redirecting...' : applied ? '↗ Redirected — Apply Again' : 'Apply Now ↗'}
                            </button>
                        </div>
                    </div>

                    {/* 职位描述 */}
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px', color: '#fff' }}>Job Description</h2>
                    <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {job.summary || job.description}
                    </p>
                    </div>


                {/* 右：Cover Letter */}
                <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '28px' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px', color: '#fff' }}>Cover Letter</h2>

                    {clError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{clError}</p>}

                    {coverLetter ? (
                        <>
              <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  style={{
                      width: '100%', height: '500px',
                      background: '#111', border: '1px solid #333',
                      borderRadius: '8px', color: '#f0f0f0',
                      fontSize: '0.85rem', lineHeight: '1.8',
                      padding: '16px', boxSizing: 'border-box',
                      resize: 'vertical', fontFamily: 'inherit',
                  }}
              />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                <button
                                    onClick={() => navigator.clipboard.writeText(coverLetter)}
                                    style={{
                                        flex: 1, padding: '10px', background: '#fff', color: '#000',
                                        border: 'none', borderRadius: '8px', fontWeight: 600,
                                        cursor: 'pointer', fontSize: '0.85rem',
                                    }}
                                >
                                    Copy Cover Letter
                                </button>
                                <button
                                    onClick={handleGenerateCoverLetter}
                                    disabled={generatingCL}
                                    style={{
                                        flex: 1, padding: '10px', background: 'transparent', color: '#888',
                                        border: '1px solid #333', borderRadius: '8px', fontWeight: 600,
                                        cursor: 'pointer', fontSize: '0.85rem',
                                    }}
                                >
                                    Regenerate
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            height: '400px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#444', fontSize: '0.85rem',
                            border: '1px dashed #2a2a2a', borderRadius: '8px',
                        }}>
                            Click "Generate Cover Letter" on the left
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}