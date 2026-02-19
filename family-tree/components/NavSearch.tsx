"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient"

const supabase = createSupabaseBrowserClient()

export default function NavSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)

      const { data } = await supabase
        .rpc("search_family_members", { search_query: query })

      setResults(data || [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query])

  if (!query.trim()) {
    if (results.length > 0) setResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Run the same FTS search first
    const { data } = await supabase
      .rpc("search_family_members", { search_query: query })

    // If exactly one result, go directly there
    if (data?.length === 1) {
      router.push(`/basic/members/${data[0].id}`)
      setQuery("")
      setResults([])
      return
    }

    // Otherwise go to the search page (with ranking results)
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setResults([])
  }

  return (
    <div style={{ position: "relative" }}>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search family member..."
        />
      </form>

      {query && (
        <div style={{
          position: "absolute",
          background: "white",
          width: "100%",
          border: "1px solid #ddd",
          zIndex: 1000
        }}>
          {loading && <div>Searching...</div>}

          {results.map((member) => (
            <div
              key={member.id}
              style={{ padding: "8px", cursor: "pointer" }}
              onClick={() => {
                router.push(`/basic/members/${member.id}`)
                setQuery("")
                setResults([])
              }}
            >
               {member.name} {/* ({member.role}) */}
            </div>
          ))}

          {!loading && results.length === 0 && (
            <div style={{ padding: "8px" }}>No results</div>
          )}
        </div>
      )}
    </div>
  )
}
