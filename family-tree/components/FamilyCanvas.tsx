// "use client";

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import * as PIXI from "pixi.js";
// import { v4 as uuidv4 } from "uuid";
// import { supabase } from "../lib/supabaseClient";
// import { User } from "@supabase/supabase-js";
// import styles from "./components.module.css";

// export type MemberRow = {
//   id: string;
//   user_id?: string | null;
//   name: string;
//   role?: string | null;
//   father_id?: string | null;
//   mother_id?: string | null;
//   spouse_id?: string | null;
//   pos_x?: number | null;
//   pos_y?: number | null;
//   avatar_url?: string | null;
//   avatar_path?: string | null;
//   created_at?: string | null;
// };

// type EditingState = { id: string };

// const NODE_RADIUS = 36;

// // Map roles to colors/icons
// const roleColors: Record<string, number> = {
//   grandfather: 0x8b5cf6,
//   grandmother: 0xfb7185,
//   father: 0x1e90ff,
//   mother: 0xf59e0b,
//   son: 0x34d399,
//   daughter: 0x60a5fa,
//   uncle: 0xf97316,
//   aunt: 0xec4899,
//   brother: 0x06b6d4,
//   sister: 0xf472b6,
//   cousin: 0xa78bfa,
//   nephew: 0x60a5fa,
//   niece: 0xfaa2c1,
//   default: 0xe2e8f0,
// };

// export default function FamilyCanvas() {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const appRef = useRef<PIXI.Application | null>(null);
//   const spritesRef = useRef<Record<string, PIXI.Container>>({});
//   const [members, setMembers] = useState<MemberRow[]>([]);
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);

//   // Editing modal state
//   const [editing, setEditing] = useState<EditingState | null>(null);
//   const [editName, setEditName] = useState("");
//   const [editRole, setEditRole] = useState("");
//   const [editFile, setEditFile] = useState<File | null>(null);

//   // Add member modal state
//   const [addOpen, setAddOpen] = useState(false);
//   const [addName, setAddName] = useState("");
//   const [addRole, setAddRole] = useState("");
//   const [addFile, setAddFile] = useState<File | null>(null);
//   const [addFather, setAddFather] = useState<string | null>(null);
//   const [addMother, setAddMother] = useState<string | null>(null);

//   // Toast state
//   const [toastMessage, setToastMessage] = useState("");

//   // REF to block realtime reloads while editing
//   const isEditingRef = useRef(false);

//   const loadMembers = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from("family_members")
//         .select("*")
//         .order("created_at", { ascending: true });
//       if (error) throw error;
//       const rows = Array.isArray(data) ? data : [];
//       const enriched = await Promise.all(
//         rows.map(async (r: MemberRow) => {
//           if (!r.avatar_url && r.avatar_path) {
//             try {
//               const { data: pu } = supabase.storage
//                 .from("avatars")
//                 .getPublicUrl(r.avatar_path);
//               if (pu?.publicUrl) r.avatar_url = pu.publicUrl;
//             } catch {}
//           }
//           return r;
//         })
//       );
//       setMembers(enriched);
//     } catch (err) {
//       console.error("fetchMembers", err);
//       setMembers([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // AUTH SESSION
//   useEffect(() => {
//     const init = async () => {
//       try {
//         const saved = localStorage.getItem("supabase_session");
//         if (saved) {
//           const session = JSON.parse(saved);
//           await supabase.auth.setSession(session);
//           setUser(session?.user ?? null);
//         } else {
//           const { data } = await supabase.auth.getUser();
//           setUser(data.user ?? null);
//         }
//       } catch (err) {
//         console.warn("session restore", err);
//       }
//     };
//     init();
//     const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
//       setUser(session?.user ?? null);
//       if (session) localStorage.setItem("supabase_session", JSON.stringify(session));
//       else localStorage.removeItem("supabase_session");
//     });
//     return () => listener?.subscription?.unsubscribe?.();
//   }, []);

//   // Fetch members & subscribe to realtime
//   useEffect(() => {
//     loadMembers();
//     const ch = supabase
//       .channel("family-members-channel")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "family_members" },
//         () => {
//           if (!isEditingRef.current) loadMembers();
//         }
//       )
//       .subscribe();
//     return () => void supabase.removeChannel(ch);
//   }, [loadMembers]);

//   // CREATE PIXI APP
//   useEffect(() => {
//     if (!containerRef.current) return;

//     const app = new PIXI.Application({
//       width: Math.max(window.innerWidth - 40, 900),
//       height: Math.max(window.innerHeight - 220, 600),
//       backgroundColor: 0x071025,
//       antialias: true,
//       resolution: window.devicePixelRatio || 1,
//       autoDensity: true,
//     });
//     appRef.current = app;
//     containerRef.current!.appendChild(app.view as unknown as HTMLCanvasElement);
//     (app.view as HTMLCanvasElement).style.cursor = "grab";

//     let isPanning = false;
//     let panStart = { x: 0, y: 0 };
//     let stageStart = { x: 0, y: 0 };

//     const onPointerDown = (e: PointerEvent) => {
//       isPanning = true;
//       panStart = { x: e.clientX, y: e.clientY };
//       stageStart = { x: app.stage.x, y: app.stage.y };
//       (app.view as HTMLCanvasElement).style.cursor = "grabbing";
//     };

//     const onPointerMove = (e: PointerEvent) => {
//       if (!isPanning) return;
//       const dx = e.clientX - panStart.x;
//       const dy = e.clientY - panStart.y;
//       app.stage.x = stageStart.x + dx;
//       app.stage.y = stageStart.y + dy;
//     };
//     const onPointerUp = () => {
//       isPanning = false;
//       (app.view as HTMLCanvasElement).style.cursor = "grab";
//     };
//     const onWheel = (ev: WheelEvent) => {
//       ev.preventDefault();
//       const oldScale = app.stage.scale.x;
//       const scaleBy = 1.08;
//       const newScale = ev.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
//       const clamped = Math.max(0.25, Math.min(3, newScale));
//       const rect = (app.view as HTMLCanvasElement).getBoundingClientRect();
//       const pointer = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
//       const worldPos = { x: (pointer.x - app.stage.x) / oldScale, y: (pointer.y - app.stage.y) / oldScale };
//       app.stage.scale.set(clamped);
//       app.stage.x = pointer.x - worldPos.x * clamped;
//       app.stage.y = pointer.y - worldPos.y * clamped;
//     };

