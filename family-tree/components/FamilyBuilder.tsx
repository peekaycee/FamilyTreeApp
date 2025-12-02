// 'use client';

// import React, { useEffect, useState, useRef } from 'react';
// import FamilyTree from 'react-family-tree';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import html2canvas from 'html2canvas';
// import { supabase } from '../lib/supabaseClient';
// import { User } from '@supabase/supabase-js';
// import styles from './FamilyBuilder.module.css';

// interface SupabaseMember {
//   id: string;
//   name: string;
//   role: string | null;
//   avatar_url: string | null;
//   avatar_path: string | null;
//   father_id: string | null;
//   mother_id: string | null;
//   spouse_id: string | null;
//   pos_x: number;
//   pos_y: number;
//   generation: number;
// }

// interface FamilyNode {
//   id: string;
//   rels: {
//     father?: string;
//     mother?: string;
//     spouses?: string[];
//     children?: string[];
//   };
//   data: {
//     name: string;
//     avatar?: string;
//     role?: string | null;
//   };
//   position: {
//     x: number;
//     y: number;
//   };
//   autoPositioned?: boolean;
// }

// interface TreeNode {
//   id: string;
//   gender: 'male' | 'female';
//   parents: Array<{ id: string; type: 'mother' | 'father' }>;
//   children: Array<{ id: string; type: 'son' | 'daughter' }>;
//   siblings: Array<{ id: string; type: 'brother' | 'sister' }>;
//   spouses: Array<{ id: string; type: 'spouse' }>;
// }

// interface FamilyMemberPayload {
//   name: string;
//   role: string;
//   avatar_url: string | null;
//   avatar_path: string | null;
//   father_id: string | null;
//   mother_id: string | null;
//   spouse_id: string | null;
//   user_id: string;
// }

// export default function FamilyBuilder() {
//   const [nodes, setNodes] = useState<FamilyNode[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState<User | null>(null);
//   const [form, setForm] = useState<{
//     id: string | null;
//     name: string;
//     role: string;
//     father_id: string | null;
//     mother_id: string | null;
//     spouse_id: string | null;
//     avatarFile: File | null;
//     avatarPreview: string | null;
//   }>({
//     id: null,
//     name: '',
//     role: '',
//     father_id: null,
//     mother_id: null,
//     spouse_id: null,
//     avatarFile: null,
//     avatarPreview: null,
//   });

//   const treeRef = useRef<HTMLDivElement>(null);

//   // -----------------------------
//   // AUTH SESSION
//   // -----------------------------
//   useEffect(() => {
//     const init = async () => {
//       const saved = localStorage.getItem('supabase_session');
//       if (saved) {
//         const session = JSON.parse(saved);
//         const { data } = await supabase.auth.setSession(session);
//         setUser(data.session?.user ?? null);
//       } else {
//         const { data } = await supabase.auth.getUser();
//         setUser(data.user ?? null);
//       }
//     };
//     init();
//   }, []);

//   // -----------------------------
//   // FETCH MEMBERS
//   // -----------------------------
//   async function fetchMembers() {
//     const { data, error } = await supabase.from('family_members').select('*').order('created_at');
//     if (error) {
//       console.error('Fetch error:', error);
//       return;
//     }
//     if (!data) return;

//     const converted: FamilyNode[] = data.map((m) => ({
//       id: m.id,
//       rels: {
//         father: m.father_id || undefined,
//         mother: m.mother_id || undefined,
//         spouses: m.spouse_id ? [m.spouse_id] : [],
//         children: [],
//       },
//       data: {
//         name: m.name,
//         role: m.role,
//         avatar: m.avatar_url || undefined,
//       },
//       position: {
//         x: m.pos_x,
//         y: m.pos_y,
//       },
//       autoPositioned: true,
//     }));

//     // Fill children array
//     for (const member of data) {
//       if (member.father_id) {
//         const father = converted.find((n) => n.id === member.father_id);
//         if (father) father.rels.children = [...(father.rels.children || []), member.id];
//       }
//       if (member.mother_id) {
//         const mother = converted.find((n) => n.id === member.mother_id);
//         if (mother) mother.rels.children = [...(mother.rels.children || []), member.id];
//       }
//     }

