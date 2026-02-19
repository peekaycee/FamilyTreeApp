// import { createClient } from "@supabase/supabase-js"

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

import { createSupabaseServerClient } from "@/lib/supabase/server"

// export default async function SearchPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ q?: string }>
// }) {
//   const params = await searchParams
//   const query = params.q ?? ""

//   if (!query.trim()) {
//     return <div>No search query provided.</div>
//   }

//   const { data, error } = await supabase
//     .rpc("search_family_members", { search_query: query })

//   if (error) {
//     console.error(error)
//     return <div>{error.message}</div>
//   }

//   return (
//     <div>
//       <h1>Search Results</h1>

//       {data?.length === 0 && (
//         <div>No matching members found.</div>
//       )}

//       {data?.map((member: any) => (
//         <div key={member.id}>
//           <a href={`/basic/members/${member.id}`}>
//             {member.name} ({member.role})
//           </a>
//         </div>
//       ))}
//     </div>
//   )
// }


export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const params = await searchParams
  const query = params.q ?? ""

  if (!query.trim()) {
    return <div>No search query provided.</div>
  }

  const { data, error } = await supabase
    .rpc("search_family_members", { search_query: query })

  if (error) {
    console.error(error)
    return <div>{error.message}</div>
  }

  return (
    <div>
      <h1>Search Results</h1>

      {data?.length === 0 && (
        <div>No matching members found.</div>
      )}

      {data?.map((member: any) => (
        <div key={member.id}>
          <a href={`/basic/members/${member.id}`}>
            {member.name} ({member.role})
          </a>
        </div>
      ))}
    </div>
  )
}
