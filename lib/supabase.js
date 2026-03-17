import { createClient } from '@supabase/supabase-js'

let _client = null

function getSupabase() {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  _client = createClient(url, key)
  return _client
}

// Lazy proxy: only reads env and creates client when first used (e.g. in useEffect).
// Avoids throwing during Next.js prerender/build when env vars are not yet available.
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      return getSupabase()[prop]
    },
  }
)
