"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as PIXI from "pixi.js";
import { v4 as uuidv4 } from "uuid";
import { createSupabaseBrowserClient } from "../lib/supabase/supabaseClient";
import { User } from "@supabase/supabase-js";
import styles from "./components.module.css";
import Image from "next/image";
import { computeLayout } from "@/lib/tree/layoutEngine";
import type { Person, Union } from "@/lib/tree/layoutEngine";
import gsap from "gsap";
import { useRouter } from "next/navigation";

export type MemberRow = {
  id: string;
  user_id?: string | null;
  name: string;
  role?: string | null;
  father_id?: string | null;
  mother_id?: string | null;
  // spouse_id?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  created_at?: string | null;
};

export type UnionRow = {
  id: string;
  user_id: string;
  partner_a: string;
  partner_b: string;
  left_partner: string;
};

type EditingState = { id: string };

const NODE_RADIUS = 36;
const STAGE_TOP_PADDING = 10;


// Map roles to colors/icons
const roleColors: Record<string, number> = {
  grandfather: 0x8b5cf6,
  grandmother: 0xfb7185,
  father: 0x1e90ff,
  mother: 0xf59e0b,
  son: 0x34d399,
  daughter: 0x60a5fa,
  uncle: 0xf97316,
  aunt: 0xec4899,
  brother: 0x06b6d4,
  sister: 0xf472b6,
  cousin: 0xa78bfa,
  nephew: 0x60a5fa,
  niece: 0xfaa2c1,
  spouse: 0xe2e8f0,
  default: 0xd1d5db,
};

export default function FamilyCanvas() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spritesRef = useRef<Record<string, PIXI.Container>>({});
  const originalLayoutRef = useRef<Record<string, { x: number; y: number }>>({});
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [touchedName, setTouchedName] = useState(false);
  const [TouchedRole, setTouchedRole] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const originalViewRef = useRef<{x: number; y: number; scale: number; } | null>(null);
  const [unionsDB, setUnionsDB] = useState<UnionRow[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);

  // Editing modal state
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Add member modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addFather, setAddFather] = useState<string | null>(null);
  const [addMother, setAddMother] = useState<string | null>(null);
  const [addSpouse, setAddSpouse] = useState<string | null>(null);
  const [addBirthDate, setAddBirthDate] = useState<string | null>(null);
  const [addDeathDate, setAddDeathDate] = useState<string | null>(null);
  const [highlightBloodline, setHighlightBloodline] = useState<Set<string>>(new Set());

  const supabase = createSupabaseBrowserClient();

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // REF to block realtime reloads while editing
  const isEditingRef = useRef(false);

  const loadMembers = useCallback(async () => {
  if (!user?.id) return; // ← CRITICAL GUARD

  setLoading(true);
  try {
    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", user.id)   // safe now
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error.message);
      throw error;
    }

    setMembers(data ?? []);
  } catch (err) {
    console.error("fetchMembers", err);
    setMembers([]);
  } finally {
    setLoading(false);
  }

    const { data: unions } = await supabase
    .from("family_unions")
    .select("*")
    .eq("user_id", user.id);

  setUnionsDB(unions ?? []);

}, [supabase, user]);

// // Session Check
useEffect(() => {
  return () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  };
}, [avatarPreview]);

// Session Check
useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      setToastMessage("Session expired. Please login again.")
      setToastType("error")

      setTimeout(() => {
        router.replace("/auth/login")
      }, 3000)

      return
    }

    setUser(data.user)
  }

  checkSession()
}, [router, supabase.auth])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.replace("/auth/login")
        return
      }
      setUser(data.user)
    }

    init()

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)

        if (!session) {
          router.replace("/auth/login")
        }
      })

    return () => listener?.subscription.unsubscribe()
  }, [router, supabase])

  // Fetch members & subscribe to realtime
  useEffect(() => {
    if (!user) return;
    loadMembers();
    const ch = supabase
      .channel("family-members-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_members" },
        () => {
          if (!isEditingRef.current) loadMembers();
        }
      )
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [loadMembers, supabase, user]);


