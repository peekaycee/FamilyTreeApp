// export interface Person {
//   id: string;
//   name?: string;
//   generation?: number;
//   x?: number;
//   y?: number;
// }

// export interface Union {
//   id: string;
//   partnerIds: string[];
//   childrenIds: string[];

//   side?: number;
//   gap?: number;
//   order?: number;
// }

// export interface LayoutConfig {
//   verticalSpacing: number;
//   marriageSpacing: number;
//   siblingSpacing: number;
//   partnerOffset: number;
// }

// export interface PositionedPerson extends Person {
//   x: number;
//   y: number;
// }

// export interface ConnectorLine {
//   type: "horizontal" | "vertical";
//   x1: number;
//   y1: number;
//   x2: number;
//   y2: number;
// }

// const defaultConfig: LayoutConfig = {
//   verticalSpacing: 220,
//   marriageSpacing: 300,
//   siblingSpacing: 270,
//   partnerOffset: 240,
// };

// export function computeLayout(
//   persons: Person[],
//   unions: Union[],
//   config: LayoutConfig = defaultConfig
// ) {
//   const personMap = new Map<string, PositionedPerson>();

//   const lines: ConnectorLine[] = [];

//   const validUnions = unions
//     .map((u) => ({
//       ...u,
//       partnerIds: [...new Set(u.partnerIds)].filter(
//         (id) => personMap.has(id) || persons.some((p) => p.id === id)
//       ),
//       childrenIds: [...new Set(u.childrenIds)].filter((id) =>
//         persons.some((p) => p.id === id)
//       ),
//     }))
//     .filter((u) => u.partnerIds.length > 0);

//   persons.forEach((p) => {
//     personMap.set(p.id, {
//       ...p,
//       x: 0,
//       y: 0,
//     });
//   });

//   const unionMap = new Map<string, Union>();

//   validUnions.forEach((u) => {
//     unionMap.set(u.id, u);
//   });

//   // --------------------------------------------------
//   // STEP 1: BUILD FAMILY RELATIONSHIPS
//   // --------------------------------------------------

//   const parentUnions = new Map<string, Union[]>();

//   const childParentMap = new Map<string, string[]>();

//   validUnions.forEach((u) => {
//     u.childrenIds.forEach((childId) => {
//       const existing = parentUnions.get(childId) ?? [];

//       existing.push(u);

//       parentUnions.set(childId, existing);

//       childParentMap.set(
//         childId,
//         [...new Set([
//           ...(childParentMap.get(childId) ?? []),
//           ...u.partnerIds,
//         ])]
//       );
//     });
//   });

//   // --------------------------------------------------
//   // STEP 2: GENERATION CALCULATION
//   // --------------------------------------------------

//   const generationMap = new Map<string, number>();

//   function getGeneration(
//     id: string,
//     visiting = new Set<string>()
//   ): number {
//     if (generationMap.has(id)) {
//       return generationMap.get(id)!;
//     }

//     const person = personMap.get(id);

//     if (!person) return 0;

//     if (visiting.has(id)) {
//       return person.generation ?? 0;
//     }

//     visiting.add(id);

//     const parents = childParentMap.get(id) ?? [];

//     let generation = person.generation ?? 0;

//     if (parents.length > 0) {
//       generation = Math.max(
//         generation,
//         ...parents.map((parentId) =>
//           getGeneration(parentId, new Set(visiting)) + 1
//         )
//       );
//     }

//     generationMap.set(id, generation);

//     return generation;
//   }

//   persons.forEach((p) => {
//     const generation = getGeneration(p.id);

//     const person = personMap.get(p.id)!;

//     person.generation = generation;
//     person.y = generation * config.verticalSpacing;
//   });

//   // --------------------------------------------------
//   // STEP 3: DYNAMIC SUBTREE WIDTH CALCULATION
//   // --------------------------------------------------

//   const personWidths = new Map<string, number>();

//   const unionWidths = new Map<string, number>();

//   const measuringPeople = new Set<string>();

//   const measuringUnions = new Set<string>();

