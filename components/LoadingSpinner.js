export default function LoadingSpinner() {
  return (
    <div className="gradient-bg flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-6">
        {/* Animated bookmark icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center" style={{animation: 'spin 3s linear infinite'}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-indigo-500 rounded-2xl opacity-30 blur-xl ping"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-white text-xl font-semibold">Loading your bookmarks</p>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-indigo-400 rounded-full"
                style={{
                  animation: 'bounce 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}