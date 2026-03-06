"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/supabaseClient"
import styles from './components.module.css'

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

    // SESSION CHECK ONLY WHEN SEARCH IS TRIGGERED
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/auth/login")
      return
    }

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
    <div className={styles.searchEngine}>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search family member..."
          autoFocus
        />
      </form>

      {query && (
        <div className={styles.searchDropdown}>
          {loading && <div>Searching...</div>}

          {results.map((member) => (
            <div
              className={styles.results}
              key={member.id}
              onClick={() => {
                router.push(`/basic/members/${member.id}`)
                setQuery("")
                setResults([])
              }}
            >
               {member.name}
            </div>
          ))}

          {!loading && results.length === 0 && (
            <div className={styles.noResult}>No results</div>
          )}
        </div>
      )}
    </div>
  )
}