// ================= CREATE PIXI APP =================
useEffect(() => {
  if (!containerRef.current) return;

  const container = containerRef.current;

  const app = new PIXI.Application({
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: 0xfAf8f5,
    antialias: true,
    resolution: window.devicePixelRatio || 0.5,
    autoDensity: true,
  });

  const onDocumentMouseDown = (e: MouseEvent) => {
  if (!containerRef.current) return;

  if (!containerRef.current.contains(e.target as Node)) {
    setHighlightBloodline(new Set());
    }
  };

  document.addEventListener("mousedown", onDocumentMouseDown);

  app.stage.x = app.renderer.width / 2;
  // app.stage.y = app.renderer.height / 2;

  // Append canvas only once
  const canvas = app.view as HTMLCanvasElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.cursor = "grab";
  canvas.style.touchAction = "none";
  container.appendChild(canvas);

// ------------------ REMOVE HIGHLIGHT ON DOUBLE-CLICK ------------------
const onCanvasDoubleClick = (e: MouseEvent) => {
  const app = appRef.current;
  if (!app) return;

  // Only trigger if clicked on empty canvas
  if (e.target === app.view) {
    setHighlightBloodline(new Set());
  }
};

canvas.addEventListener("dblclick", onCanvasDoubleClick);

  appRef.current = app;

  // ================= PANNING =================
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let stageStart = { x: 0, y: 0 };

  // ================= PINCH ZOOM (MOBILE) =================
  const activePointers = new Map<number, PointerEvent>();
  let isPinching = false;
  let startDistance = 0;
  let startScale = 1;

  const getDistance = (p1: PointerEvent, p2: PointerEvent) => {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onPointerDown = (e: PointerEvent) => {
    activePointers.set(e.pointerId, e);

    // Two fingers = pinch mode
    if (activePointers.size === 2) {
      const [p1, p2] = Array.from(activePointers.values());
      startDistance = getDistance(p1, p2);
      startScale = app.stage.scale.x;
      isPinching = true;
      isPanning = false;
      return;
    }

    // One finger = pan
    if (!isPinching) {
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY };
      stageStart = { x: app.stage.x, y: app.stage.y };
      canvas.style.cursor = "grabbing";
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (activePointers.has(e.pointerId)) {
      activePointers.set(e.pointerId, e);
    }

    // 🔵 PINCH ZOOM
    if (isPinching && activePointers.size === 2) {
      const [p1, p2] = Array.from(activePointers.values());
      const newDistance = getDistance(p1, p2);

      const scaleFactor = newDistance / startDistance;
      let newScale = startScale * scaleFactor;

      newScale = Math.max(0.25, Math.min(3, newScale));

      const rect = canvas.getBoundingClientRect();
      const midX = (p1.clientX + p2.clientX) / 2 - rect.left;
      const midY = (p1.clientY + p2.clientY) / 2 - rect.top;

      const worldPos = {
        x: (midX - app.stage.x) / app.stage.scale.x,
        y: (midY - app.stage.y) / app.stage.scale.y,
      };

      app.stage.scale.set(newScale);

      app.stage.x = midX - worldPos.x * newScale;
      app.stage.y = midY - worldPos.y * newScale;

      return;
    }

    // 🟢 PANNING
    if (!isPanning) return;

    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    app.stage.x = stageStart.x + dx;
    app.stage.y = stageStart.y + dy;
  };

  const onPointerUp = (e: PointerEvent) => {
    activePointers.delete(e.pointerId);

    if (activePointers.size < 2) {
      isPinching = false;
    }

    isPanning = false;
    canvas.style.cursor = "grab";
  };

  const onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
    const oldScale = app.stage.scale.x;
    const scaleBy = 1.08;
    const newScale = ev.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clamped = Math.max(0.25, Math.min(3, newScale));

    const rect = canvas.getBoundingClientRect();
    const pointer = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    const worldPos = { x: (pointer.x - app.stage.x) / oldScale, y: (pointer.y - app.stage.y) / oldScale };

    app.stage.scale.set(clamped);
    app.stage.x = pointer.x - worldPos.x * clamped;
    app.stage.y = pointer.y - worldPos.y * clamped;
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  

  // ================= RESIZE =================
  const onResize = () => {
    app.renderer.resize(container.clientWidth, container.clientHeight);

    const bounds = app.stage.getLocalBounds();
    const centerX = bounds.x + bounds.width / 2;
    app.stage.x = container.clientWidth / 2 - centerX * app.stage.scale.x;

    // Optional: enforce top padding
    const topWorldY = bounds.y * app.stage.scale.y + app.stage.y;
    if (topWorldY < STAGE_TOP_PADDING) {
      app.stage.y += STAGE_TOP_PADDING - topWorldY;
    }
    centerStage(app, containerRef.current);
  };

  window.addEventListener("resize", onResize);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("wheel", onWheel);
    window.removeEventListener("resize", onResize);

    canvas.removeEventListener("dblclick", onCanvasDoubleClick);
    document.removeEventListener("mousedown", onDocumentMouseDown);

    app.destroy(true, { children: true });
    appRef.current = null;
  };
}, []);

  // Additional Code for improvement ==============================================
    const memberMap = useMemo(() => {
    const map: Record<string, MemberRow> = {};
    members.forEach((m) => (map[m.id] = m));
    return map;
  }, [members]);

    const unionMemberSet = useMemo(() => {
    const set = new Set<string>();
    unionsDB.forEach(u => {
      set.add(u.partner_a);
      set.add(u.partner_b);
      });
      return set;
    }, [unionsDB]);

  const getParents = useCallback((id: string) => {
    const m = memberMap[id];
    if (!m) return [];
    return [m.father_id, m.mother_id].filter(Boolean) as string[];
  }, [memberMap]);

  const getAncestors = useCallback((id: string | null | undefined, visited = new Set<string>()): Set<string> => {
    if (!id || visited.has(id)) return visited;
    visited.add(id);
    getParents(id).forEach((p) => getAncestors(p, visited));
    return visited;
  }, [getParents]);

  const getChildren = useCallback((id: string) => {
    return members.filter(m => m.father_id === id || m.mother_id === id).map(m => m.id);
  }, [members]);

  const getDescendants = useCallback((id: string, visited = new Set<string>()): Set<string> => {
    if (!id || visited.has(id)) return visited;
    visited.add(id);
    const children = getChildren(id);
    children.forEach(childId => getDescendants(childId, visited));
    return visited;
  }, [getChildren]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
  
    app.stage.scale.set(1);
    app.stage.x = 0;
    app.stage.y = 0;
  
    app.stage.removeChildren();
    spritesRef.current = {};


  const makeNode = (m: MemberRow) => {
  const c = new PIXI.Container();
  c.eventMode = "static";
  c.cursor = "grab";
  c.sortableChildren = true;

  // ---------------------- Node Graphics ----------------------
  const roleColor = roleColors[m.role ?? "default"] ?? roleColors.default;

  // Outer glow
  const outer = new PIXI.Graphics();
  outer.beginFill(roleColor);
  outer.drawCircle(0, 0, NODE_RADIUS + 6);
  outer.endFill();
  outer.alpha = 0.08;
  c.addChild(outer);

  // Circle border
  const lines = new PIXI.Graphics();
  lines.beginFill(0xf7f7f7);
  lines.lineStyle(2, roleColor);
  lines.drawCircle(0, 0, NODE_RADIUS);
  lines.endFill();
  c.addChild(lines);

  // Avatar or plus
  if (m.avatar_url) {
    try {
      const sprite = PIXI.Sprite.from(m.avatar_url);
      sprite.anchor.set(0.5);
      sprite.width = NODE_RADIUS * 2;
      sprite.height = NODE_RADIUS * 2;
      const mask = new PIXI.Graphics();
      mask.beginFill(0x333333);
      mask.drawCircle(0, 0, NODE_RADIUS - 1);
      mask.endFill();
      c.addChild(sprite);
      c.addChild(mask);
      sprite.mask = mask;
    } catch {}
  } else {
    const plus = new PIXI.Text("+", { fontSize: 20, fill: 0x333333 });
    plus.anchor.set(0.5);
    c.addChild(plus);
  }

  // Name label
  const label = new PIXI.Text(m.name ?? "Unnamed", { fontSize: 16, fill: 0x333333, align: "center" });
  label.y = NODE_RADIUS + 8;
  label.anchor.set(0.5, 0);
  c.addChild(label);

  // Role label
  const roleLabel = new PIXI.Text(m.role ?? "", { fontSize: 12, fill: 0x333333, align: "center" });
  roleLabel.y = NODE_RADIUS + 22;
  roleLabel.anchor.set(0.5, -0.35);
  // c.addChild(roleLabel); // you can turn this on to see roles text

  // ---------------------- Dragging ----------------------
  let dragging = false;
  let moved = false;
  const dragOffset = { x: 0, y: 0 };

  // ⚠️ Add this: fixed nodes set
  const fixedNodeIds = new Set<string>(Object.keys(originalLayoutRef.current)); // all nodes initially fixed

  c.on("pointerdown", (ev) => {
  if (unionMemberSet.has(m.id)) return; // 🚫 hard block
  if (fixedNodeIds.has(m.id)) return; // 🚫 skip dragging fixed nodes
  ev.stopPropagation();
  dragging = true;
  moved = false;
  c.cursor = "grabbing";
  const p = ev.data.global;
  dragOffset.x = p.x - c.x;
  dragOffset.y = p.y - c.y;
});

c.on("pointermove", (ev) => {
  if (!dragging) return;

  const p = ev.data.global;
  moved = true;

  // Only allow drag if not fixed
  if (!fixedNodeIds.has(m.id)) {
    c.x = p.x - dragOffset.x;
    c.y = p.y - dragOffset.y;
  }
});

c.on("pointerup", async () => {
  if (!dragging) return;
  dragging = false;
  c.cursor = "grab";

  // Reset node to original position if fixed
  if (fixedNodeIds.has(m.id) && originalLayoutRef.current[m.id]) {
    const { x, y } = originalLayoutRef.current[m.id];
    gsap.to(c, { x, y, duration: 0.3, ease: "power2.out" });
  }

  if (!moved) return; // IMPORTANT: ignore click-only
});

  c.on("pointermove", (ev) => {
    if (!dragging) return;

    const p = ev.data.global;

    moved = true;
    c.x = p.x - dragOffset.x;
    c.y = p.y - dragOffset.y;
  });

  c.on("pointerupoutside", () => {
    dragging = false;
    c.cursor = "grab";
  });

  // ---------------------- Click / Double-Click ----------------------
  c.on("pointertap", (ev) => {
  ev.stopPropagation();

  const now = Date.now();
  const last = (c as unknown as { _lastTap?: number })._lastTap || 0;

  if (now - last < 300) {
    // Double click → EDIT
    isEditingRef.current = true;
    setEditing({ id: m.id });
    setEditName(m.name ?? "");
    setEditRole(m.role ?? "");
    setEditFile(null);
  } else {
    // Single click → highlight
    const lineage = new Set<string>();
    getAncestors(m.id, lineage);
    getDescendants(m.id, lineage);
    lineage.add(m.id);
    setHighlightBloodline(lineage);
  }

  (c as unknown as { _lastTap?: number })._lastTap = now;
});

  return c;
};

const SPOUSE_GAP = 90;
const unionMap = new Map<string, Union>();

unionsDB.forEach(u => {
  unionMap.set(u.id, {
    id: u.id,
    partnerIds: [u.partner_a, u.partner_b],
    childrenIds: members
    .filter(m =>
      (m.father_id === u.partner_a && m.mother_id === u.partner_b) ||
      (m.father_id === u.partner_b && m.mother_id === u.partner_a)
    )
    .map(c => c.id),
    side: u.left_partner === u.partner_a ? -1 : 1,
    gap: SPOUSE_GAP,
  });
});

  const unions = Array.from(unionMap.values());

  const persons: Person[] = members.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  // 4️⃣ Run layout engine
  const { persons: positioned, lines } = computeLayout(
    persons,
    unions,
  );

  // 5️⃣ Render nodes
  members.forEach((m) => {
    const node = makeNode(m);
    
    
    if (!node) return;
    
    const layoutNode = positioned.find((p) => p.id === m.id);
    
    if (layoutNode) {
      node.x = layoutNode.x;
      node.y = layoutNode.y;
    }

    if (layoutNode) {
      originalLayoutRef.current[m.id] = {
        x: layoutNode.x,
        y: layoutNode.y,
      };
    }
    
    node.alpha = 0;
    spritesRef.current[m.id] = node;
    app.stage.addChild(node);
    // Animate fade-in
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      if (node.alpha < 1) node.alpha += 0.05;
      else ticker.stop();
    });
    ticker.start();
  });

  // 6️⃣ Render lines
