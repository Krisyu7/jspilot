'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = 'http://localhost:8000'

export default function SetupPage() {
    const router = useRouter()

    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [resumeUploading, setResumeUploading] = useState(false)
    const [resumeDone, setResumeDone] = useState(false)
    const [resumeError, setResumeError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleResumeUpload = async () => {
        if (!resumeFile) return
        setResumeUploading(true)
        setResumeError('')

        const formData = new FormData()
        formData.append('file', resumeFile)

        try {
            const res = await fetch(`${API_BASE}/resume/upload`, {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error('Upload failed')
            setResumeDone(true)
            setTimeout(() => router.push('/'), 1000)
        } catch (e) {
            setResumeError('Upload failed, please try again')
        } finally {
            setResumeUploading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f0f0f',
            color: '#f0f0f0',
            fontFamily: "'DM Mono', monospace",
            padding: '48px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>
                    JSPilot
                </h1>
                <p style={{ color: '#666', marginTop: '8px', fontSize: '0.95rem' }}>
                    Upload your most complete resume to get started
                </p>
            </div>

            <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                padding: '40px',
                width: '100%',
                maxWidth: '480px',
            }}>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${resumeFile ? '#22c55e' : '#333'}`,
                        borderRadius: '8px',
                        padding: '48px 32px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginBottom: '20px',
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={e => setResumeFile(e.target.files?.[0] || null)}
                    />
                    {resumeFile ? (
                        <p style={{ color: '#22c55e', margin: 0 }}>📄 {resumeFile.name}</p>
                    ) : (
                        <>
                            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>Click to upload your PDF resume</p>
                            <p style={{ color: '#444', margin: '6px 0 0', fontSize: '0.8rem' }}>PDF format only</p>
                        </>
                    )}
                </div>

                {resumeError && (
                    <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>{resumeError}</p>
                )}

                <button
                    onClick={handleResumeUpload}
                    disabled={!resumeFile || resumeUploading || resumeDone}
                    style={{
                        width: '100%', padding: '14px',
                        background: resumeDone ? '#14532d' : '#fff',
                        color: resumeDone ? '#22c55e' : '#000',
                        border: 'none', borderRadius: '8px',
                        fontWeight: 600, cursor: resumeDone ? 'default' : 'pointer',
                        opacity: (!resumeFile || resumeUploading) && !resumeDone ? 0.4 : 1,
                        fontSize: '0.95rem',
                    }}
                >
                    {resumeUploading ? 'Parsing...' : resumeDone ? '✓Redirecting...' : 'Upload & Parse'}
                </button>
            </div>
        </div>
    )
}