//     // Auto-layout positions
//     const positioned = autoLayout(converted);
//     setNodes(positioned);
//     setLoading(false);
//   const autoLayout = (nodes: FamilyNode[]): FamilyNode[] => {
//     const generations: Record<number, FamilyNode[]> = {};
//     const nodeMap = new Map(nodes.map((n) => [n.id, n]));

//     const computeGeneration = (node: FamilyNode): number => {
//       if (node.rels.father) {
//         const fatherNode = nodeMap.get(node.rels.father);
//         if (fatherNode) return computeGeneration(fatherNode) + 1;
//       }
//       if (node.rels.mother) {
//         const motherNode = nodeMap.get(node.rels.mother);
//         if (motherNode) return computeGeneration(motherNode) + 1;
//       }
//       return 0;
//     };

//     nodes.forEach((node) => {
//       const gen = computeGeneration(node);
//       node.position.y = gen * 150 + 50;
//       node.autoPositioned = true;
//       if (!generations[gen]) generations[gen] = [];
//       generations[gen].push(node);
//     });

//     Object.values(generations).forEach((genNodes) => {
//       const spacing = 200;
//       const startX = (window.innerWidth - genNodes.length * spacing) / 2;
//       genNodes.forEach((node, idx) => {
//         if (node.autoPositioned) node.position.x = startX + idx * spacing;
//       });
//     });

//     return nodes;
//   };

//   const convertToTreeNodes = (nodes: FamilyNode[]): TreeNode[] => {
//     return nodes.map((node) => ({
//       id: node.id,
//       gender: node.data.role === 'Father' || node.data.role === 'Son' ? 'male' : 'female',
//       parents: [
//         ...(node.rels.father ? [{ id: node.rels.father, type: 'father' as const }] : []),
//         ...(node.rels.mother ? [{ id: node.rels.mother, type: 'mother' as const }] : []),
//       ],
//       children: (node.rels.children || []).map((childId) => {
//         const child = nodes.find((n) => n.id === childId);
//         const type = child?.data.role === 'Son' ? 'son' : 'daughter';
//         return { id: childId, type };
//       }),
//       siblings: [],
//       spouses: (node.rels.spouses || []).map((spouseId) => ({
//         id: spouseId,
//         type: 'spouse' as const,
//       })),
//     }));
//   };
//       const spacing = 200;
//       const startX = (window.innerWidth - genNodes.length * spacing) / 2;
//       genNodes.forEach((node, idx) => {
//         if (node.autoPositioned) node.position.x = startX + idx * spacing;
//       });
//     });

//     return nodes;
//   };

//   // -----------------------------
//   // FILE UPLOAD
//   // -----------------------------
//   const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] ?? null;
//     if (!file) {
//       setForm((s) => ({ ...s, avatarFile: null, avatarPreview: null }));
//       return;
//     }
//     setForm((s) => ({ ...s, avatarFile: file }));
//     const reader = new FileReader();
//     reader.onload = (ev) =>
//       setForm((s) => ({ ...s, avatarPreview: ev.target?.result as string }));
//     reader.readAsDataURL(file);
//   };

//   const uploadAvatar = async (file: File, userId: string) => {
//     const ext = file.name.split('.').pop();
//     const fileName = `${userId}-${Date.now()}.${ext}`;
//     const filePath = `${userId}/${fileName}`;

//     const { error: uploadError } = await supabase
//       .storage.from('avatars')
//       .upload(filePath, file, { upsert: true });
//     if (uploadError) throw uploadError;

//     const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
//     return { url: publicUrlData.publicUrl, path: filePath };
//   };

//   // -----------------------------
//   // SAVE / ADD MEMBER
//   // -----------------------------
//   const handleSave = async () => {
//     if (!user) return alert('Login required');
//     if (!form.name.trim()) return alert('Name required');
//     if (!form.role.trim()) return alert('Role required');

//     setLoading(true);
//     try {
//       let avatarUrl: string | null = form.avatarPreview;
//       let avatarPath: string | null = null;

