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

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  if (!id || !uuidValidate(id)) notFound();

  /* ===== FETCH MEMBER ===== */
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
    console.error("MEMBER FETCH ERROR:", error);
    notFound();
  }

  // Safe normalization (prevents undefined issues)
const normalizeRelation = (
  rel: any
): { id: string; name: string } | null => {
  if (!rel) return null;

  // If it's an array → take first element
  if (Array.isArray(rel)) {
    return rel.length > 0 ? rel[0] : null;
  }

  // If it's already an object → return as is
  return rel;
};

const member: FamilyMember = {
  ...data,
  father: normalizeRelation(data.father),
  mother: normalizeRelation(data.mother),
};

  /* ===== FETCH CHILDREN ===== */
  const { data: childrenData } = await supabase
    .from("family_members")
    .select("id, name")
    .or(`father_id.eq.${id},mother_id.eq.${id}`);

  const children: Child[] = childrenData ?? [];

  /* ===== FETCH SPOUSE ===== */
  const { data: unions } = await supabase
    .from("family_unions")
    .select("partner_a, partner_b")
    .or(`partner_a.eq.${id},partner_b.eq.${id}`);

  let spouse: { id: string; name: string } | null = null;

  if (unions && unions.length > 0) {
    const u = unions[0];

    const spouseId =
      u.partner_a === id ? u.partner_b :
      u.partner_b === id ? u.partner_a :
      null;

    if (spouseId) {
      const { data: spouseData } = await supabase
        .from("family_members")
        .select("id, name")
        .eq("id", spouseId)
        .single();

      if (spouseData) {
        spouse = {
          id: spouseData.id,
          name: spouseData.name,
        };
      }
    }
  }

  /* ===== SAFE DERIVED VALUES ===== */
  const fatherName = member.father?.name ?? "Not recorded";
  const motherName = member.mother?.name ?? "Not recorded";

  /* ===== UI ===== */
  return (
    <div style={{ padding: "2rem" }}>
      <h1>{member.name}</h1>

      <p>Role: {member.role ?? "N/A"}</p>
      <p>Generation: {member.generation ?? "N/A"}</p>
      <p>
        Position: (
        {member.pos_x ?? "?"}, {member.pos_y ?? "?"}
        )
      </p>

      {member.avatar_url && (
        <Image
          src={member.avatar_url}
          alt="Avatar"
          width={100}
          height={100}
        />
      )}

      <hr />

      <h3>Father</h3>
      <p>{fatherName}</p>

      <h3>Mother</h3>
      <p>{motherName}</p>

      <h3>Spouse</h3>
      <p>{spouse?.name ?? "Not recorded"}</p>

      <h3>Children</h3>
      {children.length > 0 ? (
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
      <p>{member.birth_date ?? "Not recorded"}</p>

      <h3>Death Date</h3>
      <p>{member.death_date ?? "Not recorded"}</p>
    </div>
  );
}