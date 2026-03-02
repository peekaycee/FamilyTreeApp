export interface Person {
  id: string;
  name?: string;
  generation?: number;
  x?: number;
  y?: number;
}

export interface Union {
  id: string;
  partnerIds: string[]; // 1 or 2 members
  childrenIds: string[];

  // NEW (preferred)
  side?: number; // -1 | 1
  gap?: number;

  // LEGACY (still supported)
  order?: number;
}

export interface LayoutConfig {
  verticalSpacing: number;
  marriageSpacing: number;
  siblingSpacing: number;
  partnerOffset: number;
}

export interface PositionedPerson extends Person {
  x: number;
  y: number;
}

export interface ConnectorLine {
  type: "horizontal" | "vertical";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const defaultConfig: LayoutConfig = {
  verticalSpacing: 220,
  marriageSpacing: 300,
  siblingSpacing: 270,
  partnerOffset: 140,
};

export function computeLayout(
  persons: Person[],
  unions: Union[],
  config: LayoutConfig = defaultConfig
) {
  const personMap = new Map<string, PositionedPerson>();
  const lines: ConnectorLine[] = [];

  /* -------------------------------------------------------
     STEP 1 — Initialize people (baseline positions)
  ------------------------------------------------------- */

  persons.forEach((p, index) => {
    personMap.set(p.id, {
      ...p,
      x: index * config.siblingSpacing,
      y: (p.generation ?? 0) * config.verticalSpacing,
    });
  });

  /* -------------------------------------------------------
     STEP 2 — Track horizontal union slots per person
     (prevents spouse overlap across multiple unions)
  ------------------------------------------------------- */

  const unionSlotIndex = new Map<string, number>();

  function nextUnionSlot(personId: string) {
    const current = unionSlotIndex.get(personId) ?? 0;
    unionSlotIndex.set(personId, current + 1);
    return current;
  }

  /* -------------------------------------------------------
     STEP 3 — Process unions (core layout logic)
  ------------------------------------------------------- */

  unions.forEach((union) => {
    const partners = union.partnerIds.filter(Boolean);
    if (partners.length === 0) return;

    const pA = personMap.get(partners[0]);
    const pB = partners[1]
      ? personMap.get(partners[1])
      : null;

    if (!pA) return;

    /* -----------------------------
       Union center computation
    ----------------------------- */

    const baseX = pA.x;
    const baseY = pA.y;

    const slot =
      nextUnionSlot(pA.id) +
      (pB ? nextUnionSlot(pB.id) : 0);

    const unionCenterX =
      baseX + slot * config.marriageSpacing;

    /* -----------------------------
       Spouse offset logic
       THIS IS WHERE offsetX BELONGS
    ----------------------------- */

    let offsetX = config.partnerOffset;

    if (union.side !== undefined && union.gap !== undefined) {
      offsetX = union.side * union.gap;
    } else if (union.order !== undefined) {
      offsetX = union.order * config.partnerOffset;
    }

    /* -----------------------------
       Position partners
    ----------------------------- */

    pA.x = unionCenterX - offsetX;
    pA.y = baseY;

    if (pB) {
      pB.x = unionCenterX + offsetX;
      pB.y = baseY;

      // marriage line
      lines.push({
        type: "horizontal",
        x1: pA.x,
        y1: pA.y,
        x2: pB.x,
        y2: pB.y,
      });
    }

    /* -----------------------------
       Children layout
    ----------------------------- */

    if (union.childrenIds.length === 0) return;

    const centerX = pB
      ? (pA.x + pB.x) / 2
      : pA.x;

    const dropY = baseY + config.verticalSpacing / 2;

    // vertical drop from parents
    lines.push({
      type: "vertical",
      x1: centerX,
      y1: baseY,
      x2: centerX,
      y2: dropY,
    });

    const children = union.childrenIds
      .map((id) => personMap.get(id))
      .filter(Boolean) as PositionedPerson[];

    const totalWidth =
      (children.length - 1) * config.siblingSpacing;

    children.forEach((child, index) => {
      const childX =
        centerX -
        totalWidth / 2 +
        index * config.siblingSpacing;

      child.x = childX;
      child.y = baseY + config.verticalSpacing;

      // vertical to child
      lines.push({
        type: "vertical",
        x1: childX,
        y1: dropY,
        x2: childX,
        y2: child.y,
      });
    });

    // sibling bar
    if (children.length > 1) {
      lines.push({
        type: "horizontal",
        x1: children[0].x,
        y1: dropY,
        x2: children[children.length - 1].x,
        y2: dropY,
      });
    }
  });

  /* -------------------------------------------------------
     DONE
  ------------------------------------------------------- */

  return {
    persons: Array.from(personMap.values()),
    lines,
  };
}