//   const MIN_NODE_WIDTH = Math.max(
//     config.siblingSpacing,
//     config.partnerOffset * 2
//   );

//   function measurePerson(id: string): number {
//     if (personWidths.has(id)) {
//       return personWidths.get(id)!;
//     }

//     if (measuringPeople.has(id)) {
//       return MIN_NODE_WIDTH;
//     }

//     measuringPeople.add(id);

//     const childGroups = validUnions.filter(
//       (u) =>
//         u.partnerIds.includes(id) &&
//         u.childrenIds.length > 0
//     );

//     let width = MIN_NODE_WIDTH;

//     if (childGroups.length > 0) {
//       const groupWidths = childGroups.map((u) =>
//         measureUnion(u)
//       );

//       width = Math.max(
//         MIN_NODE_WIDTH,
//         groupWidths.reduce((sum, value) => sum + value, 0) +
//           Math.max(0, groupWidths.length - 1) *
//             config.marriageSpacing
//       );
//     }

//     measuringPeople.delete(id);

//     personWidths.set(id, width);

//     return width;
//   }

//   function measureUnion(union: Union): number {
//     if (unionWidths.has(union.id)) {
//       return unionWidths.get(union.id)!;
//     }

//     if (measuringUnions.has(union.id)) {
//       return MIN_NODE_WIDTH;
//     }

//     measuringUnions.add(union.id);

//     const children = union.childrenIds
//       .filter((id) => personMap.has(id));

//     const childWidths = children.map((id) =>
//       measurePerson(id)
//     );

//     const width =
//       children.length === 0
//         ? MIN_NODE_WIDTH
//         : Math.max(
//             MIN_NODE_WIDTH,
//             childWidths.reduce((sum, value) => sum + value, 0) +
//               Math.max(0, children.length - 1) *
//                 config.siblingSpacing
//           );

//     measuringUnions.delete(union.id);

//     unionWidths.set(union.id, width);

//     return width;
//   }

//   // Measure every family branch before positioning anything.

//   validUnions.forEach((u) => measureUnion(u));

//   persons.forEach((p) => measurePerson(p.id));

//   // --------------------------------------------------
//   // STEP 4: POSITION FAMILY MEMBERS
//   // --------------------------------------------------

//   const positioned = new Set<string>();

//   const processedUnions = new Set<string>();

//   const placingPeople = new Set<string>();

//   function setPersonPosition(
//     id: string,
//     x: number,
//     generation?: number
//   ) {
//     const person = personMap.get(id);

//     if (!person || positioned.has(id)) return;

//     person.x = x;

//     if (generation !== undefined) {
//       person.generation = generation;
//       person.y = generation * config.verticalSpacing;
//     }

//     positioned.add(id);
//   }

//   function getUnionGap(union: Union): number {
//     return Math.max(
//       config.partnerOffset,
//       union.gap ?? config.partnerOffset
//     );
//   }

//   function placePerson(
//     id: string,
//     centerX: number,
//     generation?: number
//   ) {
//     const person = personMap.get(id);

//     if (!person || placingPeople.has(id)) return;

//     if (!positioned.has(id)) {
//       setPersonPosition(
//         id,
//         centerX,
//         generation
//       );
//     }

//     placingPeople.add(id);

//     const childUnions = validUnions.filter(
//       (u) =>
//         u.partnerIds.includes(id) &&
//         u.childrenIds.length > 0
//     );

//     if (childUnions.length > 0) {
//       const totalWidth = childUnions.reduce(
//         (sum, u) => sum + measureUnion(u),
//         0
//       ) +
//         Math.max(0, childUnions.length - 1) *
//           config.marriageSpacing;

//       let currentX = person.x - totalWidth / 2;

//       childUnions.forEach((union) => {
//         const width = measureUnion(union);

//         const unionCenter = currentX + width / 2;

//         placeUnion(union, unionCenter);

//         currentX += width + config.marriageSpacing;
//       });
//     }

//     placingPeople.delete(id);
//   }

