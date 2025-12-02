export function buildTree(members: any[]) {
  const map = new Map(members.map(m => [m.id, { ...m, children: [] }]));
  const roots: any[] = [];

  members.forEach(member => {
    const parentId = member.father_id || member.mother_id;
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(map.get(member.id));
    } else {
      roots.push(map.get(member.id));
    }
  });

  return roots;
}