//     (app.view as HTMLCanvasElement).addEventListener("pointerdown", onPointerDown);
//     window.addEventListener("pointermove", onPointerMove);
//     window.addEventListener("pointerup", onPointerUp);
//     (app.view as HTMLCanvasElement).addEventListener("wheel", onWheel, { passive: false });

//     return () => {
//       (app.view as HTMLCanvasElement).removeEventListener("pointerdown", onPointerDown);
//       window.removeEventListener("pointermove", onPointerMove);
//       window.removeEventListener("pointerup", onPointerUp);
//       (app.view as HTMLCanvasElement).removeEventListener("wheel", onWheel);
//       app.destroy(true, { children: true });
//       appRef.current = null;
//     };
//   }, []);

//   // DRAW NODES
//   useEffect(() => {
//     const app = appRef.current;
//     if (!app) return;

//     app.stage.removeChildren();
//     spritesRef.current = {};

//     const makeNode = (m: MemberRow) => {
//       const c = new PIXI.Container();
//       c.interactive = true;
//       c.cursor = "grab";
//       c.x = m.pos_x ?? Math.random() * 800 + 100;
//       c.y = m.pos_y ?? Math.random() * 200 + 100;
//       c.sortableChildren = true;

//       const roleColor = roleColors[m.role ?? "default"] ?? roleColors.default;
//       const outer = new PIXI.Graphics();
//       outer.beginFill(roleColor);
//       outer.drawCircle(0, 0, NODE_RADIUS + 6);
//       outer.endFill();
//       outer.alpha = 0.08;
//       c.addChild(outer);

//       const g = new PIXI.Graphics();
//       g.beginFill(0x071028);
//       g.lineStyle(2, roleColor);
//       g.drawCircle(0, 0, NODE_RADIUS);
//       g.endFill();
//       c.addChild(g);

//       if (m.avatar_url) {
//         try {
//           const sprite = PIXI.Sprite.from(m.avatar_url);
//           sprite.anchor.set(0.5);
//           sprite.width = NODE_RADIUS * 2;
//           sprite.height = NODE_RADIUS * 2;
//           const mask = new PIXI.Graphics();
//           mask.beginFill(0xffffff);
//           mask.drawCircle(0, 0, NODE_RADIUS - 1);
//           mask.endFill();
//           c.addChild(sprite);
//           c.addChild(mask);
//           sprite.mask = mask;
//         } catch {}
//       } else {
//         const plus = new PIXI.Text("+", { fontSize: 20, fill: 0xffffff });
//         plus.anchor.set(0.5);
//         c.addChild(plus);
//       }

//       const label = new PIXI.Text(m.name ?? "Unnamed", { fontSize: 12, fill: 0xffffff, align: "center" });
//       label.y = NODE_RADIUS + 8;
//       label.anchor.set(0.5, 0);
//       c.addChild(label);

//       const roleLabel = new PIXI.Text(m.role ?? "", { fontSize: 10, fill: 0x94a3b8, align: "center" });
//       roleLabel.y = NODE_RADIUS + 22;
//       roleLabel.anchor.set(0.5, 0);
//       c.addChild(roleLabel);

//       let dragging = false;
//       let dragOffset = { x: 0, y: 0 };
//       c.on("pointerdown", (ev) => {
//         ev.stopPropagation();
//         dragging = true;
//         c.cursor = "grabbing";
//         const p = ev.data.global;
//         dragOffset = { x: p.x - c.x, y: p.y - c.y };
//       });

//       c.on("pointerup", async () => {
//         dragging = false;
//         c.cursor = "grab";
//         await supabase
//           .from("family_members")
//           .update({ pos_x: Math.round(c.x), pos_y: Math.round(c.y) })
//           .eq("id", m.id);
//       });

//       c.on("pointerupoutside", () => {
//         dragging = false;
//         c.cursor = "grab";
//       });

//       c.on("pointermove", (ev) => {
//         if (!dragging) return;
//         const p = ev.data.global;
//         c.x = p.x - dragOffset.x;
//         c.y = p.y - dragOffset.y;
//       });

//       c.on("pointertap", () => {
//         const now = Date.now();
//         type ClickableContainer = PIXI.Container & { __lastClick?: number };
//         const clickableC = c as ClickableContainer;
//         const last = clickableC.__lastClick ?? 0;
//         clickableC.__lastClick = now;
//         if (now - last < 300) {
//           setEditing({ id: m.id });
//           setEditName(m.name ?? "");
//           setEditRole(m.role ?? "");
//           setEditFile(null);
//           isEditingRef.current = true;
//         }
//       });

//       return c;
//     };

//     members.forEach((m) => {
//       const node = makeNode(m);
//       spritesRef.current[m.id] = node;
//       app.stage.addChild(node);
//     });

//     // DRAW LINES
//     const layer = new PIXI.Container();
//     members.forEach((child) => {
//       const childNode = spritesRef.current[child.id];
//       if (!childNode) return;
//       const { father_id, mother_id } = child;
//       const cpt = { x: childNode.x, y: childNode.y };
//       if (father_id && spritesRef.current[father_id]) {
//         const p = spritesRef.current[father_id];
//         const g = new PIXI.Graphics();
//         g.lineStyle(2, 0x94a3b8);
//         g.moveTo(p.x, p.y);
//         g.lineTo(cpt.x, cpt.y);
//         layer.addChild(g);
//       }
//       if (mother_id && spritesRef.current[mother_id]) {
//         const p = spritesRef.current[mother_id];
//         const g = new PIXI.Graphics();
//         g.lineStyle(2, 0x94a3b8);
//         g.moveTo(p.x, p.y);
//         g.lineTo(cpt.x, cpt.y);
//         layer.addChild(g);
//       }
//     });
//     app.stage.addChild(layer);
//   }, [members]);

//   // HANDLE SAVE EDIT
// const handleSaveEdit = async () => {
//   if (!editing || !user) return;

//   try {
//     const member = members.find((m) => m.id === editing.id);
//     if (!member) return alert("Member not found");