const lineGraphics = new PIXI.Graphics();
lineGraphics.zIndex = 0;

app.stage.addChild(lineGraphics);

// ------------------ CHILD / UNION LINES (existing layout lines) ------------------
lineGraphics.lineStyle(2, 0x94a3b8);

lines.forEach((l) => {
  lineGraphics.moveTo(l.x1, l.y1);
  lineGraphics.lineTo(l.x2, l.y2);
});

// ------------------ SPOUSE HORIZONTAL LINES ------------------
lineGraphics.lineStyle(2, 0x94a3b8);


// 5️⃣ Render UNION (marriage) nodes — AFTER members exist
unions.forEach(u => {
  const [aId, bId] = u.partnerIds;
  const a = spritesRef.current[aId];
  const b = spritesRef.current[bId];

  if (!a || !b) return;

  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;

  const unionNode = new PIXI.Graphics();
  unionNode.beginFill(0x94a3b8);
  unionNode.drawCircle(0, 0, 6);
  unionNode.endFill();
  unionNode.x = midX;
  unionNode.y = midY;

  app.stage.addChild(unionNode);
});

  app.stage.sortableChildren = true;
  lineGraphics.zIndex = 0; // behind nodes
  Object.values(spritesRef.current).forEach((node) => node.zIndex = 1); // nodes above lines

  // ✅ Center AFTER content exists
  if (positioned.length > 0) {
    const bounds = app.stage.getLocalBounds();

    const centerX = bounds.x + bounds.width / 2;
    app.stage.x =
      containerRef.current!.clientWidth / 2 -
      centerX * app.stage.scale.x;

    const topWorldY = bounds.y * app.stage.scale.y + app.stage.y;
    if (topWorldY < STAGE_TOP_PADDING) {
      app.stage.y += STAGE_TOP_PADDING - topWorldY;
    }
  }

  centerStage(app, containerRef.current);

  // ================= CAPTURE ORIGINAL VIEW (ONCE) =================
  if (!originalViewRef.current) {
    originalViewRef.current = {
      x: app.stage.x,
      y: app.stage.y,
      scale: app.stage.scale.x,
    };
  }
}, [members, unionsDB]);


