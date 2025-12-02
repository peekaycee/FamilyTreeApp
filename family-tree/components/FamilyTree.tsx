'use client'
import { useEffect, useState } from 'react'
import Tree, { CustomNodeElementProps, TreeNodeDatum } from 'react-d3-tree'
import { supabase } from '../lib/supabaseClient'
import { buildTree } from '../lib/buildTree'
import MemberForm from './MemberForm'
import { v4 as uuidv4 } from 'uuid'

interface TreeNode extends TreeNodeDatum {
  name: string
  role: string
  avatar_url?: string
  children?: TreeNode[]
}

interface FamilyMember {
  id: string
  name: string
  role: string
  father_id?: string
  mother_id?: string
  avatar_url?: string
  avatar_path?: string
  created_at: string
}

export default function FamilyTree() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [form, setForm] = useState({
    name: '',
    role: '',
    father_id: '',
    mother_id: '',
    avatar: null as File | null,
  })

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) return console.error(error)
    setMembers(data || [])
    setTreeData(buildTree(data || []))
  }

  useEffect(() => {
    (async () => {
      await fetchMembers()
    })()

    const channel = supabase
      .channel('family-members-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_members' },
        () => fetchMembers()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const uploadAvatar = async () => {
    if (!form.avatar) return null
    const path = `${uuidv4()}-${form.avatar.name}`

    const { error } = await supabase.storage.from('avatars').upload(path, form.avatar)
    if (error) throw error

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return { url: data.publicUrl, path }
  }

  const addMember = async () => {
    let avatarInfo = null
    if (form.avatar) avatarInfo = await uploadAvatar()

    const { error } = await supabase.from('family_members').insert([
      {
        name: form.name,
        role: form.role,
        father_id: form.father_id || null,
        mother_id: form.mother_id || null,
        avatar_url: avatarInfo?.url,
        avatar_path: avatarInfo?.path,
      },
    ])

    if (error) throw error

    setForm({
      name: '',
      role: '',
      father_id: '',
      mother_id: '',
      avatar: null,
    })
  }

  // --- Correctly typed render node ---
  const renderNode = ({ nodeDatum, toggleNode }: CustomNodeElementProps): React.ReactElement => {
    const node = nodeDatum as TreeNode
    return (
      <g>
        <circle r={25} fill="#4f46e5" onClick={toggleNode} style={{ cursor: 'pointer' }} />
        <text fill="#fff" x={35} y={5} fontSize="12px">
          {node.name} ({node.role})
        </text>

        {node.avatar_url && (
          <g>
            <title>{node.name}&apos;s avatar</title>
            <image
              href={node.avatar_url}
              x={-20}
              y={-60}
              height={40}
              width={40}
              clipPath="circle(20px at 20px 20px)"
            />
          </g>
        )}
      </g>
    )
  }

  return (
    <>
      <MemberForm form={form} setForm={setForm} members={members} onSubmit={addMember} />
      <div id="treeWrapper" style={{ width: '100%', height: '800px' }}>
        {treeData.length > 0 && (
          <Tree
            data={treeData}
            renderCustomNodeElement={renderNode}
            orientation="vertical"
            zoomable
            collapsible
            transitionDuration={500}
          />
        )}
      </div>
    </>
  )
}