//     let avatar_url: string | undefined;
//     let avatar_path: string | undefined;

//     if (editFile) {
//       const ext = editFile.name.split(".").pop() || "png";
//       const fileName = `${user.id}-${Date.now()}.${ext}`;
//       const filePath = `${user.id}/${fileName}`;
//       const { error: uploadError } = await supabase.storage
//         .from("avatars")
//         .upload(filePath, editFile, { upsert: true });
//       if (uploadError) throw uploadError;

//       const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
//       avatar_url = data?.publicUrl;
//       avatar_path = filePath;
//     }

//     const updateFields: Partial<MemberRow> = {
//       name: editName || member.name,
//       role: editRole || member.role,
//       ...(avatar_url ? { avatar_url, avatar_path } : {}),
//     };

//     const { error } = await supabase
//       .from("family_members")
//       .update(updateFields)
//       .eq("id", editing.id);

//     if (error) throw error;

//     setEditing(null);
//     setEditFile(null);
//     isEditingRef.current = false;

//     await loadMembers();
//     setToastMessage("Member updated successfully!");
//     setTimeout(() => setToastMessage(""), 2500);
//   } catch (err: unknown) {
//     if (err instanceof Error) alert(err.message);
//     else console.error(err);
//   }
// };


//   // OPEN ADD MODAL
//   const openAddModal = () => {
//     setAddOpen(true);
//     setAddName("");
//     setAddRole("");
//     setAddFile(null);
//     setAddFather(null);
//     setAddMother(null);
//   };

//   // HANDLE CREATE MEMBER WITH PARENT PICKER
//   const handleCreateMember = async () => {
//     if (!user) return alert("please login");
//     try {
//       const id = uuidv4();
//       let avatar_url: string | undefined;
//       let avatar_path: string | undefined;
//       if (addFile) {
//         const ext = addFile.name.split(".").pop() || "png";
//         const fileName = `${user.id}-${Date.now()}.${ext}`;
//         const filePath = `${user.id}/${fileName}`;
//         const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, addFile, { upsert: true });
//         if (uploadError) throw uploadError;
//         const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
//         avatar_url = data?.publicUrl;
//         avatar_path = filePath;
//       }

//       const row: Partial<MemberRow> = {
//         id,
//         user_id: user.id,
//         name: addName || "New member",
//         role: addRole || "",
//         father_id: addFather,
//         mother_id: addMother,
//         pos_x: Math.round(Math.random() * 800 + 100),
//         pos_y: Math.round(Math.random() * 200 + 100),
//         avatar_url: avatar_url ?? null,
//         avatar_path: avatar_path ?? null,
//       };

//       const { error } = await supabase.from("family_members").insert([row]);
//       if (error) throw error;

//       setAddOpen(false);
//       setAddFile(null);
//       await loadMembers();
//       setToastMessage("Member created successfully!");
//       setTimeout(() => setToastMessage(""), 2500);
//     } catch (err: unknown) {
//       console.error("addMember error", err);
//       if (err instanceof Error) alert(err.message);
//     }
//   };

//   const resetView = () => {
//     const app = appRef.current;
//     if (!app) return;
//     app.stage.x = 0;
//     app.stage.y = 0;
//     app.stage.scale.set(1);
//   };

//   return (
//     <div className={styles.familyCanvasWrapper}>
//       <div className={styles.controls}>
//         <button onClick={resetView}>Reset view</button>
//         <button
//           onClick={async () => {
//             const app = appRef.current;
//             if (!app) return;
//             const dataUrl = await app.renderer.extract.base64(app.stage);
//             const a = document.createElement("a");
//             a.href = dataUrl;
//             a.download = `family-tree-${Date.now()}.png`;
//             a.click();
//           }}
//         >
//           Export PNG
//         </button>
//         <button onClick={openAddModal}>Add Member</button>
//         <div className={styles.nodeCount}>{loading ? "Loading…" : `Nodes: ${members.length}`}</div>
//       </div>

//       <div className={`${styles.canvasContainer} ${(editing || addOpen) ? styles.dimmed : ""}`} ref={containerRef} />

//       {/* TOAST */}
//       {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

//       {/* EDIT OVERLAY */}
//       {editing && (
//         <div className={styles.editOverlay}>
//           <h3>Edit member</h3>
//           <label>
//             Name
//             <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
//           </label>
//           <label>
//             Role
//             <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
//               <option value="">Select role</option>
//               {Object.keys(roleColors).map((r) => (
//                 <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
//               ))}
//             </select>
//           </label>
//           <label>
//             Avatar
//             <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
//           </label>
//           <div className={styles.editButtons}>
//             <button
//               onClick={() => {
//                 setEditing(null);
//                 setEditFile(null);
//                 isEditingRef.current = false;
//               }}
//             >
//               Cancel
//             </button>
//             <button onClick={handleSaveEdit}>Save</button>
//           </div>
//         </div>
//       )}

//       {/* ADD OVERLAY */}
//       {addOpen && (
//         <div className={styles.addOverlay}>
//           <h3>Add member</h3>
//           <label>
//             Name
//             <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} />
//           </label>
//           <label>
//             Role
//             <select value={addRole} onChange={(e) => setAddRole(e.target.value)}>
//               <option value="">Select role</option>
//               {Object.keys(roleColors).map((r) => (
//                 <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
//               ))}
//             </select>
//           </label>
//           {/* <label>
//             Father
//             <select value={addFather ?? ""} onChange={(e) => setAddFather(e.target.value || null)}>
//               <option value="">None</option>
//               {members.filter((m) => m.role?.toLowerCase() === "father").map((f) => (
//                 <option key={f.id} value={f.id}>{f.name}</option>
//               ))}
//             </select>
//           </label>
//           <label>
//             Mother
//             <select value={addMother ?? ""} onChange={(e) => setAddMother(e.target.value || null)}>
//               <option value="">None</option>
//               {members.filter((m) => m.role?.toLowerCase() === "mother").map((f) => (
//                 <option key={f.id} value={f.id}>{f.name}</option>
//               ))}
//             </select>
//           </label> */}
//           <label>
//             Avatar
//             <input type="file" accept="image/*" onChange={(e) => setAddFile(e.target.files?.[0] ?? null)} />
//           </label>
//           <div className={styles.editButtons}>
//             <button onClick={() => setAddOpen(false)}>Cancel</button>
//             <button onClick={handleCreateMember}>Create</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// /* eslint-disable @typescript-eslint/no-unused-expressions */
// /* eslint-disable react-hooks/exhaustive-deps */
// // "use client";