useEffect(() => {
  const sprites = spritesRef.current;

  Object.entries(sprites).forEach(([id, container]) => {
    let badge = container.getChildByName("highlightBadge") as PIXI.Graphics | null;

    if (highlightBloodline.has(id)) {
      if (!badge) {
        badge = new PIXI.Graphics();
        badge.name = "highlightBadge";
        badge.beginFill(0xffd700, 0.6);
        badge.drawCircle(0, 0, NODE_RADIUS + 10);
        badge.endFill();
        container.addChildAt(badge, 0);
      }
      badge.visible = true;
    } else {
      if (badge) badge.visible = false;
    }
  });
}, [highlightBloodline]);

    const wouldCreateCycle = (
      potentialParentId: string,
      childId: string
    ) => {
      const ancestors = getAncestors(potentialParentId);
      return ancestors.has(childId);
    };

  const applyForceLayout = () => {
  const spacing = 80;

  Object.entries(spritesRef.current).forEach(([id, node]) => {
    const dx = (Math.random() - 0.5) * spacing;
    const dy = (Math.random() - 0.5) * spacing;

    const startX = node.x;
    const startY = node.y;

    const targetX = startX + dx;
    const targetY = startY + dy;

    const duration = 20;
    let frame = 0;

    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      frame++;
      const t = frame / duration;
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

      node.x = startX + (targetX - startX) * ease;
      node.y = startY + (targetY - startY) * ease;

      if (frame >= duration) ticker.stop();
    });
    ticker.start();
  });
};


  // HANDLE SAVE EDIT