//   // --------------------------------------------------
//   // STEP 5: POSITION UNIONS AND THEIR CHILDREN
//   // --------------------------------------------------

//   function placeUnion(
//     union: Union,
//     requestedCenterX: number
//   ) {
//     if (processedUnions.has(union.id)) return;

//     processedUnions.add(union.id);

//     const partners = union.partnerIds
//       .map((id) => personMap.get(id))
//       .filter(Boolean) as PositionedPerson[];

//     if (partners.length === 0) return;

//     const gap = getUnionGap(union);

//     const generation = Math.max(
//       ...partners.map((p) => p.generation ?? 0)
//     );

//     // Position partners without moving members
//     // who have already been positioned elsewhere.

//     if (partners.length === 1) {
//       setPersonPosition(
//         partners[0].id,
//         requestedCenterX,
//         generation
//       );
//     }

//     if (partners.length >= 2) {
//       const [a, b] = partners;

//       const side =
//         union.side === -1 || union.side === 1
//           ? union.side
//           : 1;

//       const orderOffset =
//         union.order !== undefined
//           ? union.order * config.partnerOffset
//           : 0;

//       const offset = gap + Math.abs(orderOffset);

//       if (!positioned.has(a.id) && !positioned.has(b.id)) {
//         setPersonPosition(
//           a.id,
//           requestedCenterX - offset,
//           generation
//         );

//         setPersonPosition(
//           b.id,
//           requestedCenterX + offset,
//           generation
//         );
//       } else if (!positioned.has(a.id)) {
//         setPersonPosition(
//           a.id,
//           b.x - side * offset,
//           generation
//         );
//       } else if (!positioned.has(b.id)) {
//         setPersonPosition(
//           b.id,
//           a.x + side * offset,
//           generation
//         );
//       }

//       // Marriage connector

//       const actualA = personMap.get(a.id)!;
//       const actualB = personMap.get(b.id)!;

//       if (actualA.x !== actualB.x) {
//         lines.push({
//           type: "horizontal",
//           x1: Math.min(actualA.x, actualB.x),
//           y1: actualA.y,
//           x2: Math.max(actualA.x, actualB.x),
//           y2: actualB.y,
//         });
//       }
//     }

//     // ------------------------------------------------
//     // CHILDREN
//     // ------------------------------------------------

//     const children = union.childrenIds
//       .map((id) => personMap.get(id))
//       .filter(Boolean) as PositionedPerson[];

//     if (children.length === 0) return;

//     const actualPartners = partners.map(
//       (p) => personMap.get(p.id)!
//     );

//     const centerX =
//       actualPartners.reduce((sum, p) => sum + p.x, 0) /
//       actualPartners.length;

//     const parentY = Math.max(
//       ...actualPartners.map((p) => p.y)
//     );

//     const childGeneration = Math.max(
//       ...actualPartners.map(
//         (p) => (p.generation ?? 0) + 1
//       )
//     );

//     const childWidths = children.map((child) =>
//       measurePerson(child.id)
//     );

//     const totalWidth =
//       childWidths.reduce((sum, width) => sum + width, 0) +
//       Math.max(0, children.length - 1) *
//         config.siblingSpacing;

//     const childStartX = centerX - totalWidth / 2;

//     const dropY = parentY + config.verticalSpacing / 2;

//     // Vertical parent-to-children connector

//     lines.push({
//       type: "vertical",
//       x1: centerX,
//       y1: parentY,
//       x2: centerX,
//       y2: dropY,
//     });

//     let currentX = childStartX;

//     const childCenters: number[] = [];

//     children.forEach((child, index) => {
//       const width = childWidths[index];

//       const childCenter = currentX + width / 2;

//       childCenters.push(childCenter);

//       placePerson(
//         child.id,
//         childCenter,
//         childGeneration
//       );

//       currentX += width + config.siblingSpacing;
//     });

//     // Horizontal sibling connector

//     if (childCenters.length > 1) {
//       lines.push({
//         type: "horizontal",
//         x1: childCenters[0],
//         y1: dropY,
//         x2: childCenters[childCenters.length - 1],
//         y2: dropY,
//       });
//     }