// // import React, { useEffect, useRef, useState, useCallback } from "react";
// // import * as PIXI from "pixi.js";
// // import { v4 as uuidv4 } from "uuid";
// // import { supabase } from "../lib/supabaseClient";
// // import { User } from "@supabase/supabase-js";
// // import styles from "./components.module.css";

// // /* ---------- types ---------- */

// // export type MemberRow = {
// //   id: string;
// //   user_id?: string | null;
// //   name: string;
// //   role?: string | null;
// //   father_id?: string | null;
// //   mother_id?: string | null;
// //   spouse_id?: string | null;
// //   pos_x?: number | null;
// //   pos_y?: number | null;
// //   avatar_url?: string | null;
// //   avatar_path?: string | null;
// //   created_at?: string | null;
// // };

// // type EditingState = { id: string };

// // const NODE_RADIUS = 36;

// // /* ---------- role colors ---------- */
// // const roleColors: Record<string, number> = {
// //   grandfather: 0x8b5cf6,
// //   grandmother: 0xfb7185,
// //   father: 0x1e90ff,
// //   mother: 0xf59e0b,
// //   son: 0x34d399,
// //   daughter: 0x60a5fa,
// //   uncle: 0xf97316,
// //   aunt: 0xec4899,
// //   brother: 0x06b6d4,
// //   sister: 0xf472b6,
// //   cousin: 0xa78bfa,
// //   nephew: 0x60a5fa,
// //   niece: 0xfaa2c1,
// //   default: 0xe2e8f0,
// // };

// // /* ---------- component ---------- */
// // export default function FamilyCanvas() {
// //   const containerRef = useRef<HTMLDivElement | null>(null);
// //   const appRef = useRef<PIXI.Application | null>(null);
// //   const spritesRef = useRef<Record<string, PIXI.Container>>({});
// //   const [members, setMembers] = useState<MemberRow[]>([]);
// //   const [user, setUser] = useState<User | null>(null);
// //   const [loading, setLoading] = useState(false);

// //   // Editing modal state
// //   const [editing, setEditing] = useState<EditingState | null>(null);
// //   const [editName, setEditName] = useState("");
// //   const [editRole, setEditRole] = useState("");
// //   const [editFile, setEditFile] = useState<File | null>(null);

// //   // Add member modal state
// //   const [addOpen, setAddOpen] = useState(false);
// //   const [addName, setAddName] = useState("");
// //   const [addRole, setAddRole] = useState("");
// //   const [addFile, setAddFile] = useState<File | null>(null);
// //   const [addFather, setAddFather] = useState<string | null>(null);
// //   const [addMother, setAddMother] = useState<string | null>(null);

// //   // Toast state
// //   const [toastMessage, setToastMessage] = useState("");

// //   // REF to block realtime reloads while editing
// //   const isEditingRef = useRef(false);

// //   // texture cache to avoid repeated downloads & speed up rendering
// //   const textureCache = useRef<Record<string, PIXI.Texture>>({});

// //   // "dirty" flag — when true we re-render the PIXI stage on next tick
// //   const dirtyRef = useRef(false);

// //   // minimap refs
// //   const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
// //   const minimapDragging = useRef(false);
// //   const minimapPos = useRef({ right: 24, bottom: 24 }); // px from container

// //   // Helper: mark scene dirty
// //   const markDirty = () => {
// //     dirtyRef.current = true;
// //   };

// //   /* ---------- data loading ---------- */
// //   const loadMembers = useCallback(async () => {
// //     setLoading(true);
// //     try {
// //       const { data, error } = await supabase
// //         .from("family_members")
// //         .select("*")
// //         .order("created_at", { ascending: true });
// //       if (error) throw error;
// //       const rows = Array.isArray(data) ? data : [];
// //       const enriched = await Promise.all(
// //         rows.map(async (r: MemberRow) => {
// //           if (!r.avatar_url && r.avatar_path) {
// //             try {
// //               const { data: pu } = supabase.storage
// //                 .from("avatars")
// //                 .getPublicUrl(r.avatar_path);
// //               if (pu?.publicUrl) r.avatar_url = pu.publicUrl;
// //             } catch {}
// //           }
// //           return r;
// //         })
// //       );
// //       setMembers(enriched);
// //       markDirty();
// //     } catch (err) {
// //       console.error("fetchMembers", err);
// //       setMembers([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   /* ---------- auth restore ---------- */
// //   useEffect(() => {
// //     const init = async () => {
// //       try {
// //         const saved = localStorage.getItem("supabase_session");
// //         if (saved) {
// //           const session = JSON.parse(saved);
// //           await supabase.auth.setSession(session);
// //           setUser(session?.user ?? null);
// //         } else {
// //           const { data } = await supabase.auth.getUser();
// //           setUser(data.user ?? null);
// //         }
// //       } catch (err) {
// //         console.warn("session restore", err);
// //       }
// //     };
// //     init();

// //     const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
// //       setUser(session?.user ?? null);
// //       if (session) localStorage.setItem("supabase_session", JSON.stringify(session));
// //       else localStorage.removeItem("supabase_session");
// //     });

// //     return () => listener?.subscription?.unsubscribe?.();
// //   }, []);

// //   /* ---------- realtime subscription ---------- */
// //   useEffect(() => {
// //     loadMembers();
// //     const ch = supabase
// //       .channel("family-members-channel")
// //       .on(
// //         "postgres_changes",
// //         { event: "*", schema: "public", table: "family_members" },
// //         () => {
// //           if (!isEditingRef.current) {
// //             loadMembers();
// //           }
// //         }
// //       )
// //       .subscribe();
// //     return () => void supabase.removeChannel(ch);
// //   }, [loadMembers]);

// //   /* ---------- PIXI APP creation (safe & typed) ---------- */
// //   useEffect(() => {
// //     if (!containerRef.current) return;

