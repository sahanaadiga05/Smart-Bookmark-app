'use client'

import { useState } from 'react'

const TAG_COLORS = [
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-green-500/20 text-green-300 border-green-500/30',
  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
]

const getTagColor = (tag) => {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export default function BookmarkCard({ bookmark, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    onDelete(bookmark.id)
  }

  const getDomain = (url) => {
    try { return new URL(url).hostname } catch { return '' }
  }

  const domain = getDomain(bookmark.url)
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const tags = bookmark.tags || []

  if (deleting) return null

  return (
    <div className="bookmark-card glass rounded-2xl p-5 fade-in stagger-child group relative">

      {/* Delete confirm overlay */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 z-10">
          <p className="text-white text-sm font-medium">Delete this bookmark?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium btn-press"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-xl text-sm font-medium btn-press"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-5 h-5"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{bookmark.title}</h3>
            <p className="text-indigo-400 text-xs truncate">{domain}</p>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => setShowConfirm(true)}
          className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl flex items-center justify-center shrink-0 btn-press"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* URL */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-indigo-300 hover:text-indigo-100 text-xs truncate mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        <span className="truncate">{bookmark.url}</span>
      </a>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getTagColor(tag)}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-indigo-500 text-xs flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(bookmark.created_at)}
        </span>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-indigo-600/40 hover:bg-indigo-600/70 text-indigo-300 px-3 py-1 rounded-lg btn-press"
        >
          Visit
        </a>
      </div>
    </div>
  )
}