//     // Individual vertical child connectors

//     children.forEach((child) => {
//       const actualChild = personMap.get(child.id)!;

//       lines.push({
//         type: "vertical",
//         x1: actualChild.x,
//         y1: dropY,
//         x2: actualChild.x,
//         y2: actualChild.y,
//       });
//     });
//   }

//   // --------------------------------------------------
//   // STEP 6: IDENTIFY ROOT FAMILY UNIONS
//   // --------------------------------------------------

//   const rootUnions = validUnions.filter((union) => {
//     return !union.partnerIds.every((id) =>
//       childParentMap.has(id)
//     );
//   });

//   const sortedRoots = [...rootUnions].sort((a, b) => {
//     const genA = Math.min(
//       ...a.partnerIds.map(
//         (id) => personMap.get(id)?.generation ?? 0
//       )
//     );

//     const genB = Math.min(
//       ...b.partnerIds.map(
//         (id) => personMap.get(id)?.generation ?? 0
//       )
//     );

//     return genA - genB;
//   });

//   let currentRootX = 0;

//   sortedRoots.forEach((union) => {
//     if (processedUnions.has(union.id)) return;

//     const width = measureUnion(union);

//     const centerX = currentRootX + width / 2;

//     placeUnion(union, centerX);

//     currentRootX += width + config.marriageSpacing;
//   });

//   // --------------------------------------------------
//   // STEP 7: POSITION UNCONNECTED MEMBERS
//   // --------------------------------------------------

//   const unconnected = persons.filter(
//     (p) => !positioned.has(p.id)
//   );

//   unconnected.forEach((person) => {
//     const width = measurePerson(person.id);

//     placePerson(
//       person.id,
//       currentRootX + width / 2,
//       person.generation ?? 0
//     );

//     currentRootX += width + config.marriageSpacing;
//   });

//   // --------------------------------------------------
//   // STEP 8: RETURN LAYOUT
//   // --------------------------------------------------

//   return {
//     persons: Array.from(personMap.values()),

//     lines,

//     bounds: {
//       minX: Math.min(
//         ...Array.from(personMap.values()).map((p) => p.x),
//         0
//       ),
//       maxX: Math.max(
//         ...Array.from(personMap.values()).map((p) => p.x),
//         0
//       ),
//       minY: Math.min(
//         ...Array.from(personMap.values()).map((p) => p.y),
//         0
//       ),
//       maxY: Math.max(
//         ...Array.from(personMap.values()).map((p) => p.y),
//         0
//       ),
//     },
//   };
// }



export interface Person {
  id: string;
  name?: string;
  generation?: number;
  x?: number;
  y?: number;
}

export interface Union {
  id: string;
  partnerIds: string[];
  childrenIds: string[];
  side?: number;
  gap?: number;
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
  partnerOffset: 240,
};