// //     const app = new PIXI.Application({
// //       width: Math.max(window.innerWidth - 40, 900),
// //       height: Math.max(window.innerHeight - 220, 600),
// //       backgroundColor: 0x071025,
// //       antialias: true,
// //       resolution: window.devicePixelRatio || 1,
// //       autoDensity: true,
// //     });

// //     // store reference
// //     appRef.current = app;

// //     const canvas = app.view as HTMLCanvasElement | undefined;
// //     if (canvas) {
// //       // style the container to look like the framed image
// //       containerRef.current.style.position = "relative";
// //       containerRef.current.appendChild(canvas);
// //       canvas.style.cursor = "grab";
// //       canvas.style.border = "2px solid rgba(100, 120, 180, 0.12)";
// //       canvas.style.borderRadius = "6px";
// //       // give some drop shadow like your image
// //       canvas.style.boxShadow = "0 8px 30px rgba(0,0,0,0.6)";
// //     } else {
// //       console.warn("PIXI app view is undefined");
// //     }

// //     // pointer pan / wheel
// //     let isPanning = false;
// //     let panStart = { x: 0, y: 0 };
// //     let stageStart = { x: 0, y: 0 };

// //     const onPointerDown = (e: PointerEvent) => {
// //       isPanning = true;
// //       panStart = { x: e.clientX, y: e.clientY };
// //       stageStart = { x: app.stage.x, y: app.stage.y };
// //       canvas && (canvas.style.cursor = "grabbing");
// //     };

// //     const onPointerMove = (e: PointerEvent) => {
// //       if (!isPanning) return;
// //       const dx = e.clientX - panStart.x;
// //       const dy = e.clientY - panStart.y;
// //       app.stage.x = stageStart.x + dx;
// //       app.stage.y = stageStart.y + dy;
// //       markDirty();
// //     };

// //     const onPointerUp = () => {
// //       isPanning = false;
// //       canvas && (canvas.style.cursor = "grab");
// //     };

// //     const onWheel = (ev: WheelEvent) => {
// //       ev.preventDefault();
// //       if (!canvas) return;
// //       const oldScale = app.stage.scale.x;
// //       const scaleBy = 1.08;
// //       const newScale = ev.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
// //       const clamped = Math.max(0.25, Math.min(3, newScale));
// //       const rect = canvas.getBoundingClientRect();
// //       const pointer = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
// //       const worldPos = { x: (pointer.x - app.stage.x) / oldScale, y: (pointer.y - app.stage.y) / oldScale };
// //       app.stage.scale.set(clamped);
// //       app.stage.x = pointer.x - worldPos.x * clamped;
// //       app.stage.y = pointer.y - worldPos.y * clamped;
// //       markDirty();
// //     };

// //     canvas?.addEventListener("pointerdown", onPointerDown);
// //     window.addEventListener("pointermove", onPointerMove);
// //     window.addEventListener("pointerup", onPointerUp);
// //     canvas?.addEventListener("wheel", onWheel, { passive: false });

// //     /* -------------------- render loop with dirty check -------------------- */
// //     let mounted = true;
// //     const ticker = () => {
// //       if (!mounted) return;
// //       if (!dirtyRef.current) return;
// //       // redraw scene when dirty
// //       drawScene();
// //       drawMinimap();
// //       dirtyRef.current = false;
// //     };
// //     app.ticker.add(ticker);

// //     // draw once initially
// //     dirtyRef.current = true;

// //     return () => {
// //       mounted = false;
// //       canvas?.removeEventListener("pointerdown", onPointerDown);
// //       window.removeEventListener("pointermove", onPointerMove);
// //       window.removeEventListener("pointerup", onPointerUp);
// //       canvas?.removeEventListener("wheel", onWheel);
// //       app.ticker.remove(ticker);
// //       app.destroy(true, { children: true });
// //       appRef.current = null;
// //     };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, []);

// //   /* ---------- layout algorithm (non-destructive) ---------- */
// //   // Simple algorithm: for each parent (father or mother), place their children in a row beneath them.
// //   // If members have explicit pos_x/pos_y, preserve them.
// //   const applySimpleFamilyLayout = (rows: MemberRow[]) => {
// //     // build maps
// //     const byId = new Map(rows.map((r) => [r.id, r]));
// //     const childrenMap = new Map<string, MemberRow[]>();
// //     rows.forEach((r) => {
// //       const parentId = r.father_id ?? r.mother_id ?? null;
// //       if (parentId) {
// //         if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
// //         childrenMap.get(parentId)!.push(r);
// //       }
// //     });

// //     // for each parent with multiple children, layout horizontally
// //     childrenMap.forEach((kids, parentId) => {
// //       const parent = byId.get(parentId);
// //       if (!parent) return;
// //       const baseX = parent.pos_x ?? Math.random() * 800 + 100;
// //       const baseY = parent.pos_y ?? Math.random() * 200 + 100;
// //       const spacing = 120;
// //       const totalWidth = (kids.length - 1) * spacing;
// //       kids.forEach((kid, i) => {
// //         // only reposition kids that don't already have explicit positions
// //         if (kid.pos_x == null && kid.pos_y == null) {
// //           kid.pos_x = baseX - totalWidth / 2 + i * spacing;
// //           kid.pos_y = baseY + 140; // below parent
// //         }
// //       });
// //     });

// //     // for remaining top-level members (no parents), ensure they have some positions
// //     rows.forEach((r, i) => {
// //       if (r.pos_x == null) r.pos_x = 100 + (i % 10) * 120 + Math.floor(i / 10) * 40;
// //       if (r.pos_y == null) r.pos_y = 60 + Math.floor(i / 10) * 200;
// //     });
// //   };

// //   /* ---------- helper: texture loader with cache ---------- */
// //   const getTexture = (url?: string) => {
// //     if (!url) return null;
// //     const cache = textureCache.current;
// //     if (cache[url]) return cache[url];
// //     try {
// //       const tex = PIXI.Texture.from(url);
// //       cache[url] = tex;
// //       return tex;
// //     } catch (err) {
// //       return null;
// //     }
// //   };

// //   /* ---------- DRAW SCENE ---------- */
// //   const drawScene = () => {
// //     const app = appRef.current;
// //     if (!app) return;

