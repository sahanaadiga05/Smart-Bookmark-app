'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

const PRESET_TAGS = ['Work', 'Personal', 'Design', 'Dev', 'News', 'Learning', 'Tools', 'Fun']

export default function AddBookmarkModal({ userId, onClose, onAdded, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const [metadataLoading, setMetadataLoading] = useState(false)
  const [metadataFetched, setMetadataFetched] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  useEffect(() => {
    const cleanUrl = url.startsWith('http') ? url : (url ? `https://${url}` : '')
    if (!isValidUrl(cleanUrl)) {
       setPreviewData(null)
       setMetadataFetched(false)
       setDuplicateWarning(null)
       return
    }

    setMetadataFetched(false)
    setMetadataLoading(true)
    setDuplicateWarning(null)

    const timeoutId = setTimeout(async () => {
      try {
        const metadataPromise = fetch(`/api/metadata?url=${encodeURIComponent(cleanUrl)}`).catch(e => null)
        const duplicatePromise = supabase.from('bookmarks').select('title').eq('user_id', userId).eq('url', cleanUrl).limit(1).maybeSingle()

        const [metaRes, dupRes] = await Promise.all([metadataPromise, duplicatePromise])

        if (dupRes && dupRes.data) {
          setDuplicateWarning(`You already saved this link as "${dupRes.data.title}"`)
        }

        if (metaRes && metaRes.ok) {
          const data = await metaRes.json()
          if (data.title) setTitle(data.title)
          if (data.description) setSummary(data.description)
          setPreviewData(data)
          setMetadataFetched(true)
        }
      } catch (err) {
        console.error("Fetch metadata or duplicate check error", err)
      } finally {
        setMetadataLoading(false)
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [url, userId])

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

    let finalSummary = summary.trim();
    let finalFavicon = previewData?.favicon || null;

    if (!finalSummary) {
      try {
        const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(cleanUrl)}`)
        if (metaRes.ok) {
          const data = await metaRes.json()
          if (data.description) finalSummary = data.description
          if (data.favicon) finalFavicon = data.favicon
        }
      } catch (e) {
        console.error('Fetch on submit failed', e)
      }
    }

    const { data, error: insertError } = await supabase
      .from('bookmarks')
      .insert({ 
        user_id: userId, 
        url: cleanUrl, 
        title: title.trim(), 
        summary: finalSummary,
        tags,
        favicon: finalFavicon
      })
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-gray-900 dark:text-white text-xl font-bold">Add Bookmark</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100/50 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl flex items-center justify-center text-gray-500 dark:text-orange-300 hover:text-gray-900 dark:hover:text-white btn-press transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {duplicateWarning && (
          <div className="mb-6 bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-4 py-3 flex gap-3 fade-in">
            <div className="text-yellow-400 mt-0.5">⚠️</div>
            <div>
              <p className="text-yellow-200 font-medium text-sm">Duplicate Found</p>
              <p className="text-yellow-300/80 text-xs mt-0.5">{duplicateWarning}. You can still save it again if needed.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-orange-300 text-sm font-medium mb-2">URL *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
                className="w-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-orange-400/60 rounded-xl pl-10 pr-4 py-3 outline-none text-sm transition-colors"
                required autoFocus />
            </div>
            
            {metadataLoading && (
              <div className="flex items-center gap-2 text-orange-400 text-xs mt-2 ml-1">
                <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full" style={{animation:'spin 1s linear infinite'}}></div>
                Fetching link details...
              </div>
            )}
            
            {previewData && metadataFetched && !metadataLoading && (
              <div className="mt-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner fade-in">
                 <div className="p-3 bg-black/20 flex flex-col gap-2 border-t border-white/5">
                   <div className="flex items-center gap-3">
                     {previewData.favicon ? (
                       <img src={previewData.favicon} className="w-5 h-5 rounded-sm flex-shrink-0 bg-white" alt="icon" />
                     ) : (
                       <div className="w-5 h-5 rounded bg-white/10 flex-shrink-0"></div>
                     )}
                     <span className="text-white text-xs font-medium truncate opacity-90">{previewData.title || title || 'No title provided'}</span>
                   </div>
                   {previewData.description && (
                     <p className="text-gray-400 text-[11px] line-clamp-2 leading-relaxed ml-8">
                       {previewData.description}
                     </p>
                   )}
                 </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 dark:text-orange-300 text-sm font-medium mb-2">Title *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                </svg>
              </div>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My awesome bookmark"
                className="w-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-orange-400/60 rounded-xl pl-10 pr-4 py-3 outline-none text-sm transition-colors"
                required />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-orange-300 text-sm font-medium mb-2">
              Tags <span className="text-gray-400 dark:text-orange-500 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 border rounded-lg text-xs font-medium btn-press transition-all ${
                    tags.includes(tag) ? 'bg-orange-600 dark:bg-orange-500 text-white dark:text-white border-transparent shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-white/10 text-gray-600 dark:text-orange-300 hover:bg-gray-50 dark:hover:bg-white/20 border-gray-200 dark:border-transparent'
                  }`}>
                  {tags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-orange-100 dark:bg-orange-600/40 text-orange-700 dark:text-orange-200 px-2.5 py-1 rounded-lg text-xs">
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
                className="flex-1 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-orange-400/60 rounded-xl px-3 py-2 outline-none text-xs transition-colors" />
              <button type="button" onClick={addCustomTag} className="bg-white dark:bg-white/10 border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-white/20 text-gray-600 dark:text-orange-300 px-3 py-2 rounded-xl text-xs btn-press">Add</button>
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
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-orange-300 hover:text-gray-900 dark:hover:text-white font-medium py-3 rounded-xl btn-press transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold py-3 rounded-xl shadow-lg btn-press disabled:opacity-50 flex items-center justify-center gap-2">
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
      </motion.div>
    </motion.div>
  )
}