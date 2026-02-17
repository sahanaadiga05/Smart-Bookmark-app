'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import BookmarkCard from '@/components/BookmarkCard'
import AddBookmarkModal from '@/components/AddBookmarkModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import StatsPanel from '@/components/StatsPanel'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [toast, setToast] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchBookmarks = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!error && data) setBookmarks(data)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      setUser(session.user)
      await fetchBookmarks(session.user.id)
      setLoading(false)
    }
    init()
  }, [])

  // Called by modal with the newly saved bookmark — adds instantly to UI
  const handleAdded = (newBookmark) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.id === newBookmark.id)
      if (exists) return prev
      return [newBookmark, ...prev]
    })
    showToast('Bookmark added! ✨')
  }

  const handleDelete = async (bookmarkId) => {
    // Remove instantly from UI
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    showToast('Bookmark deleted', 'info')
    // Delete from DB in background
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', user.id)
    if (error) {
      showToast('Failed to delete. Please try again.', 'error')
      fetchBookmarks(user.id)
    }
  }

  const allTags = [...new Set(bookmarks.flatMap(b => b.tags || []))]

  const filteredBookmarks = bookmarks.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !activeTag || (b.tags || []).includes(activeTag)
    return matchesSearch && matchesTag
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="gradient-bg min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <Navbar user={user} />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="fade-in">
              <h1 className="text-3xl font-bold text-white">My Bookmarks</h1>
              <p className="text-indigo-400 mt-1">
                {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
              </p>
            </div>

            <div className="flex items-center gap-3 fade-in">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`btn-press flex items-center gap-2 font-semibold px-4 py-3 rounded-2xl border transition-all ${
                  showStats
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/10 border-white/20 text-indigo-300 hover:bg-white/20'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:block">Stats</span>
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="btn-press flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg glow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Bookmark
              </button>
            </div>
          </div>

          {/* Stats Panel */}
          {showStats && bookmarks.length > 0 && (
            <StatsPanel bookmarks={bookmarks} />
          )}

          {/* Search + Tag filters */}
          {bookmarks.length > 0 && (
            <div className="mb-8 space-y-3 fade-in">
              <div className="relative max-w-sm">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookmarks..."
                  className="w-full bg-white/10 border border-white/20 focus:border-indigo-500 text-white placeholder-indigo-400/60 rounded-xl pl-12 pr-4 py-3 outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-press transition-all ${
                      !activeTag ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/10 text-indigo-300 hover:bg-white/20'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium btn-press transition-all ${
                        activeTag === tag ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/10 text-indigo-300 hover:bg-white/20'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {bookmarks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 fade-in">
              <div className="float w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">No bookmarks yet</h3>
              <p className="text-indigo-400 text-center mb-8 max-w-sm">
                Start saving your favorite websites! Click the button below to add your first bookmark.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-press flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg glow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Bookmark
              </button>
            </div>
          )}

          {/* No results */}
          {bookmarks.length > 0 && filteredBookmarks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 fade-in">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-white text-xl font-bold mb-2">No results found</h3>
              <p className="text-indigo-400 text-sm">
                {activeTag ? `No bookmarks tagged #${activeTag}` : `No bookmarks match "${searchQuery}"`}
              </p>
              <button onClick={() => { setSearchQuery(''); setActiveTag(null) }} className="mt-4 text-indigo-400 hover:text-white text-sm underline">
                Clear filters
              </button>
            </div>
          )}

          {/* Bookmarks Grid */}
          {filteredBookmarks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={handleDelete} />
              ))}
            </div>
          )}

        </main>
      </div>

      {showModal && (
        <AddBookmarkModal
          userId={user.id}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl z-50 text-white font-medium modal-animate ${
          toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-indigo-600' : 'bg-green-500'
        }`}>
          <span>{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
          {toast.message}
        </div>
      )}
    </div>
  )
}