import dns from 'dns';

// Force DNS resolution for Supabase to bypass ISP blocking
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  if (hostname === 'wxotgmcixkltpklngaxv.supabase.co') {
    if (options && options.all) {
      return callback(null, [{ address: '104.18.38.10', family: 4 }]);
    }
    return callback(null, '104.18.38.10', 4);
  }
  
  return originalLookup(hostname, options, callback);
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