const handleSaveEdit = async () => {
  if (!editing || !user) return;

  try {
    const member = members.find((m) => m.id === editing.id);
    if (!member) return alert("Member not found");

    let avatar_url: string | undefined;
    let avatar_path: string | undefined;

    if (editFile) {
      const ext = editFile.name.split(".").pop() || "png";
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, editFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      avatar_url = data?.publicUrl;
      avatar_path = filePath;
    }

    const updateFields: Partial<MemberRow> = {
      name: editName || member.name,
      role: editRole || member.role,
      ...(avatar_url ? { avatar_url, avatar_path } : {}),
    };

    const { error } = await supabase
      .from("family_members")
      .update(updateFields)
      .eq("id", editing.id);

    if (error) throw error;

    setEditing(null);
    setEditFile(null);
    isEditingRef.current = false;

    await loadMembers();
    setToastMessage("Member updated successfully!");
    setTimeout(() => setToastMessage(""), 2500);
  } catch (err: unknown) {
    if (err instanceof Error) alert(err.message);
    else console.error(err);
  }
};

// HANDLE DELETE MEMBER (SAFE VERSION)
const handleDeleteMember = async () => {
  if (!editing || !user) return;

  const member = members.find((m) => m.id === editing.id);
  if (!member) {
    showToast("Member not found.");
    return;
  }

  // 🚫 1️⃣ BLOCK DELETE IF MEMBER HAS CHILDREN
  const children = getChildren(member.id);
  if (children.length > 0) {
    showToast("Cannot delete a member who has children.");
    return;
  }

  // 🚫 2️⃣ Instead of window.confirm → open modal
  setDeleteConfirmOpen(true);
};