// //     // clear stage
// //     app.stage.removeChildren();
// //     spritesRef.current = {};

// //     // layout (non-destructive)
// //     const rowsCopy = members.map((m) => ({ ...m }));
// //     applySimpleFamilyLayout(rowsCopy);

// //     // store nodes containers
// //     // We'll draw lines in a separate layer to allow z-ordering
// //     const linesLayer = new PIXI.Container();
// //     const spouseLayer = new PIXI.Container();
// //     const nodesLayer = new PIXI.Container();

// //     // create nodes
// //     rowsCopy.forEach((m) => {
// //       const container = new PIXI.Container();
// //       container.interactive = true;
// //       container.cursor = "grab";
// //       container.sortableChildren = true;

// //       // position from layout copy
// //       container.x = m.pos_x ?? Math.random() * 800 + 100;
// //       container.y = m.pos_y ?? Math.random() * 200 + 100;

// //       // background halo
// //       const roleColor = roleColors[m.role ?? "default"] ?? roleColors.default;
// //       const halo = new PIXI.Graphics();
// //       halo.beginFill(roleColor);
// //       halo.drawCircle(0, 0, NODE_RADIUS + 6);
// //       halo.endFill();
// //       halo.alpha = 0.08;
// //       container.addChild(halo);

// //       // outer circle
// //       const outer = new PIXI.Graphics();
// //       outer.beginFill(0x071028);
// //       outer.lineStyle(2, roleColor);
// //       outer.drawCircle(0, 0, NODE_RADIUS);
// //       outer.endFill();
// //       container.addChild(outer);

// //       // avatar sprite or plus
// //       const tex = getTexture(m.avatar_url ?? undefined);
// //       if (tex) {
// //         const sprite = new PIXI.Sprite(tex);
// //         sprite.anchor.set(0.5);
// //         sprite.width = NODE_RADIUS * 2;
// //         sprite.height = NODE_RADIUS * 2;
// //         const mask = new PIXI.Graphics();
// //         mask.beginFill(0xffffff);
// //         mask.drawCircle(0, 0, NODE_RADIUS - 1);
// //         mask.endFill();
// //         container.addChild(sprite);
// //         container.addChild(mask);
// //         sprite.mask = mask;
// //       } else {
// //         const plus = new PIXI.Text("+", { fontSize: 20, fill: 0xffffff });
// //         plus.anchor.set(0.5);
// //         container.addChild(plus);
// //       }

// //       // labels
// //       const label = new PIXI.Text(m.name ?? "Unnamed", { fontSize: 12, fill: 0xffffff, align: "center" });
// //       label.y = NODE_RADIUS + 8;
// //       label.anchor.set(0.5, 0);
// //       container.addChild(label);

// //       const roleLabel = new PIXI.Text(m.role ?? "", { fontSize: 10, fill: 0x94a3b8, align: "center" });
// //       roleLabel.y = NODE_RADIUS + 22;
// //       roleLabel.anchor.set(0.5, 0);
// //       container.addChild(roleLabel);

// //       // interactions
// //       let dragging = false;
// //       let dragOffset = { x: 0, y: 0 };

// //       container.on("pointerdown", (ev) => {
// //         ev.stopPropagation();
// //         dragging = true;
// //         container.cursor = "grabbing";
// //         const p = (ev as any).data.global;
// //         dragOffset = { x: p.x - container.x, y: p.y - container.y };
// //       });

// //       container.on("pointerup", async () => {
// //         dragging = false;
// //         container.cursor = "grab";
// //         // commit positions to DB
// //         try {
// //           await supabase
// //             .from("family_members")
// //             .update({ pos_x: Math.round(container.x), pos_y: Math.round(container.y) })
// //             .eq("id", m.id);
// //         } catch (err) {
// //           console.warn("save pos error", err);
// //         }
// //         markDirty();
// //       });

// //       container.on("pointerupoutside", () => {
// //         dragging = false;
// //         container.cursor = "grab";
// //       });

// //       container.on("pointermove", (ev) => {
// //         if (!dragging) return;
// //         const p = (ev as any).data.global;
// //         container.x = p.x - dragOffset.x;
// //         container.y = p.y - dragOffset.y;
// //         markDirty();
// //       });

// //       // double tap to edit
// //       container.on("pointertap", () => {
// //         const now = Date.now();
// //         type ClickableContainer = PIXI.Container & { __lastClick?: number };
// //         const clickableC = container as ClickableContainer;
// //         const last = clickableC.__lastClick ?? 0;
// //         clickableC.__lastClick = now;
// //         if (now - last < 300) {
// //           setEditing({ id: m.id });
// //           setEditName(m.name ?? "");
// //           setEditRole(m.role ?? "");
// //           setEditFile(null);
// //           isEditingRef.current = true;
// //         }
// //       });

// //       // entrance pop animation
// //       container.scale.set(0.8);
// //       app.ticker.addOnce(() => {
// //         app.ticker.add(function pop(dt) {
// //           const target = 1;
// //           container.scale.x += (target - container.scale.x) * 0.18;
// //           container.scale.y = container.scale.x;
// //           if (Math.abs(container.scale.x - target) < 0.005) {
// //             container.scale.set(target);
// //             app.ticker.remove(pop);
// //           }
// //         });
// //       });

// //       spritesRef.current[m.id] = container;
// //       nodesLayer.addChild(container);
// //     });

// //     // draw relationship lines (father/mother -> child)
// //     rowsCopy.forEach((child) => {
// //       const childNode = spritesRef.current[child.id];
// //       if (!childNode) return;
// //       const father_id = child.father_id;
// //       const mother_id = child.mother_id;
// //       const cpt = { x: childNode.x, y: childNode.y };
// //       if (father_id && spritesRef.current[father_id]) {
// //         const p = spritesRef.current[father_id];
// //         const g = new PIXI.Graphics();
// //         g.lineStyle(2, 0x94a3b8);
// //         g.moveTo(p.x, p.y);
// //         g.lineTo(cpt.x, cpt.y);
// //         linesLayer.addChild(g);
// //       }
// //       if (mother_id && spritesRef.current[mother_id]) {
// //         const p = spritesRef.current[mother_id];
// //         const g = new PIXI.Graphics();
// //         g.lineStyle(2, 0x94a3b8);
// //         g.moveTo(p.x, p.y);
// //         g.lineTo(cpt.x, cpt.y);
// //         linesLayer.addChild(g);
// //       }
// //     });

