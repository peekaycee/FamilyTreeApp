"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import styles from "./components.module.css";

export type MemberRow = {
  id: string;
  user_id?: string | null;
  name: string;
  role?: string | null;
  father_id?: string | null;
  mother_id?: string | null;
  spouse_id?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  created_at?: string | null;
};

type EditingState = { id: string };

const NODE_RADIUS = 36;

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
  default: 0xe2e8f0,
};

export default function FamilyCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spritesRef = useRef<Record<string, PIXI.Container>>({});
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Editing modal state
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

  // Add member modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addFather, setAddFather] = useState<string | null>(null);
  const [addMother, setAddMother] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState("");

  // REF to block realtime reloads while editing
  const isEditingRef = useRef(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const enriched = await Promise.all(
        rows.map(async (r: MemberRow) => {
          if (!r.avatar_url && r.avatar_path) {
            try {
              const { data: pu } = supabase.storage
                .from("avatars")
                .getPublicUrl(r.avatar_path);
              if (pu?.publicUrl) r.avatar_url = pu.publicUrl;
            } catch {}
          }
          return r;
        })
      );
      setMembers(enriched);
    } catch (err) {
      console.error("fetchMembers", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // AUTH SESSION
  useEffect(() => {
    const init = async () => {
      try {
        const saved = localStorage.getItem("supabase_session");
        if (saved) {
          const session = JSON.parse(saved);
          await supabase.auth.setSession(session);
          setUser(session?.user ?? null);
        } else {
          const { data } = await supabase.auth.getUser();
          setUser(data.user ?? null);
        }
      } catch (err) {
        console.warn("session restore", err);
      }
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session) localStorage.setItem("supabase_session", JSON.stringify(session));
      else localStorage.removeItem("supabase_session");
    });
    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  // Fetch members & subscribe to realtime
  useEffect(() => {
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
  }, [loadMembers]);

  // CREATE PIXI APP
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: Math.max(window.innerWidth - 40, 900),
      height: Math.max(window.innerHeight - 220, 600),
      backgroundColor: 0x071025,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    appRef.current = app;
    containerRef.current.appendChild(app.view);
    app.view.style.cursor = "grab";

    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let stageStart = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY };
      stageStart = { x: app.stage.x, y: app.stage.y };
      app.view.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      app.stage.x = stageStart.x + dx;
      app.stage.y = stageStart.y + dy;
    };
    const onPointerUp = () => {
      isPanning = false;
      app.view.style.cursor = "grab";
    };
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const oldScale = app.stage.scale.x;
      const scaleBy = 1.08;
      const newScale = ev.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clamped = Math.max(0.25, Math.min(3, newScale));
      const rect = app.view.getBoundingClientRect();
      const pointer = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      const worldPos = { x: (pointer.x - app.stage.x) / oldScale, y: (pointer.y - app.stage.y) / oldScale };
      app.stage.scale.set(clamped);
      app.stage.x = pointer.x - worldPos.x * clamped;
      app.stage.y = pointer.y - worldPos.y * clamped;
    };

    app.view.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    app.view.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      app.view.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      app.view.removeEventListener("wheel", onWheel);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);

  // DRAW NODES
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    app.stage.removeChildren();
    spritesRef.current = {};

    const makeNode = (m: MemberRow) => {
      const c = new PIXI.Container();
      c.interactive = true;
      c.cursor = "grab";
      c.x = m.pos_x ?? Math.random() * 800 + 100;
      c.y = m.pos_y ?? Math.random() * 200 + 100;
      c.sortableChildren = true;

      const roleColor = roleColors[m.role ?? "default"] ?? roleColors.default;
      const outer = new PIXI.Graphics();
      outer.beginFill(roleColor);
      outer.drawCircle(0, 0, NODE_RADIUS + 6);
      outer.endFill();
      outer.alpha = 0.08;
      c.addChild(outer);

      const g = new PIXI.Graphics();
      g.beginFill(0x071028);
      g.lineStyle(2, roleColor);
      g.drawCircle(0, 0, NODE_RADIUS);
      g.endFill();
      c.addChild(g);

      if (m.avatar_url) {
        try {
          const sprite = PIXI.Sprite.from(m.avatar_url);
          sprite.anchor.set(0.5);
          sprite.width = NODE_RADIUS * 2;
          sprite.height = NODE_RADIUS * 2;
          const mask = new PIXI.Graphics();
          mask.beginFill(0xffffff);
          mask.drawCircle(0, 0, NODE_RADIUS - 1);
          mask.endFill();
          c.addChild(sprite);
          c.addChild(mask);
          sprite.mask = mask;
        } catch {}
      } else {
        const plus = new PIXI.Text("+", { fontSize: 20, fill: 0xffffff });
        plus.anchor.set(0.5);
        c.addChild(plus);
      }

      const label = new PIXI.Text(m.name ?? "Unnamed", { fontSize: 12, fill: 0xffffff, align: "center" });
      label.y = NODE_RADIUS + 8;
      label.anchor.set(0.5, 0);
      c.addChild(label);

      const roleLabel = new PIXI.Text(m.role ?? "", { fontSize: 10, fill: 0x94a3b8, align: "center" });
      roleLabel.y = NODE_RADIUS + 22;
      roleLabel.anchor.set(0.5, 0);
      c.addChild(roleLabel);

      let dragging = false;
      let dragOffset = { x: 0, y: 0 };
      c.on("pointerdown", (ev) => {
        ev.stopPropagation();
        dragging = true;
        c.cursor = "grabbing";
        const p = ev.data.global;
        dragOffset = { x: p.x - c.x, y: p.y - c.y };
      });

      c.on("pointerup", async () => {
        dragging = false;
        c.cursor = "grab";
        await supabase
          .from("family_members")
          .update({ pos_x: Math.round(c.x), pos_y: Math.round(c.y) })
          .eq("id", m.id);
      });

      c.on("pointerupoutside", () => {
        dragging = false;
        c.cursor = "grab";
      });

      c.on("pointermove", (ev) => {
        if (!dragging) return;
        const p = ev.data.global;
        c.x = p.x - dragOffset.x;
        c.y = p.y - dragOffset.y;
      });

      c.on("pointertap", () => {
        const now = Date.now();
        type ClickableContainer = PIXI.Container & { __lastClick?: number };
        const clickableC = c as ClickableContainer;
        const last = clickableC.__lastClick ?? 0;
        clickableC.__lastClick = now;
        if (now - last < 300) {
          setEditing({ id: m.id });
          setEditName(m.name ?? "");
          setEditRole(m.role ?? "");
          setEditFile(null);
          isEditingRef.current = true;
        }
      });

      return c;
    };

    members.forEach((m) => {
      const node = makeNode(m);
      spritesRef.current[m.id] = node;
      app.stage.addChild(node);
    });

    // DRAW LINES
    const layer = new PIXI.Container();
    members.forEach((child) => {
      const childNode = spritesRef.current[child.id];
      if (!childNode) return;
      const { father_id, mother_id } = child;
      const cpt = { x: childNode.x, y: childNode.y };
      if (father_id && spritesRef.current[father_id]) {
        const p = spritesRef.current[father_id];
        const g = new PIXI.Graphics();
        g.lineStyle(2, 0x94a3b8);
        g.moveTo(p.x, p.y);
        g.lineTo(cpt.x, cpt.y);
        layer.addChild(g);
      }
      if (mother_id && spritesRef.current[mother_id]) {
        const p = spritesRef.current[mother_id];
        const g = new PIXI.Graphics();
        g.lineStyle(2, 0x94a3b8);
        g.moveTo(p.x, p.y);
        g.lineTo(cpt.x, cpt.y);
        layer.addChild(g);
      }
    });
    app.stage.addChild(layer);
  }, [members]);

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


  // OPEN ADD MODAL
  const openAddModal = () => {
    setAddOpen(true);
    setAddName("");
    setAddRole("");
    setAddFile(null);
    setAddFather(null);
    setAddMother(null);
  };

  // HANDLE CREATE MEMBER WITH PARENT PICKER
  const handleCreateMember = async () => {
    if (!user) return alert("please login");
    try {
      const id = uuidv4();
      let avatar_url: string | undefined;
      let avatar_path: string | undefined;
      if (addFile) {
        const ext = addFile.name.split(".").pop() || "png";
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, addFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatar_url = data?.publicUrl;
        avatar_path = filePath;
      }

      const row: Partial<MemberRow> = {
        id,
        user_id: user.id,
        name: addName || "New member",
        role: addRole || "",
        father_id: addFather,
        mother_id: addMother,
        pos_x: Math.round(Math.random() * 800 + 100),
        pos_y: Math.round(Math.random() * 200 + 100),
        avatar_url: avatar_url ?? null,
        avatar_path: avatar_path ?? null,
      };

      const { error } = await supabase.from("family_members").insert([row]);
      if (error) throw error;

      setAddOpen(false);
      setAddFile(null);
      await loadMembers();
      setToastMessage("Member created successfully!");
      setTimeout(() => setToastMessage(""), 2500);
    } catch (err: unknown) {
      console.error("addMember error", err);
      if (err instanceof Error) alert(err.message);
    }
  };

  const resetView = () => {
    const app = appRef.current;
    if (!app) return;
    app.stage.x = 0;
    app.stage.y = 0;
    app.stage.scale.set(1);
  };

  return (
    <div className={styles.familyCanvasWrapper}>
      <div className={styles.controls}>
        <button onClick={resetView}>Reset view</button>
        <button
          onClick={() => {
            const app = appRef.current;
            if (!app) return;
            const dataUrl = app.renderer.extract.base64(app.stage);
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `family-tree-${Date.now()}.png`;
            a.click();
          }}
        >
          Export PNG
        </button>
        <button onClick={openAddModal}>Add Member</button>
        <div className={styles.nodeCount}>{loading ? "Loading…" : `Nodes: ${members.length}`}</div>
      </div>

      <div className={`${styles.canvasContainer} ${(editing || addOpen) ? styles.dimmed : ""}`} ref={containerRef} />

      {/* TOAST */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

      {/* EDIT OVERLAY */}
      {editing && (
        <div className={styles.editOverlay}>
          <h3>Edit member</h3>
          <label>
            Name
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
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
            <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className={styles.editButtons}>
            <button
              onClick={() => {
                setEditing(null);
                setEditFile(null);
                isEditingRef.current = false;
              }}
            >
              Cancel
            </button>
            <button onClick={handleSaveEdit}>Save</button>
          </div>
        </div>
      )}

      {/* ADD OVERLAY */}
      {addOpen && (
        <div className={styles.addOverlay}>
          <h3>Add member</h3>
          <label>
            Name
            <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} />
          </label>
          <label>
            Role
            <select value={addRole} onChange={(e) => setAddRole(e.target.value)}>
              <option value="">Select role</option>
              {Object.keys(roleColors).map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </label>
          {/* <label>
            Father
            <select value={addFather ?? ""} onChange={(e) => setAddFather(e.target.value || null)}>
              <option value="">None</option>
              {members.filter((m) => m.role?.toLowerCase() === "father").map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
          <label>
            Mother
            <select value={addMother ?? ""} onChange={(e) => setAddMother(e.target.value || null)}>
              <option value="">None</option>
              {members.filter((m) => m.role?.toLowerCase() === "mother").map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label> */}
          <label>
            Avatar
            <input type="file" accept="image/*" onChange={(e) => setAddFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className={styles.editButtons}>
            <button onClick={() => setAddOpen(false)}>Cancel</button>
            <button onClick={handleCreateMember}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
