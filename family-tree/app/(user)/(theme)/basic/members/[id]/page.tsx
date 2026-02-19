import { notFound } from "next/navigation"
import Image from "next/image"
import { validate as uuidValidate } from "uuid"
import { createSupabaseServerClient } from "@/lib/supabase/server"


export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { id } = await params

  // UUID validation
  if (!id || !uuidValidate(id)) {
    notFound()
  }

  const { data, error } = await supabase
    .from("family_members")
    .select(`
      id,
      user_id,
      name,
      role,
      avatar_url,
      father_id,
      mother_id,
      spouse_id,
      pos_x,
      pos_y,
      generation,
      is_direct_relative,
      father:father_id (
        id,
        name
      ),
      mother:mother_id (
        id,
        name
      ),
      spouse:spouse_id (
        id,
        name
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Supabase error:", error)
    notFound()
  }

  if (!data) {
    notFound()
  }

  // Fetch children separately (reverse relationship)
  const { data: children } = await supabase
    .from("family_members")
    .select("id, name")
    .or(`father_id.eq.${id},mother_id.eq.${id}`)

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{data.name}</h1>
      <p>Role: {data.role ?? "N/A"}</p>
      <p>Generation: {data.generation}</p>
      <p>Position: ({data.pos_x}, {data.pos_y})</p>
      {data.avatar_url && <Image src={data.avatar_url} alt="Avatar" width={100} height={100} />}

      <hr />

      <h3>Father</h3>
      {data.father?.[0] ? (
        <p>{data.father[0].name}</p>
      ) : (
        <p>Not recorded</p>
      )}

      <h3>Mother</h3>
      {data.mother?.[0] ? (
        <p>{data.mother[0].name}</p>
      ) : (
        <p>Not recorded</p>
      )}

      <h3>Spouse</h3>
      {data.spouse ? <p>{data.spouse.name}</p> : <p>Not recorded</p>}

      <h3>Children</h3>
      {children && children.length > 0 ? (
        <ul>
          {children.map((child) => (
            <li key={child.id}>{child.name}</li>
          ))}
        </ul>
      ) : (
        <p>No children recorded</p>
      )}
    </div>
  )
}
