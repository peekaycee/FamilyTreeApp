export interface Person {
  id: string;
  name?: string;
  generation: number;
  x?: number;
  y?: number;
}

export interface Union {
  id: string;
  partnerIds: string[]; // 1 or 2 members
  childrenIds: string[];
  order: number; // 0,1,2...
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

  // Step 1 — Position by generation (baseline grid)
  persons.forEach((p, index) => {
    const x = index * 250; // temporary baseline horizontal grid
    const y = p.generation * config.verticalSpacing;

    personMap.set(p.id, { ...p, x, y });
  });

  // Step 2 — Process Unions
  unions.forEach((union) => {
    const partners = union.partnerIds.filter(Boolean) as string[];
    if (partners.length === 0) return; // safety check

    const p1 = personMap.get(partners[0]);
    const p2 = partners[1] ? personMap.get(partners[1]) : null;

    if (!p1) return; // must have at least one parent

    const anchor = p1;
    const unionX = anchor.x + union.order * config.marriageSpacing;

    // Position second partner if exists
    if (p2) {
      p2.x = unionX + config.partnerOffset;
      p2.y = anchor.y;

      // Marriage horizontal line
      lines.push({
        type: "horizontal",
        x1: anchor.x,
        y1: anchor.y,
        x2: p2.x,
        y2: p2.y,
      });
    }

    // Children positioning
    if (union.childrenIds.length > 0) {
      // Center above anchor(s)
      const centerX = p2 ? (anchor.x + p2.x) / 2 : anchor.x;
      const dropY = anchor.y + 120;

      // Vertical line from parent(s) to children
      lines.push({
        type: "vertical",
        x1: centerX,
        y1: anchor.y,
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
          centerX - totalWidth / 2 + index * config.siblingSpacing;

        child.x = childX;
        child.y = (anchor.generation + 1) * config.verticalSpacing;

        // Vertical line to each child
        lines.push({
          type: "vertical",
          x1: childX,
          y1: dropY,
          x2: childX,
          y2: child.y,
        });
      });

      // Horizontal sibling bar if more than one child
      if (children.length > 1) {
        const first = children[0];
        const last = children[children.length - 1];

        lines.push({
          type: "horizontal",
          x1: first.x,
          y1: dropY,
          x2: last.x,
          y2: dropY,
        });
      }
    }
  });

  return {
    persons: Array.from(personMap.values()),
    lines,
  };
}