// //     // draw spouse lines (thin line between spouses)
// //     rowsCopy.forEach((m) => {
// //       if (!m.spouse_id) return;
// //       const a = spritesRef.current[m.id];
// //       const b = spritesRef.current[m.spouse_id];
// //       if (!a || !b) return;
// //       const g = new PIXI.Graphics();
// //       g.lineStyle(1.5, 0xfbbf24, 0.9);
// //       g.moveTo(a.x, a.y);
// //       g.lineTo(b.x, b.y);
// //       spouseLayer.addChild(g);
// //     });

// //     // add layers in order
// //     app.stage.addChild(linesLayer);
// //     app.stage.addChild(spouseLayer);
// //     app.stage.addChild(nodesLayer);

// //     // done
// //   }; // drawScene

// //   /* ---------- MINIMAP ---------- */
// //   // draws a tiny minimap overlay (HTML canvas) in the containerRef
// //   const drawMinimap = () => {
// //     const app = appRef.current;
// //     const container = containerRef.current;
// //     if (!app || !container) return;

// //     // create minimap canvas lazily
// //     if (!minimapCanvasRef.current) {
// //       const mini = document.createElement("canvas");
// //       mini.width = 220;
// //       mini.height = 140;
// //       mini.style.position = "absolute";
// //       mini.style.right = `${minimapPos.current.right}px`;
// //       mini.style.bottom = `${minimapPos.current.bottom}px`;
// //       mini.style.border = "1px solid rgba(255,255,255,0.04)";
// //       mini.style.borderRadius = "6px";
// //       mini.style.background = "rgba(0,0,0,0.28)";
// //       mini.style.cursor = "grab";
// //       mini.style.boxShadow = "0 6px 24px rgba(0,0,0,0.5)";
// //       container.appendChild(mini);
// //       minimapCanvasRef.current = mini;

// //       // drag to move minimap
// //       let dragStart: { x: number; y: number } | null = null;
// //       mini.addEventListener("pointerdown", (e) => {
// //         dragStart = { x: e.clientX, y: e.clientY };
// //         minimapDragging.current = true;
// //         mini.style.cursor = "grabbing";
// //       });
// //       window.addEventListener("pointermove", (ev) => {
// //         if (!dragStart) return;
// //         if (!minimapDragging.current) return;
// //         const dx = dragStart.x - ev.clientX;
// //         const dy = dragStart.y - ev.clientY;
// //         minimapPos.current.right += dx;
// //         minimapPos.current.bottom += dy;
// //         mini.style.right = `${minimapPos.current.right}px`;
// //         mini.style.bottom = `${minimapPos.current.bottom}px`;
// //         dragStart = { x: ev.clientX, y: ev.clientY };
// //       });
// //       window.addEventListener("pointerup", () => {
// //         dragStart = null;
// //         minimapDragging.current = false;
// //         mini.style.cursor = "grab";
// //       });
// //     }

// //     const mini = minimapCanvasRef.current;
// //     if (!mini) return;
// //     const ctx = mini.getContext("2d");
// //     if (!ctx) return;
// //     // clear
// //     ctx.clearRect(0, 0, mini.width, mini.height);

// //     // compute bounds of nodes
// //     const nodes = Object.values(spritesRef.current);
// //     if (nodes.length === 0) return;

// //     let minX = Infinity,
// //       maxX = -Infinity,
// //       minY = Infinity,
// //       maxY = -Infinity;
// //     nodes.forEach((n) => {
// //       minX = Math.min(minX, n.x);
// //       maxX = Math.max(maxX, n.x);
// //       minY = Math.min(minY, n.y);
// //       maxY = Math.max(maxY, n.y);
// //     });
// //     const margin = 40;
// //     minX -= margin;
// //     minY -= margin;
// //     maxX += margin;
// //     maxY += margin;

// //     const worldW = Math.max(1, maxX - minX);
// //     const worldH = Math.max(1, maxY - minY);

// //     const scaleX = mini.width / worldW;
// //     const scaleY = mini.height / worldH;
// //     const s = Math.min(scaleX, scaleY);

// //     // draw nodes as small dots
// //     nodes.forEach((n) => {
// //       const x = (n.x - minX) * s;
// //       const y = (n.y - minY) * s;
// //       ctx.fillStyle = "rgba(255,255,255,0.9)";
// //       ctx.beginPath();
// //       ctx.arc(x, y, 2.2, 0, Math.PI * 2);
// //       ctx.fill();
// //     });

// //     // draw viewport rect
// //     const appCanvas = app.view as HTMLCanvasElement | undefined;
// //     if (!appCanvas) return;
// //     const viewLeft = ( - app.stage.x - minX) * s / app.stage.scale.x;
// //     const viewTop = ( - app.stage.y - minY) * s / app.stage.scale.y;
// //     const viewW = (appCanvas.width / app.stage.scale.x) * s;
// //     const viewH = (appCanvas.height / app.stage.scale.y) * s;
// //     ctx.strokeStyle = "rgba(255,255,255,0.6)";
// //     ctx.lineWidth = 1.0;
// //     ctx.strokeRect(viewLeft, viewTop, viewW, viewH);
// //   };

// //   /* ---------- helpers used by PIXI creation (exposed above) ---------- */
// //   // We declare drawScene and drawMinimap earlier so they can be called from the ticker.
// //   // TypeScript hoisting: ensure functions exist on the closure
// //   // (No op here; they are defined as consts above.)

// //   /* ---------- DRAW NODES effect (re-draw when members change) ---------- */
// //   useEffect(() => {
// //     // When members change, mark dirty to redraw scene
// //     markDirty();
// //     // also rebuild textures for avatars (prefetch)
// //     members.forEach((m) => {
// //       if (m.avatar_url && !textureCache.current[m.avatar_url]) {
// //         try {
// //           textureCache.current[m.avatar_url] = PIXI.Texture.from(m.avatar_url);
// //         } catch {}
// //       }
// //     });
// //   }, [members]);

