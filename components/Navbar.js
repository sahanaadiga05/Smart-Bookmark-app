'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar({ user }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="text-gray-900 dark:text-white font-bold text-lg hidden sm:block">Smart Bookmark</span>
          </div>

          {/* Realtime indicator */}
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 bg-green-400 rounded-full block"></span>
              <span className="absolute w-2 h-2 bg-green-400 rounded-full opacity-75 ping"></span>
            </div>
            <span className="hidden sm:block text-xs font-medium">Live sync</span>
          </div>

          {/* Right section: Theme + User menu */}
          <div className="flex items-center gap-4">
            {/* User menu */}
            <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 btn-press"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-9 h-9 rounded-full ring-2 ring-orange-500"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
              )}
              <motion.svg
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-500 dark:text-orange-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="absolute right-0 mt-3 w-60 rounded-2xl shadow-2xl z-20 overflow-hidden bg-white dark:bg-black border border-gray-200 dark:border-orange-500/30 origin-top-right"
                  >
                    {/* User info */}
                    <div className="px-4 py-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full ring-2 ring-orange-500" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{name}</p>
                          <p className="text-gray-500 dark:text-orange-400 text-xs truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sign out */}
                    <div className="p-2">
                      <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {loggingOut ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" style={{ animation: 'spin 1s linear infinite' }}></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        )}
                        {loggingOut ? 'Signing out...' : 'Sign Out'}
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </nav>
  )
}