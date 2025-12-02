'use client'
import React, { useEffect, useRef, useState } from 'react'
import FamilyTree from 'react-family-tree'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { supabase } from '../lib/supabaseClient'
import html2canvas from 'html2canvas'
import styles from './components.module.css'
import NodeCard from './NodeCard'

type SupabaseMember = {
  id: string
  name: string
  role?: string | null
  father_id?: string | null
  mother_id?: string | null
  avatar_url?: string | null
  avatar_path?: string | null
  user_id?: string | null
}

type OldTreeNode = {
  id: string
  male: boolean
  parents: string[]
  spouses: string[]
  siblings: string[]
  children: string[]
  original: SupabaseMember
}

export default function FamilyBuilder() {
  const [rawMembers, setRawMembers] = useState<SupabaseMember[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const treeRef = useRef<HTMLDivElement | null>(null)

  const [form, setForm] = useState({
    id: null as string | null,
    name: '',
    role: '',
    avatarFile: null as File | null,
    avatarPreview: null as string | null,
  })

  /* ---------------- AUTH RESTORE ---------------- */
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('supabase_session')
      if (saved) {
        const session = JSON.parse(saved)
        const { data } = await supabase.auth.setSession(session)
        setUser(data.session?.user ?? null)
      } else {
        const { data } = await supabase.auth.getUser()
        setUser(data.user ?? null)
      }
    }
    init()
  }, [])

  /* ---------------- FETCH MEMBERS ---------------- */
  const fetchMembers = async () => {
    const { data } = await supabase.from('family_members').select('*')
    setRawMembers(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  /* ---------------- ROLE → MALE/FEMALE ---------------- */
  const detectSex = (role?: string | null): boolean => {
    if (!role) return true
    return ['Father', 'Son', 'Grandfather'].includes(role)
  }

  /* ---------------- MAP TO OLD API ---------------- */
  const mapNodes = (members: SupabaseMember[]): OldTreeNode[] => {
    const nodes: OldTreeNode[] = members.map(m => ({
      id: m.id,
      male: detectSex(m.role),
      parents: [],
      spouses: [],
      siblings: [],
      children: [],
      original: m,
    }))

    const byId = new Map(nodes.map(n => [n.id, n]))

    members.forEach(m => {
      const node = byId.get(m.id)!
      if (m.father_id && byId.has(m.father_id)) {
        node.parents.push(m.father_id)
        byId.get(m.father_id)!.children.push(m.id)
      }
      if (m.mother_id && byId.has(m.mother_id)) {
        node.parents.push(m.mother_id)
        byId.get(m.mother_id)!.children.push(m.id)
      }
    })

    return nodes
  }

  const treeNodes = mapNodes(rawMembers)
  const rootId = treeNodes.length > 0 ? treeNodes[0].id : null

  /* ---------------- IMAGE UPLOADER ---------------- */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setForm(s => ({ ...s, avatarFile: null, avatarPreview: null }))
      return
    }
    setForm(s => ({ ...s, avatarFile: file }))
    const reader = new FileReader()
    reader.onload = ev => setForm(s => ({ ...s, avatarPreview: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (file: File, userId: string) => {
    const ext = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${ext}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return { url: publicUrlData.publicUrl, path: filePath }
  }

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!user) return alert('Login required')
    if (!form.name.trim()) return alert('Name required')
    if (!form.role.trim()) return alert('Role required')

    setLoading(true)
    try {
      let avatarUrl = form.avatarPreview || null
      let avatarPath: string | null = null
      if (form.avatarFile) {
        const uploaded = await uploadAvatar(form.avatarFile, user.id)
        avatarUrl = uploaded.url
        avatarPath = uploaded.path
      }

      const payload = {
        user_id: user.id,
        name: form.name,
        role: form.role,
        avatar_url: avatarUrl,
        avatar_path: avatarPath,
      }

      await supabase.from('family_members').insert(payload)
      setForm({ id: null, name: '', role: '', avatarFile: null, avatarPreview: null })
      fetchMembers()
    } catch (err) {
      console.error(err)
      alert('Error saving member')
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className={styles.familyBuilderContainer}>
      <h2>Family Builder (OLD API)</h2>

      <div className={styles.formGroup}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className={styles.input}
        />

        <select
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
          className={styles.input}
        >
          <option value="">Select Role</option>
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Son">Son</option>
          <option value="Daughter">Daughter</option>
        </select>

        <input type="file" accept="image/*" onChange={onFileChange} className={styles.inputFile} />

        <button onClick={handleSave} className={styles.btnPrimary}>
          {loading ? 'Saving...' : 'Add'}
        </button>
      </div>

      {form.avatarPreview && (
        <div className={styles.previewWrapper}>
          <img src={form.avatarPreview} alt="Preview" className={styles.previewImage} />
        </div>
      )}

      {rootId ? (
        <TransformWrapper>
          <TransformComponent>
            <div ref={treeRef}>
              <FamilyTree
                nodes={treeNodes}
                rootId={rootId}
                width={160}
                height={120}
                renderNode={(node: any) => (
                  <NodeCard
                    key={node.id}
                    node={{
                      ...node,
                      avatar_url: node.original.avatar_url || node.avatar_url || '/default-avatar.png'
                    }}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                )}
              />
            </div>
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <div>No members</div>
      )}
    </div>
  )
}
