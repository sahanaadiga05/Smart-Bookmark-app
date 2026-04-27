'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const TAG_COLORS = [
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'bg-red-500/20 text-red-300 border-red-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-green-500/20 text-green-300 border-green-500/30',
  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
]

const getTagColor = (tag) => {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export default function BookmarkCard({ bookmark, onDelete, onEdit, onTogglePin, viewMode = 'grid', dragListeners, dragAttributes }) {
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
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -5, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`bookmark-card glass rounded-2xl p-5 group relative transition-colors ${bookmark.is_broken ? 'border-red-500/20' : ''}`}
    >

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

      {/* Header Container */}
      <div className={`flex ${viewMode === 'list' ? 'flex-row items-center gap-4' : 'flex-col sm:flex-row items-start'} justify-between min-w-0`}>
        
        {/* Main Content Area */}
        <div className="flex items-start gap-3 flex-1 min-w-0 w-full mb-3">
          


          <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-transparent rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            {bookmark.favicon || faviconUrl ? (
              <img
                src={bookmark.favicon || faviconUrl}
                alt=""
                className="w-5 h-5"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-sm truncate ${bookmark.is_broken ? 'text-gray-400 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{bookmark.title}</h3>
              {bookmark.is_broken && (
                <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" title="This link appears to be broken or unreachable">
                  ⚠️ Dead
                </span>
              )}
            </div>
            {viewMode === 'grid' && (
              <p className={`text-xs truncate mt-0.5 ${bookmark.is_broken ? 'text-red-500/80 line-through' : 'text-gray-500 dark:text-orange-400'}`}>{domain}</p>
            )}
            
            {/* List Mode URL Display */}
            {viewMode === 'list' && (
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 mt-1 text-xs truncate max-w-sm ${bookmark.is_broken ? 'text-red-500/80 line-through' : 'text-orange-500 hover:text-orange-600 dark:text-orange-300 dark:hover:text-orange-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="truncate">{bookmark.url}</span>
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 ${viewMode === 'list' ? 'ml-auto mt-0' : 'absolute top-3 right-3'}`}>
          <button
            onClick={() => onEdit(bookmark)}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 btn-press transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 dark:text-orange-300"
            title="Edit Bookmark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onTogglePin(bookmark.id, !bookmark.is_pinned)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 btn-press transition-colors ${bookmark.is_pinned ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 opacity-100' : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 dark:text-orange-300'}`}
            title={bookmark.is_pinned ? "Unpin" : "Pin tracking"}
          >
            {bookmark.is_pinned ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={() => setShowConfirm(true)}
            className="w-8 h-8 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center shrink-0 btn-press transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid Mode URL */}
      {viewMode === 'grid' && (
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 dark:text-orange-300 dark:hover:text-orange-100 text-xs truncate mb-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="truncate">{bookmark.url}</span>
        </a>
      )}

      {/* Summary */}
      {bookmark.summary && (
        <p className="text-gray-600 dark:text-orange-200/70 text-xs mb-3 line-clamp-2 leading-relaxed">
          {bookmark.summary}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3 mt-auto">
        <span className="text-gray-400 dark:text-orange-500 text-xs flex items-center gap-1 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(bookmark.created_at)}
        </span>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-orange-50 hover:bg-orange-100 dark:bg-orange-600/40 dark:hover:bg-orange-600/70 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-lg btn-press font-semibold transition-colors"
        >
          Visit
        </a>
      </div>
    </motion.div>
  )
}