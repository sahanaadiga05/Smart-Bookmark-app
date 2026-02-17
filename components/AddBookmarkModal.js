'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const PRESET_TAGS = ['Work', 'Personal', 'Design', 'Dev', 'News', 'Learning', 'Tools', 'Fun']

export default function AddBookmarkModal({ userId, onClose, onAdded }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const isValidUrl = (string) => {
    try {
      const u = new URL(string.startsWith('http') ? string : `https://${string}`)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch { return false }
  }

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const t = customTag.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setCustomTag('')
  }

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`
    if (!isValidUrl(cleanUrl)) { setError('Please enter a valid URL'); return }
    if (!title.trim()) { setError('Please enter a title'); return }

    setLoading(true)

    const { data, error: insertError } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, url: cleanUrl, title: title.trim(), tags })
      .select()
      .single()

    if (insertError) {
      setError('Failed to add bookmark. Please try again.')
      setLoading(false)
    } else {
      onAdded(data) // ← pass new bookmark back instantly
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl modal-animate">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold">Add Bookmark</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-indigo-300 hover:text-white btn-press">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-indigo-300 text-sm font-medium mb-2">URL *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
                className="w-full bg-white/10 border border-white/20 focus:border-indigo-500 text-white placeholder-indigo-400/60 rounded-xl pl-10 pr-4 py-3 outline-none text-sm"
                required autoFocus />
            </div>
          </div>

          <div>
            <label className="block text-indigo-300 text-sm font-medium mb-2">Title *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                </svg>
              </div>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My awesome bookmark"
                className="w-full bg-white/10 border border-white/20 focus:border-indigo-500 text-white placeholder-indigo-400/60 rounded-xl pl-10 pr-4 py-3 outline-none text-sm"
                required />
            </div>
          </div>

          <div>
            <label className="block text-indigo-300 text-sm font-medium mb-2">
              Tags <span className="text-indigo-500 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium btn-press transition-all ${
                    tags.includes(tag) ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/10 text-indigo-300 hover:bg-white/20'
                  }`}>
                  {tags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-indigo-600/40 text-indigo-200 px-2.5 py-1 rounded-lg text-xs">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 ml-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                placeholder="Custom tag..."
                className="flex-1 bg-white/10 border border-white/20 focus:border-indigo-500 text-white placeholder-indigo-400/60 rounded-xl px-3 py-2 outline-none text-xs" />
              <button type="button" onClick={addCustomTag} className="bg-white/10 hover:bg-white/20 text-indigo-300 px-3 py-2 rounded-xl text-xs btn-press">Add</button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-300 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white/10 hover:bg-white/20 text-indigo-300 hover:text-white font-medium py-3 rounded-xl btn-press">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg btn-press disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" style={{animation:'spin 1s linear infinite'}}></div>Saving...</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>Save Bookmark</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}