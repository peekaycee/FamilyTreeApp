import { notFound } from "next/navigation";
import Image from "next/image";
import { validate as uuidValidate } from "uuid";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ===== TYPES ===== */
interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
  father_id: string | null;
  mother_id: string | null;
  pos_x: number | null;
  pos_y: number | null;
  generation: number | null;
  is_direct_relative: boolean | null;
  birth_date: string | null;
  death_date: string | null;
  father?: { id: string; name: string } | null;
  mother?: { id: string; name: string } | null;
}

interface Child {
  id: string;
  name: string;
}

interface Union {
  partner_a: string;
  partner_b: string;
  partnerA?: { id: string; name: string } | null;
  partnerB?: { id: string; name: string } | null;
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  if (!id || !uuidValidate(id)) notFound();

  // Fetch member with father, mother, birth_date, death_date
  const { data, error } = await supabase
    .from<FamilyMember>("family_members")
    .select(`
      id,
      user_id,
      name,
      role,
      avatar_url,
      father_id,
      mother_id,
      pos_x,
      pos_y,
      generation,
      is_direct_relative,
      birth_date,
      death_date,
      father:father_id ( id, name ),
      mother:mother_id ( id, name )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    notFound();
  }

  // Fetch children
  const { data: children } = await supabase
    .from<Child>("family_members")
    .select("id, name")
    .or(`father_id.eq.${id},mother_id.eq.${id}`);

  // Fetch spouse from family_unions
const { data: unions } = await supabase
  .from<Union>("family_unions")
  .select(`
    partner_a,
    partner_b
  `)
  .or(`partner_a.eq.${id},partner_b.eq.${id}`);

let spouse: { id: string; name: string } | null = null;

if (unions && unions.length > 0) {
  const u = unions[0];
  let spouseId: string | null = null;

  if (u.partner_a === id) spouseId = u.partner_b;
  else if (u.partner_b === id) spouseId = u.partner_a;

  if (spouseId) {
    // Fetch spouse's actual name from family_members
    const { data: spouseData } = await supabase
      .from<FamilyMember>("family_members")
      .select("id, name")
      .eq("id", spouseId)
      .single();

    if (spouseData) spouse = { id: spouseData.id, name: spouseData.name };
  }
}

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{data.name}</h1>
      <p>Role: {data.role ?? "N/A"}</p>
      <p>Generation: {data.generation}</p>
      <p>Position: ({data.pos_x}, {data.pos_y})</p>
      {data.avatar_url && (
        <Image src={data.avatar_url} alt="Avatar" width={100} height={100} />
      )}

      <hr />

      <h3>Father</h3>
      <p>{data.father?.name ?? "Not recorded"}</p>

      <h3>Mother</h3>
      <p>{data.mother?.name ?? "Not recorded"}</p>

      <h3>Spouse</h3>
      <p>{spouse?.name ?? "Not recorded"}</p>

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

      <hr />

      <h3>Birth Date</h3>
      <p>{data.birth_date ?? "Not recorded"}</p>

      <h3>Death Date</h3>
      <p>{data.death_date ?? "Not recorded"}</p>
    </div>
  );
}