export function computeLayout(
  persons: Person[],
  unions: Union[],
  config: LayoutConfig = defaultConfig
) {
  const personMap = new Map<string, PositionedPerson>();
  const lines: ConnectorLine[] = [];

  // --------------------------------------------------
  // INITIALIZE PEOPLE
  // --------------------------------------------------

  persons.forEach((p) => {
    personMap.set(p.id, {
      ...p,
      x: 0,
      y: 0,
    });
  });

  // --------------------------------------------------
  // VALIDATE FAMILY RELATIONSHIPS
  // --------------------------------------------------

  const personIds = new Set(persons.map((p) => p.id));
  const assignedPartners = new Set<string>();
  const assignedChildren = new Set<string>();

  const validUnions: Union[] = [];

  unions.forEach((u) => {
    const partnerIds = [...new Set(u.partnerIds)]
      .filter((id) => personIds.has(id))
      .slice(0, 2);

    if (partnerIds.length === 0) return;

    // A person can belong to only one spouse union.
    if (partnerIds.some((id) => assignedPartners.has(id))) {
      return;
    }

    const childrenIds = [...new Set(u.childrenIds)].filter(
      (id) =>
        personIds.has(id) &&
        !partnerIds.includes(id) &&
        !assignedChildren.has(id)
    );

    partnerIds.forEach((id) => assignedPartners.add(id));
    childrenIds.forEach((id) => assignedChildren.add(id));

    validUnions.push({
      ...u,
      partnerIds,
      childrenIds,
    });
  });

  // --------------------------------------------------
  // STEP 1: BUILD FAMILY RELATIONSHIPS
  // --------------------------------------------------

  const childParentMap = new Map<string, string[]>();

  validUnions.forEach((u) => {
    u.childrenIds.forEach((childId) => {
      childParentMap.set(childId, [...u.partnerIds]);
    });
  });

  // --------------------------------------------------
  // STEP 2: GENERATION CALCULATION
  // --------------------------------------------------

  const generationMap = new Map<string, number>();

  function getGeneration(
    id: string,
    visiting = new Set<string>()
  ): number {
    if (generationMap.has(id)) {
      return generationMap.get(id)!;
    }

    const person = personMap.get(id);

    if (!person) return 0;

    if (visiting.has(id)) {
      return person.generation ?? 0;
    }

    visiting.add(id);

    const parents = childParentMap.get(id) ?? [];

    let generation = person.generation ?? 0;

    if (parents.length > 0) {
      generation = Math.max(
        generation,
        ...parents.map(
          (parentId) =>
            getGeneration(parentId, new Set(visiting)) + 1
        )
      );
    }

    generationMap.set(id, generation);

    return generation;
  }

  persons.forEach((p) => {
    const generation = getGeneration(p.id);
    const person = personMap.get(p.id)!;

    person.generation = generation;
    person.y = generation * config.verticalSpacing;
  });

  // --------------------------------------------------
  // STEP 3: DYNAMIC SUBTREE WIDTH CALCULATION
  // --------------------------------------------------

  const personWidths = new Map<string, number>();
  const unionWidths = new Map<string, number>();

  const measuringPeople = new Set<string>();
  const measuringUnions = new Set<string>();

  const MIN_NODE_WIDTH = Math.max(
    config.siblingSpacing,
    config.partnerOffset * 2
  );

  function measurePerson(id: string): number {
    if (personWidths.has(id)) {
      return personWidths.get(id)!;
    }

    if (measuringPeople.has(id)) {
      return MIN_NODE_WIDTH;
    }

    measuringPeople.add(id);

    const childGroups = validUnions.filter(
      (u) =>
        u.partnerIds.includes(id) &&
        u.childrenIds.length > 0
    );

    let width = MIN_NODE_WIDTH;

    if (childGroups.length > 0) {
      const groupWidths = childGroups.map((u) =>
        measureUnion(u)
      );

      width = Math.max(
        MIN_NODE_WIDTH,
        groupWidths.reduce((sum, value) => sum + value, 0) +
          Math.max(0, groupWidths.length - 1) *
            config.marriageSpacing
      );
    }

    measuringPeople.delete(id);

    personWidths.set(id, width);

    return width;
  }

  function measureUnion(union: Union): number {
    if (unionWidths.has(union.id)) {
      return unionWidths.get(union.id)!;
    }

    if (measuringUnions.has(union.id)) {
      return MIN_NODE_WIDTH;
    }

    measuringUnions.add(union.id);

    const children = union.childrenIds.filter((id) =>
      personMap.has(id)
    );

    const childWidths = children.map((id) =>
      measurePerson(id)
    );

    const width =
      children.length === 0
        ? MIN_NODE_WIDTH
        : Math.max(
            MIN_NODE_WIDTH,
            childWidths.reduce((sum, value) => sum + value, 0) +
              Math.max(0, children.length - 1) *
                config.siblingSpacing
          );

    measuringUnions.delete(union.id);

    unionWidths.set(union.id, width);

    return width;
  }

  // Measure every family branch before positioning anything.

  validUnions.forEach((u) => measureUnion(u));

  persons.forEach((p) => measurePerson(p.id));

  // --------------------------------------------------
  // STEP 4: POSITION FAMILY MEMBERS
  // --------------------------------------------------

  const positioned = new Set<string>();
  const processedUnions = new Set<string>();
  const marriageLines = new Set<string>();
  const placingPeople = new Set<string>();

  function setPersonPosition(
    id: string,
    x: number,
    generation?: number
  ) {
    const person = personMap.get(id);

    if (!person || positioned.has(id)) return;

    person.x = x;

    if (generation !== undefined) {
      person.generation = generation;
      person.y = generation * config.verticalSpacing;
    }

    positioned.add(id);
  }

  function getUnionGap(union: Union): number {
    return Math.max(
      config.partnerOffset,
      union.gap ?? config.partnerOffset
    );
  }

  function placePerson(
    id: string,
    centerX: number,
    generation?: number
  ) {
    const person = personMap.get(id);

    if (!person || placingPeople.has(id)) return;

    if (!positioned.has(id)) {
      setPersonPosition(id, centerX, generation);
    }

    placingPeople.add(id);

    const childUnions = validUnions.filter(
      (u) =>
        u.partnerIds.includes(id) &&
        u.childrenIds.length > 0
    );

    if (childUnions.length > 0) {
      const totalWidth = childUnions.reduce(
        (sum, u) => sum + measureUnion(u),
        0
      ) +
        Math.max(0, childUnions.length - 1) *
          config.marriageSpacing;

      let currentX = person.x - totalWidth / 2;

      childUnions.forEach((union) => {
        const width = measureUnion(union);
        const unionCenter = currentX + width / 2;

        placeUnion(union, unionCenter);

        currentX += width + config.marriageSpacing;
      });
    }

    placingPeople.delete(id);
  }

  // --------------------------------------------------
  // STEP 5: POSITION UNIONS AND THEIR CHILDREN
  // --------------------------------------------------

  function placeUnion(
    union: Union,
    requestedCenterX: number
  ) {
    if (processedUnions.has(union.id)) return;

    processedUnions.add(union.id);

    const partners = union.partnerIds
      .map((id) => personMap.get(id))
      .filter(Boolean) as PositionedPerson[];

    if (partners.length === 0) return;

    const gap = getUnionGap(union);

    const generation = Math.max(
      ...partners.map((p) => p.generation ?? 0)
    );

    // Position a single-parent union.

    if (partners.length === 1) {
      setPersonPosition(
        partners[0].id,
        requestedCenterX,
        generation
      );
    }

    // Position two partners.

    if (partners.length >= 2) {
      const [a, b] = partners;

      const side =
        union.side === -1 || union.side === 1
          ? union.side
          : 1;

      const orderOffset =
        union.order !== undefined
          ? union.order * config.partnerOffset
          : 0;

      const offset = gap + Math.abs(orderOffset);

      if (!positioned.has(a.id) && !positioned.has(b.id)) {
        setPersonPosition(
          a.id,
          requestedCenterX - side * offset,
          generation
        );

        setPersonPosition(
          b.id,
          requestedCenterX + side * offset,
          generation
        );
      } else if (!positioned.has(a.id)) {
        setPersonPosition(
          a.id,
          b.x - side * offset,
          generation
        );
      } else if (!positioned.has(b.id)) {
        setPersonPosition(
          b.id,
          a.x + side * offset,
          generation
        );
      }

      // Marriage connector (prevent duplicates).

      const actualA = personMap.get(a.id)!;
      const actualB = personMap.get(b.id)!;

      const marriageKey = [a.id, b.id].sort().join(":");

      if (
        actualA.x !== actualB.x &&
        !marriageLines.has(marriageKey)
      ) {
        marriageLines.add(marriageKey);

        lines.push({
          type: "horizontal",
          x1: Math.min(actualA.x, actualB.x),
          y1: actualA.y,
          x2: Math.max(actualA.x, actualB.x),
          y2: actualB.y,
        });
      }
    }

    // ------------------------------------------------
    // CHILDREN
    // ------------------------------------------------

    const children = union.childrenIds
      .map((id) => personMap.get(id))
      .filter(Boolean) as PositionedPerson[];

    if (children.length === 0) return;

    const actualPartners = partners.map(
      (p) => personMap.get(p.id)!
    );

    const centerX =
      actualPartners.reduce((sum, p) => sum + p.x, 0) /
      actualPartners.length;

    const parentY = Math.max(
      ...actualPartners.map((p) => p.y)
    );

    const childGeneration = Math.max(
      ...actualPartners.map(
        (p) => (p.generation ?? 0) + 1
      )
    );

    const childWidths = children.map((child) =>
      measurePerson(child.id)
    );

    const totalWidth =
      childWidths.reduce((sum, width) => sum + width, 0) +
      Math.max(0, children.length - 1) *
        config.siblingSpacing;

    const childStartX = centerX - totalWidth / 2;

    const dropY = parentY + config.verticalSpacing / 2;

    // Vertical parent-to-children connector.

    lines.push({
      type: "vertical",
      x1: centerX,
      y1: parentY,
      x2: centerX,
      y2: dropY,
    });

    let currentX = childStartX;

    const childCenters: number[] = [];

    children.forEach((child, index) => {
      const width = childWidths[index];

      const childCenter = currentX + width / 2;

      childCenters.push(childCenter);

      placePerson(
        child.id,
        childCenter,
        childGeneration
      );

      currentX += width + config.siblingSpacing;
    });

    // Horizontal sibling connector.

    if (childCenters.length > 1) {
      lines.push({
        type: "horizontal",
        x1: childCenters[0],
        y1: dropY,
        x2: childCenters[childCenters.length - 1],
        y2: dropY,
      });
    }

    // Individual vertical child connectors.

    children.forEach((child) => {
      const actualChild = personMap.get(child.id)!;

      lines.push({
        type: "vertical",
        x1: actualChild.x,
        y1: dropY,
        x2: actualChild.x,
        y2: actualChild.y,
      });
    });
  }

  // --------------------------------------------------
  // STEP 6: IDENTIFY ROOT FAMILY UNIONS
  // --------------------------------------------------

  const rootUnions = validUnions.filter((union) => {
    return !union.partnerIds.every((id) =>
      childParentMap.has(id)
    );
  });

  const sortedRoots = [...rootUnions].sort((a, b) => {
    const genA = Math.min(
      ...a.partnerIds.map(
        (id) => personMap.get(id)?.generation ?? 0
      )
    );

    const genB = Math.min(
      ...b.partnerIds.map(
        (id) => personMap.get(id)?.generation ?? 0
      )
    );

    return genA - genB;
  });

  let currentRootX = 0;

  sortedRoots.forEach((union) => {
    if (processedUnions.has(union.id)) return;

    const width = measureUnion(union);

    const centerX = currentRootX + width / 2;

    placeUnion(union, centerX);

    currentRootX += width + config.marriageSpacing;
  });

  // --------------------------------------------------
  // STEP 7: POSITION UNCONNECTED MEMBERS
  // --------------------------------------------------

  const unconnected = persons.filter(
    (p) => !positioned.has(p.id)
  );

  unconnected.forEach((person) => {
    const width = measurePerson(person.id);

    placePerson(
      person.id,
      currentRootX + width / 2,
      person.generation ?? 0
    );

    currentRootX += width + config.marriageSpacing;
  });

  // --------------------------------------------------
  // STEP 8: RETURN LAYOUT
  // --------------------------------------------------

  const positionedPersons = Array.from(personMap.values());

  return {
    persons: positionedPersons,
    lines,
    bounds: {
      minX: Math.min(
        ...positionedPersons.map((p) => p.x),
        0
      ),

      maxX: Math.max(
        ...positionedPersons.map((p) => p.x),
        0
      ),

      minY: Math.min(
        ...positionedPersons.map((p) => p.y),
        0
      ),

      maxY: Math.max(
        ...positionedPersons.map((p) => p.y),
        0
      ),
    },
  };
}