// ACTUAL DELETE EXECUTION (called from modal)
const executeDeleteMember = async () => {
  if (!editing || !user) return;

  try {
    const member = members.find((m) => m.id === editing.id);
    if (!member) {
      showToast("Member not found.");
      return;
    }

    // 🔴 Delete avatar
    if (member.avatar_path) {
      const { error: storageError } = await supabase.storage
        .from("avatars")
        .remove([member.avatar_path]);

      if (storageError) {
        console.warn("Avatar delete warning:", storageError.message);
      }
    }

    // 🔴 Delete unions
    const { error: unionError } = await supabase
      .from("family_unions")
      .delete()
      .or(`partner_a.eq.${editing.id},partner_b.eq.${editing.id}`);

    if (unionError) throw unionError;

    // 🔴 Delete member
    const { error: deleteError } = await supabase
      .from("family_members")
      .delete()
      .eq("id", editing.id);

    if (deleteError) throw deleteError;

    setDeleteConfirmOpen(false);
    setEditing(null);
    isEditingRef.current = false;

    await loadMembers();

    showToast("Member deleted successfully.", "success");
  } catch (err: unknown) {
    if (err instanceof Error) showToast(err.message);
    else showToast("Failed to delete member.");
  }
};

  // OPEN ADD MODAL
  const openAddModal = () => {
    setAddOpen(true);
    setAddName("");
    setAddRole("");
    setAddFile(null);
    setAddFather(null);
    setAddMother(null);
    setAddSpouse(null);
    setAddBirthDate(null);
    setAddDeathDate(null);
  };

  const showToast = (message: string, type: "success" | "error" = "error") => {
    setToastType(type);
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2500);
  };
// ---------------------- HANDLE CREATE MEMBER WITH SPOUSE & UNION ----------------------
const handleCreateMember = async () => {
  if (!user) {
    showToast("Please login.");
    return;
  }

  try {
    setTouchedName(true);
    setTouchedRole(true);
    setSubmitted(true);

    // ---------------- Basic Validation ----------------
    if (!addName.trim()) {
      showToast("Name is required.");
      return;
    }

    if (!addRole) {
      showToast("Role is required.");
      return;
    }

    const id = uuidv4();

    if (addFather === id || addMother === id) {
      showToast("Member cannot be their own parent.");
      return;
    }

    if (addFather && wouldCreateCycle(addFather, id)) {
      showToast("Circular ancestry detected (father).");
      return;
    }

    if (addMother && wouldCreateCycle(addMother, id)) {
      showToast("Circular ancestry detected (mother).");
      return;
    }

    if (
      (addFather && !memberMap[addFather]) ||
      (addMother && !memberMap[addMother])
    ) {
      showToast("Selected parent does not exist.");
      return;
    }

    // ---------------- Upload Avatar (if exists) ----------------
    let avatar_url: string | null = null;
    let avatar_path: string | null = null;

    if (addFile) {
      const ext = addFile.name.split(".").pop() || "png";
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, addFile, { upsert: true });

      if (uploadError) {
        showToast("Avatar upload failed.");
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatar_url = data?.publicUrl ?? null;
      avatar_path = filePath;
    }

    const unionExists = unionsDB.some(
      u =>
        (u.partner_a === addSpouse && u.partner_b === id) ||
        (u.partner_a === id && u.partner_b === addSpouse)
    );

    if (unionExists) {
      showToast("These two members are already spouses.");
      return;
    }
    // ---------------- Insert Member (ONLY ONCE) ----------------
    const memberInsert = {
      id,
      user_id: user.id,
      name: addName.trim(),
      role: addRole,
      father_id: addFather,
      mother_id: addMother,
      // pos_x: Math.round(Math.random() * 800 + 100),
      // pos_y: Math.round(Math.random() * 200 + 100),
      avatar_url,
      avatar_path,
      birth_date: addBirthDate ?? null,
      death_date: addDeathDate ?? null,
    };

    const { error: insertError } = await supabase
      .from("family_members")
      .insert([memberInsert]);

    if (insertError) {
      showToast("Failed to create member: " + insertError.message);
      return;
    }

    // ---------------- CREATE UNION (PERSISTED) ----------------
    if (addSpouse) {
      const spouse = memberMap[addSpouse];

      const maleRoles = new Set([
      "father",
      "son",
      "brother",
      "uncle",
      "grandfather",
      "nephew",
    ]);

    const femaleRoles = new Set([
      "mother",
      "daughter",
      "sister",
      "aunt",
      "grandmother",
      "niece",
    ]);

    const newIsMale = maleRoles.has(addRole);
    const newIsFemale = femaleRoles.has(addRole);

    const spouseIsMale = spouse && maleRoles.has(spouse.role ?? "");
    const spouseIsFemale = spouse && femaleRoles.has(spouse.role ?? "");

    // 🔒 HARD RULE:
    // female ALWAYS left, male ALWAYS right
    let leftPartner: string;

    if (newIsFemale && spouseIsMale) {
      leftPartner = id;
    } else if (spouseIsFemale && newIsMale) {
      leftPartner = addSpouse;
    } else if (newIsFemale) {
      leftPartner = id;
    } else if (spouseIsFemale) {
      leftPartner = addSpouse;
    } else {
      // deterministic fallback for unknown / neutral roles
      leftPartner = addSpouse;
    }

      const unionInsert = {
        id: uuidv4(),
        user_id: user.id,
        partner_a: addSpouse,
        partner_b: id,
        left_partner: leftPartner, // ✅ male always left
      };

      const { error: unionError } = await supabase
        .from("family_unions")
        .insert([unionInsert]);

      if (unionError) {
        showToast("Failed to create spouse union.");
        return;
      }
    }
    
    // ---------------- Success ----------------
    setAddOpen(false);
    setAddFile(null);
    await loadMembers();

    showToast("Member created successfully!", "success");

  } catch (err) {
    console.error(err);
    showToast("Unexpected error creating member.");
  }
};

  // =============== Reset View ==================
