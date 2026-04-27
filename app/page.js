'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check if already logged in
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (data?.session) {
          router.push('/dashboard')
        } else {
          setCheckingAuth(false)
        }
      } catch (err) {
        console.warn('Auth error (silenced):', err.message)
        await supabase.auth.signOut().catch(() => {}) // Clear broken state
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-orange-600 dark:border-orange-500 border-t-transparent rounded-full"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 dark:text-orange-300 text-lg font-medium"
          >
            Loading...
          </motion.p>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative overflow-hidden bg-white dark:bg-transparent">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200 dark:bg-orange-600 rounded-full dark:opacity-10 blur-3xl"
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-200 dark:bg-red-600 rounded-full dark:opacity-10 blur-3xl"
        />
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-200 dark:bg-orange-600 rounded-full dark:opacity-5 blur-3xl"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl glow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div 
          variants={itemVariants}
          className="glass rounded-3xl p-8 md:p-10 relative z-10 bg-white/70 shadow-xl dark:shadow-none dark:bg-white/5"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Smart Bookmark
            </h1>
            <p className="text-gray-600 dark:text-orange-300 text-lg">
              Save, organize & sync your bookmarks in real-time
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-3 mb-8">
            {[
              { icon: '🔒', text: 'Private bookmarks — only you can see them' },
              { icon: '⚡', text: 'Real-time sync across all your tabs' },
              { icon: '🌐', text: 'Access from anywhere, anytime' },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="flex items-center gap-3 text-gray-700 dark:text-orange-200"
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Google Login Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white dark:hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-2xl shadow-lg border border-gray-200 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                {/* Google SVG icon */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>

          <p className="text-center text-gray-500 dark:text-orange-400 text-xs mt-6">
            By signing in, your bookmarks are private and secure
          </p>
        </motion.div>

        {/* Bottom text */}
        <motion.p 
          variants={itemVariants}
          className="text-center text-gray-400 dark:text-orange-500 text-sm mt-6"
        >
          Built with Next.js · Supabase · Tailwind CSS
        </motion.p>
      </motion.div>
    </div>
  )
}