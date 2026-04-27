'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BookmarkCard from '@/components/BookmarkCard'
import AddBookmarkModal from '@/components/AddBookmarkModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Wrapper Component
function SortableBookmarkCard(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.bookmark.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BookmarkCard {...props} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const viewMode = 'grid'
  const [toast, setToast] = useState(null)
  const [extensionUrl, setExtensionUrl] = useState('')
  const searchRef = useRef(null)
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

  // Catch Chrome Extension URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const addUrl = params.get('addUrl')
      if (addUrl) {
        setExtensionUrl(addUrl)
        setShowModal(true)
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!data?.session) {
          router.push('/')
          return
        }
        setUser(data.session.user)
        await fetchBookmarks(data.session.user.id)
      } catch (err) {
        console.warn('Session error (silenced):', err.message)
        await supabase.auth.signOut().catch(() => {})
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Background Link Checker
  useEffect(() => {
    if (bookmarks.length === 0) return
    if (window.hasRunLinkChecker) return
    window.hasRunLinkChecker = true

    const runLinkChecker = async () => {
      try {
        const ONE_DAY = 24 * 60 * 60 * 1000
        const now = new Date()
        
        const needsChecking = bookmarks
          .filter(b => !b.last_checked_at || (now - new Date(b.last_checked_at)) > ONE_DAY)
          .slice(0, 4)

        if (needsChecking.length === 0) return

        const urls = needsChecking.map(b => b.url)
        const res = await fetch('/api/ping-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls })
        })

        if (res.ok) {
          const { results } = await res.json()
          let dbErrorDetected = false
          
          for (const result of results) {
            if (dbErrorDetected) break 

            const targetBookmark = needsChecking.find(b => b.url === result.url)
            if (!targetBookmark) continue

            const updatePayload = {
              is_broken: result.is_broken,
              last_checked_at: new Date().toISOString()
            }

            const { error: dbError } = await supabase
              .from('bookmarks')
              .update(updatePayload)
              .eq('id', targetBookmark.id)

            if (!dbError) {
               setBookmarks(prev => prev.map(b => 
                 b.id === targetBookmark.id ? { ...b, ...updatePayload } : b
               ))
            } else {
               dbErrorDetected = true
            }
          }
        }
      } catch (err) {
        console.warn("Link checker failed silently", err)
      }
    }

    setTimeout(runLinkChecker, 3000)
  }, [bookmarks, supabase])

  const handleAdded = (newBookmark) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.id === newBookmark.id)
      if (exists) return prev
      return [newBookmark, ...prev]
    })
    showToast('Bookmark added! ✨')
  }

  const handleUpdate = (updatedBookmark) => {
    setBookmarks(prev => prev.map(b => b.id === updatedBookmark.id ? updatedBookmark : b))
    showToast('Bookmark updated! ✨')
  }

  const handleDelete = async (bookmarkId) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    showToast('Bookmark deleted', 'info')
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

  const handleTogglePin = async (bookmarkId, isPinned) => {
    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, is_pinned: isPinned } : b))
    const { error } = await supabase.from('bookmarks').update({ is_pinned: isPinned }).eq('id', bookmarkId)
    if (error) {
      showToast('Failed to pin bookmark.', 'error')
      fetchBookmarks(user.id)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  // Drag and Drop Logic
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setBookmarks((items) => {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      const newArray = arrayMove(items, oldIndex, newIndex)
      
      const updates = newArray.map((item, index) => ({
        ...item,
        sort_order: newArray.length - index
      }))
      
      supabase.from('bookmarks').upsert(updates).then(({error}) => {
        if (error) showToast('Failed to save arrangement.', 'error')
      })
      
      return newArray
    })
  }

  const allTags = [...new Set(bookmarks.flatMap(b => b.tags || []))]

  const filteredBookmarks = bookmarks.filter(b => {
    const search = searchQuery.toLowerCase()
    const titleMatch = b.title ? b.title.toLowerCase().includes(search) : false
    const urlMatch = b.url ? b.url.toLowerCase().includes(search) : false
    const matchesSearch = !search || titleMatch || urlMatch
    const matchesTag = !activeTag || (b.tags || []).includes(activeTag)
    return matchesSearch && matchesTag
  }).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    if (a.sort_order !== b.sort_order) return (b.sort_order || 0) - (a.sort_order || 0)
    return new Date(b.created_at) - new Date(a.created_at)
  })

  // Compact Stats Calculation
  const thisWeekCount = bookmarks.filter(b => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return new Date(b.created_at) > oneWeekAgo
  }).length

  if (loading) return <LoadingSpinner />

  const avatarUrl = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand & User Profile */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <span className="text-gray-900 dark:text-white font-bold tracking-tight">Smart Bookmark</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-yellow-500/50 shadow-sm">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full ring-2 ring-orange-500/50" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{name}</p>
            <p className="text-gray-500 dark:text-orange-400/80 text-xs truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign Out"
            className="p-2 text-gray-400 hover:text-red-500 dark:text-orange-300 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors btn-press"
          >
             {loggingOut ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" style={{ animation: 'spin 1s linear infinite' }}></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
          </button>
        </div>
      </div>

      {/* Primary Action */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { setShowModal(true); setShowMobileMenu(false); }}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold px-4 py-3.5 rounded-2xl shadow-lg glow mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Bookmark
      </motion.button>



      {/* Tags */}
      {allTags.length > 0 && (
        <div className="mb-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-orange-500/80 uppercase tracking-wider mb-3">Filter by Tag</h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all btn-press ${
                !activeTag ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <span>All Bookmarks</span>
              <span className="text-xs opacity-60 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md">{bookmarks.length}</span>
            </button>
            {allTags.map(tag => {
              const count = bookmarks.filter(b => (b.tags || []).includes(tag)).length
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all btn-press ${
                    activeTag === tag ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="truncate pr-2">#{tag}</span>
                  <span className="text-xs opacity-60 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}


    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-black text-gray-900 dark:text-white relative">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200 dark:bg-orange-600 rounded-full opacity-30 dark:opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-200 dark:bg-red-600 rounded-full opacity-30 dark:opacity-10 blur-3xl"></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-72 hidden lg:block border-r border-gray-200 dark:border-white/10 glass p-6 z-20 relative flex-shrink-0">
        {SidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[80vw] bg-white dark:bg-black border-r border-gray-200 dark:border-white/10 p-6 z-50 lg:hidden flex flex-col"
            >
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-white/10 rounded-full btn-press"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              {SidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 glass">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileMenu(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 btn-press">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold">Smart Bookmark</span>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-orange-600 text-white p-2 rounded-xl shadow-lg glow btn-press"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 pt-2 pb-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-24">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-20 fade-in">
              <div className="flex-1 w-full max-w-xl">
                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
                  {activeTag ? `#${activeTag}` : 'All Bookmarks'}
                </h1>
                
                {/* Search Box */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your collection..."
                    className="w-full bg-white dark:bg-black/40 border border-yellow-500/50 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-orange-400/50 rounded-2xl pl-12 pr-10 py-3.5 outline-none text-base shadow-sm transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-4 z-10 top-1/2 -translate-y-1/2 text-gray-400 dark:text-orange-400 hover:text-gray-900 dark:hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Boxes beside heading */}
              <div className="flex items-center gap-4">
                <div className="bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-3xl px-6 py-4 flex items-center gap-4 shadow-md animated-border-yellow">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-orange-500/80 text-xs uppercase font-bold tracking-widest mb-1">Total Bookmarks</p>
                    <p className="text-gray-900 dark:text-white text-4xl font-black leading-none">{bookmarks.length}</p>
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-3xl px-6 py-4 flex items-center gap-4 shadow-md animated-border-yellow">
                  <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-orange-500/80 text-xs uppercase font-bold tracking-widest mb-1">Tags Used</p>
                    <p className="text-gray-900 dark:text-white text-4xl font-black leading-none">{allTags.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {bookmarks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 fade-in">
                <div className="w-24 h-24 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-2">Your canvas is empty</h3>
                <p className="text-gray-500 dark:text-orange-400/80 text-center max-w-sm mb-6">
                  Start building your collection by adding your first bookmark.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-medium px-6 py-2.5 rounded-xl transition-colors btn-press shadow-sm"
                >
                  Add Bookmark
                </button>
              </div>
            )}

            {/* No Results Filter */}
            {bookmarks.length > 0 && filteredBookmarks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 fade-in border border-dashed border-gray-300 dark:border-white/10 rounded-3xl">
                <div className="text-4xl mb-4 opacity-50">🔍</div>
                <h3 className="text-gray-900 dark:text-white font-bold mb-1">No matches found</h3>
                <p className="text-gray-500 dark:text-orange-400/80 text-sm">
                  Try adjusting your search or tag filters.
                </p>
                <button onClick={() => { setSearchQuery(''); setActiveTag(null) }} className="mt-4 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-white font-medium text-sm underline underline-offset-4 btn-press">
                  Clear all filters
                </button>
              </div>
            )}

            {/* Bookmarks Grid Display */}
            {filteredBookmarks.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  <SortableContext items={filteredBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
                    {filteredBookmarks.map((bookmark) => (
                      <SortableBookmarkCard 
                        key={bookmark.id} 
                        bookmark={bookmark} 
                        onDelete={handleDelete} 
                        onTogglePin={handleTogglePin}
                        onEdit={(b) => {
                          setEditingBookmark(b)
                          setShowModal(true)
                        }}
                        viewMode={viewMode} 
                      />
                    ))}
                  </SortableContext>
                </motion.div>
              </DndContext>
            )}

          </div>
        </main>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <AddBookmarkModal
            userId={user.id}
            onClose={() => {
              setShowModal(false)
              setExtensionUrl('')
              setEditingBookmark(null)
            }}
            onAdded={handleAdded}
            onUpdated={handleUpdate}
            initialUrl={extensionUrl}
            bookmarkToEdit={editingBookmark}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl z-[100] text-white font-medium ${
              toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-orange-600' : 'bg-green-500'
            }`}
          >
            <span>{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}