const resetView = () => {
  const app = appRef.current;
  const original = originalViewRef.current;
  const container = containerRef.current;
  if (!app || !original || !container) return;

  // 1️⃣ Capture target positions for nodes
  const targets: Record<string, { x: number; y: number }> = {};
  Object.entries(spritesRef.current).forEach(([id, node]) => {
    const originalNode = originalLayoutRef.current[id];
    if (!originalNode) return;
    targets[id] = { x: originalNode.x, y: originalNode.y };
  });

  // 2️⃣ Capture target stage position & scale
  const bounds = app.stage.getLocalBounds();

  const targetScale = original.scale;

  const centerX = bounds.x + bounds.width / 2;
  const targetStageX = container.clientWidth / 2 - centerX * targetScale;

  const topWorldY = bounds.y * targetScale + original.y;
  let targetStageY = original.y;
  if (topWorldY < STAGE_TOP_PADDING) {
    targetStageY += STAGE_TOP_PADDING - topWorldY;
  }

  // 3️⃣ Tween nodes
  Object.entries(targets).forEach(([id, pos]) => {
    const node = spritesRef.current[id];
    if (!node) return;
    gsap.to(node, { x: pos.x, y: pos.y, duration: 0.7, ease: "power2.out" });
  });

  // 4️⃣ Tween stage
  gsap.to(app.stage.scale, { x: targetScale, y: targetScale, duration: 0.7, ease: "power2.out" });
  gsap.to(app.stage, { x: targetStageX, y: targetStageY, duration: 0.7, ease: "power2.out", onUpdate: () => centerStage(app, containerRef.current) });
};

  return (
    <div className={styles.familyCanvasWrapper}>
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" onClick={resetView}>Reset view</button>
          <button
            type="button"
            onClick={async () => {
              const app = appRef.current;
              if (!app) return;

              const resolution = 2; // increase resolution
              const renderer = new PIXI.Renderer({
                width: app.renderer.width * resolution,
                height: app.renderer.height * resolution,
                resolution,
              });
              renderer.render(app.stage);

              const dataUrl = await renderer.extract.base64(app.stage);
              const a = document.createElement("a");
              a.href = dataUrl;
              a.download = `family-tree-${Date.now()}.png`;
              a.click();

              renderer.destroy();
            }}
          >
            Export PNG
          </button>
          {/* <button onClick={applyForceLayout}>Force Layout</button> */}
          <button type="button" onClick={openAddModal}>Add Member</button>
        </div>
        <div className={styles.nodeCount}>{loading ? "Loading…" : `Members: ${members.length}`}</div>
      </div>

      <div className={`${styles.canvasContainer} ${(editing || addOpen) ? styles.dimmed : ""}`} ref={containerRef} />

      {/* TOAST */}
      {toastMessage && (
        <div
          className={`${styles.toast} ${
            toastType === "success" ? styles.success : styles.error
          }`}
          role="alert"
        >
          {toastMessage}
        </div>
      )}

      {/* EDIT OVERLAY */}
      {editing && (
        <div className={styles.editOverlay}>
          <h3>Edit Member</h3>
          <label>
            Name
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required/>
          </label>
          <label>
            Role
            <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
              <option value="">Select role</option>
              {Object.keys(roleColors).map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </label>
          <label>
            Avatar
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setEditFile(file);

                if (file) {
                  setEditAvatarPreview(URL.createObjectURL(file));
                } else {
                  setEditAvatarPreview(null);
                }
              }}
              required
            />

            {editAvatarPreview && (
              <div className={styles.preview}>
                <Image
                  className={styles.avatarPreviewer}
                  src={editAvatarPreview}
                  alt="Avatar preview"
                  width={80}
                  height={80}
                  unoptimized
                />
              </div>
            )}
          </label>
          <div className={styles.editButtons}>
            <div className={styles.cancelDeleteButton}>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setEditFile(null);
                  isEditingRef.current = false;
                }}
              >
                Cancel
              </button>
              <button type="button" onClick={handleDeleteMember}>
                Delete
              </button>
            </div>
            <button className={styles.longButton} type="button" onClick={handleSaveEdit}>Save</button>
          </div>
        </div>
      )}

      {/* ADD OVERLAY */}
    {addOpen && (
      <div className={styles.addOverlay}>
        <h3>Add Member</h3>

  <div className={styles.memberDetails}>
    <div className={styles.bio}>
      {/* Name */}
      <label>
        Name
        <input
          type="text"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          onBlur={() => setTouchedName(true)}
          required
          autoFocus
        />
      </label>

      {/* Role */}
      <label>
        Role
        <select
          value={addRole}
          onChange={(e) => setAddRole(e.target.value)}
          onBlur={() => setTouchedRole(true)}
          required
        >
          <option value="">None</option>
          {Object.keys(roleColors).map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </label>

      {/* Father */}
      <label>
        Father
        <select
          value={addFather ?? ""}
          onChange={(e) => setAddFather(e.target.value || null)}
        >
          <option value="">None</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      {/* Mother */}
      <label>
        Mother
        <select
          value={addMother ?? ""}
          onChange={(e) => setAddMother(e.target.value || null)}
        >
          <option value="">None</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      {/* Spouse */}
      <label>
        Spouse
        <select
        value={addSpouse ?? ""}
        onChange={(e) => setAddSpouse(e.target.value || null)}
      >
      <option value="">None</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      </label>
    </div>
    <div className={styles.dateInfo}>
      {/* Birthdate */}
      <label>
        Birthdate
        <input
          type="date"
          value={addBirthDate ?? ""}
          onChange={(e) => setAddBirthDate(e.target.value || null)}
        />
      </label>

      {/* Deathdate */}
      <label>
        Deathdate
        <input
          type="date"
          value={addDeathDate ?? ""}
          onChange={(e) => setAddDeathDate(e.target.value || null)}
        />
      </label>

      {/* Avatar */}
      {/* <label>
        Avatar
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
        />
      </label> */}
      {/* Avatar */}
      <label>
        Avatar
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setAddFile(file);

            if (file) {
              setAvatarPreview(URL.createObjectURL(file));
            } else {
              setAvatarPreview(null);
            }
          }}
        />

        {avatarPreview && (
          <div className={styles.preview}>
            <Image
              className={styles.avatarPreviewer}
              src={avatarPreview}
              alt="Avatar preview"
              width={80}
              height={80}
              unoptimized
            />
          </div>
        )}
      </label>
    </div>

  </div>

    {/* Buttons */}
    <div className={styles.editButtons}>
      <button onClick={() => setAddOpen(false)}>Cancel</button>
      <button className={styles.longButton} onClick={handleCreateMember}>
        Create
      </button>
    </div>
  </div>
)}
{/* DELETE CONFIRMATION OVERLAY */}
{deleteConfirmOpen && (
  <div className={styles.editOverlay}>
    <h3>Confirm Deletion</h3>
    <p>
      Are you sure you want to delete this member? This action cannot be undone.
    </p>

    <div className={styles.editButtons}>
      <button type="button" onClick={() => setDeleteConfirmOpen(false)}>
        Cancel
      </button>
      <button
        type="button"
        onClick={executeDeleteMember}
      >
        Delete
      </button>
    </div>
  </div>
)}
    </div>
  );
}
// function computeTopClampedStageY(app: PIXI.Application<PIXI.ICanvas>): number {
//   const bounds = app.stage.getLocalBounds();
//   const topWorldY = bounds.y * app.stage.scale.y + app.stage.y;
//   const minAllowedTop = STAGE_TOP_PADDING;

//   if (topWorldY < minAllowedTop) {
//     return app.stage.y + (minAllowedTop - topWorldY);
//   }

//   return app.stage.y;
// }

// function computeCenteredStageX(app: PIXI.Application): number {
//   const bounds = app.stage.getLocalBounds();
//   const centerX = bounds.x + bounds.width / 2;
//   return app.renderer.width / 2 - centerX * app.stage.scale.x;
// }

// function centerStage(app: PIXI.Application<PIXI.ICanvas>) {
//   throw new Error("Function not implemented.");
// }

function centerStage(
  app: PIXI.Application,
  container: HTMLDivElement | null
) {
  if (!container) return;

  const bounds = app.stage.getLocalBounds();

  // Horizontal center
  const centerX = bounds.x + bounds.width / 2;
  app.stage.x = container.clientWidth / 2 - centerX * app.stage.scale.x;

  // Top padding enforcement
  const topWorldY = bounds.y * app.stage.scale.y + app.stage.y;
  if (topWorldY < STAGE_TOP_PADDING) {
    app.stage.y += STAGE_TOP_PADDING - topWorldY;
  }
}