//       if (form.avatarFile && user) {
//         const uploaded = await uploadAvatar(form.avatarFile, user.id);
//         avatarUrl = uploaded.url;
//         avatarPath = uploaded.path;
//       }

//       const payload: FamilyMemberPayload = {
//         name: form.name,
//         role: form.role,
//         avatar_url: avatarUrl,
//         avatar_path: avatarPath,
//         father_id: form.father_id,
//         mother_id: form.mother_id,
//         spouse_id: form.spouse_id,
//         user_id: user!.id,
//       };

//       if (form.id) {
//         await supabase.from('family_members').update(payload).eq('id', form.id);
//       } else {
//         await supabase.from('family_members').insert(payload);
//       }

//       setForm({
//         id: null,
//         // name: '',
//         role: '',
//         father_id: null,
//         mother_id: null,
//         spouse_id: null,
//         avatarFile: null,
//         avatarPreview: null,
//       });

//       fetchMembers();
//     } catch (err) {
//       console.error(err);
//       alert('Error saving member');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -----------------------------
//   // DELETE MEMBER
//   // -----------------------------
//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this member?')) return;

//     setLoading(true);
//     try {
//       await supabase.from('family_members').delete().eq('id', id);
//       fetchMembers();
//     } catch (err) {
//       console.error(err);
//       alert('Error deleting member');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -----------------------------
//   // NODE DRAG
//   // -----------------------------
//   const handleNodeDrag = (id: string, x: number, y: number) => {
//     supabase.from('family_members').update({ pos_x: x, pos_y: y }).eq('id', id);
//     const updated = nodes.map((n) => (n.id === id ? { ...n, position: { x, y }, autoPositioned: false } : n));
//     setNodes(updated);
//   };

//   // -----------------------------
//   // EXPORT TREE
//   // -----------------------------
//   const handleExport = async () => {
//     if (!treeRef.current) return;
//     const canvas = await html2canvas(treeRef.current, {
//       background: '#fff',
//       useCORS: true,
//     });
//     const link = document.createElement('a');
//     link.download = 'family_tree.png';
//     link.href = canvas.toDataURL('image/png');
//     link.click();
//   };

//   if (loading) return <p>Loading family tree…</p>;

//   return (
//     <div className={styles.wrapper}>
//       <div className={styles.formContainer}>
//         <input
//             <FamilyTree
//               nodes={convertToTreeNodes(nodes)}
//               width={2000}
//               height={2000}
//               renderNode={(node: TreeNode) => {
//                 <div className={styles.nodeBox}>
//                   {familyNode.data.avatar && (
//                     <img src={familyNode.data.avatar} alt={familyNode.data.name} className={styles.avatar} />
//                   )}
//                   <div className={styles.name}>{familyNode.data.name}</div>
//                   <div className={styles.nodeBtns}>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         setForm({
//                           id: familyNode.id,
//                           name: familyNode.data.name,
//                           role: familyNode.data.role || '',
//                           father_id: familyNode.rels.father || null,
//                           mother_id: familyNode.rels.mother || null,
//                           spouse_id: familyNode.rels.spouses?.[0] || null,
//                           avatarFile: null,
//                           avatarPreview: familyNode.data.avatar || null,
//                         })
//                       }
//                       className={styles.editBtn}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(familyNode.id)}
//                       className={styles.deleteBtn}
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//                 ) : null;
//               }}
//                   {node.data.avatar && (
//                     <img src={node.data.avatar} alt={node.data.name} className={styles.avatar} />
//                   )}
//                   <div className={styles.name}>{node.data.name}</div>
//                   <div className={styles.nodeBtns}>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         setForm({
//                           id: node.id,
//                           name: node.data.name,
//                           role: node.data.role || '',
//                           father_id: node.rels.father || null,
//                           mother_id: node.rels.mother || null,
//                           spouse_id: node.rels.spouses?.[0] || null,
//                           avatarFile: null,
//                           avatarPreview: node.data.avatar || null,
//                         })
//                       }
//                       className={styles.editBtn}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(node.id)}
//                       className={styles.deleteBtn}
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               )}
//               onNodeDrag={handleNodeDrag}
//             />
//           </TransformComponent>
//         </TransformWrapper>
//       </div>
//     </div>
//   );
// }