// //   /* ---------- SAVE EDIT & CREATE (kept from your code) ---------- */
// //   const handleSaveEdit = async () => {
// //     if (!editing || !user) return;

// //     try {
// //       const member = members.find((m) => m.id === editing.id);
// //       if (!member) return alert("Member not found");

// //       let avatar_url: string | undefined;
// //       let avatar_path: string | undefined;

// //       if (editFile) {
// //         const ext = editFile.name.split(".").pop() || "png";
// //         const fileName = `${user.id}-${Date.now()}.${ext}`;
// //         const filePath = `${user.id}/${fileName}`;
// //         const { error: uploadError } = await supabase.storage
// //           .from("avatars")
// //           .upload(filePath, editFile, { upsert: true });
// //         if (uploadError) throw uploadError;

// //         const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
// //         avatar_url = data?.publicUrl;
// //         avatar_path = filePath;
// //       }

// //       const updateFields: Partial<MemberRow> = {
// //         name: editName || member.name,
// //         role: editRole || member.role,
// //         ...(avatar_url ? { avatar_url, avatar_path } : {}),
// //       };

// //       const { error } = await supabase.from("family_members").update(updateFields).eq("id", editing.id);

// //       if (error) throw error;

// //       setEditing(null);
// //       setEditFile(null);
// //       isEditingRef.current = false;

// //       await loadMembers();
// //       setToastMessage("Member updated successfully!");
// //       setTimeout(() => setToastMessage(""), 2500);
// //     } catch (err: unknown) {
// //       if (err instanceof Error) alert(err.message);
// //       else console.error(err);
// //     }
// //   };

// //   const openAddModal = () => {
// //     setAddOpen(true);
// //     setAddName("");
// //     setAddRole("");
// //     setAddFile(null);
// //     setAddFather(null);
// //     setAddMother(null);
// //   };

// //   const handleCreateMember = async () => {
// //     if (!user) return alert("please login");
// //     try {
// //       const id = uuidv4();
// //       let avatar_url: string | undefined;
// //       let avatar_path: string | undefined;
// //       if (addFile) {
// //         const ext = addFile.name.split(".").pop() || "png";
// //         const fileName = `${user.id}-${Date.now()}.${ext}`;
// //         const filePath = `${user.id}/${fileName}`;
// //         const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, addFile, { upsert: true });
// //         if (uploadError) throw uploadError;
// //         const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
// //         avatar_url = data?.publicUrl;
// //         avatar_path = filePath;
// //       }

// //       const row: Partial<MemberRow> = {
// //         id,
// //         user_id: user.id,
// //         name: addName || "New member",
// //         role: addRole || "",
// //         father_id: addFather,
// //         mother_id: addMother,
// //         pos_x: Math.round(Math.random() * 800 + 100),
// //         pos_y: Math.round(Math.random() * 200 + 100),
// //         avatar_url: avatar_url ?? null,
// //         avatar_path: avatar_path ?? null,
// //       };

// //       const { error } = await supabase.from("family_members").insert([row]);
// //       if (error) throw error;

// //       setAddOpen(false);
// //       setAddFile(null);
// //       await loadMembers();
// //       setToastMessage("Member created successfully!");
// //       setTimeout(() => setToastMessage(""), 2500);
// //     } catch (err: unknown) {
// //       console.error("addMember error", err);
// //       if (err instanceof Error) alert(err.message);
// //     }
// //   };

// //   const resetView = () => {
// //     const app = appRef.current;
// //     if (!app) return;
// //     app.stage.x = 0;
// //     app.stage.y = 0;
// //     app.stage.scale.set(1);
// //     markDirty();
// //   };

// //   return (
// //     <div className={styles.familyCanvasWrapper}>
// //       <div className={styles.controls}>
// //         <button onClick={resetView}>Reset view</button>
// //         <button
// //           onClick={() => {
// //             const app = appRef.current;
// //             if (!app) return;
// //             const dataUrl = app.renderer.extract.base64(app.stage);
// //             const a = document.createElement("a");
// //             a.href = dataUrl;
// //             a.download = `family-tree-${Date.now()}.png`;
// //             a.click();
// //           }}
// //         >
// //           Export PNG
// //         </button>
// //         <button onClick={openAddModal}>Add Member</button>
// //         <div className={styles.nodeCount}>{loading ? "Loading…" : `Nodes: ${members.length}`}</div>
// //       </div>

// //       <div className={`${styles.canvasContainer} ${(editing || addOpen) ? styles.dimmed : ""}`} ref={containerRef} />

// //       {/* TOAST */}
// //       {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

// //       {/* EDIT OVERLAY */}
// //       {editing && (
// //         <div className={styles.editOverlay}>
// //           <h3>Edit member</h3>
// //           <label>
// //             Name
// //             <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
// //           </label>
// //           <label>
// //             Role
// //             <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
// //               <option value="">Select role</option>
// //               {Object.keys(roleColors).map((r) => (
// //                 <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
// //               ))}
// //             </select>
// //           </label>
// //           <label>
// //             Avatar
// //             <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
// //           </label>
// //           <div className={styles.editButtons}>
// //             <button
// //               onClick={() => {
// //                 setEditing(null);
// //                 setEditFile(null);
// //                 isEditingRef.current = false;
// //               }}
// //             >
// //               Cancel
// //             </button>
// //             <button onClick={handleSaveEdit}>Save</button>
// //           </div>
// //         </div>
// //       )}

// //       {/* ADD OVERLAY */}
// //       {addOpen && (
// //         <div className={styles.addOverlay}>
// //           <h3>Add member</h3>
// //           <label>
// //             Name
// //             <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} />
// //           </label>
// //           <label>
// //             Role
// //             <select value={addRole} onChange={(e) => setAddRole(e.target.value)}>
// //               <option value="">Select role</option>
// //               {Object.keys(roleColors).map((r) => (
// //                 <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
// //               ))}
// //             </select>
// //           </label>
// //           <label>
// //             Avatar
// //             <input type="file" accept="image/*" onChange={(e) => setAddFile(e.target.files?.[0] ?? null)} />
// //           </label>
// //           <div className={styles.editButtons}>
// //             <button onClick={() => setAddOpen(false)}>Cancel</button>
// //             <button onClick={handleCreateMember}>Create</button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
