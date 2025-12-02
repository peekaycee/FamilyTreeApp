'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import styles from './components.module.css'

export type MemberRow = {
  id: string
  user_id?: string | null
  name: string
  role?: string | null
  father_id?: string | null
  mother_id?: string | null
  spouse_id?: string | null
  pos_x?: number | null
  pos_y?: number | null
  avatar_url?: string | null
  avatar_path?: string | null
  created_at?: string
}

type EditingState = { id: string }

export default function FamilyCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const spritesRef = useRef<Record<string, PIXI.Container>>({})
  const [members, setMembers] = useState<MemberRow[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [editName, setEditName] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [scale, setScale] = useState(1)

  const NODE_RADIUS = 36

  // -----------------------------
  // AUTH SESSION
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      try {
        const saved = localStorage.getItem('supabase_session')
        if (saved) {
          const session = JSON.parse(saved)
          await supabase.auth.setSession(session)
          setUser(session?.user ?? null)
        } else {
          const { data } = await supabase.auth.getUser()
          setUser(data.user ?? null)
        }
      } catch (err) {
        console.warn('session restore', err)
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session) {
        localStorage.setItem('supabase_session', JSON.stringify(session))
      } else {
        localStorage.removeItem('supabase_session')
      }
    })

    return () => listener?.subscription?.unsubscribe?.()
  }, [])

  // -----------------------------
  // FETCH MEMBERS
  // -----------------------------
  const fetchMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      setMembers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('fetchMembers', err)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadMembers = async () => {
      await fetchMembers()
    }
    loadMembers()

    const ch = supabase
      .channel('family-members-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_members' },
        () => fetchMembers()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(ch)
    }
  }, [])

  // -----------------------------
  // CREATE PIXI APP
  // -----------------------------
  useEffect(() => {
    if (!containerRef.current) return

    const app = new PIXI.Application({
      width: Math.max(window.innerWidth - 40, 900),
      height: Math.max(window.innerHeight - 220, 600),
      backgroundColor: 0x071025,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    appRef.current = app
    const view = app.view as HTMLCanvasElement
    containerRef.current.appendChild(view)
    view.style.cursor = 'grab'

    let isPanning = false
    let panStart = { x: 0, y: 0 }
    let stageStart = { x: 0, y: 0 }

    const onPointerDown = (e: PointerEvent) => {
      isPanning = true
      panStart = { x: e.clientX, y: e.clientY }
      stageStart = { x: app.stage.x, y: app.stage.y }
      view.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isPanning) return
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      app.stage.x = stageStart.x + dx
      app.stage.y = stageStart.y + dy
    }

    const onPointerUp = () => {
      isPanning = false
      view.style.cursor = 'grab'
    }

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault()
      const oldScale = app.stage.scale.x
      const scaleBy = 1.08
      const newScale = ev.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      const clamped = Math.max(0.25, Math.min(3, newScale))
      const rect = view.getBoundingClientRect()
      const pointer = { x: ev.clientX - rect.left, y: ev.clientY - rect.top }
      const worldPos = { x: (pointer.x - app.stage.x) / oldScale, y: (pointer.y - app.stage.y) / oldScale }
      app.stage.scale.set(clamped)
      app.stage.x = pointer.x - worldPos.x * clamped
      app.stage.y = pointer.y - worldPos.y * clamped
      setScale(clamped)
    }

    view.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    view.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      view.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      view.removeEventListener('wheel', onWheel)
      app.destroy(true, { children: true })
      appRef.current = null
    }
  }, [])

  // -----------------------------
  // DRAW NODES & LINES
  // -----------------------------
  useEffect(() => {
    const app = appRef.current
    if (!app) return

    app.stage.removeChildren()
    spritesRef.current = {}

    const makeNode = (m: MemberRow) => {
      const c = new PIXI.Container()
      c.interactive = true
      c.cursor = 'grab'
      c.x = m.pos_x ?? Math.random() * 800 + 100
      c.y = m.pos_y ?? Math.random() * 200 + 100
      c.sortableChildren = true

      const g = new PIXI.Graphics()
      g.beginFill(0x071028)
      g.lineStyle(2, 0xe2e8f0)
      g.drawCircle(0, 0, NODE_RADIUS)
      g.endFill()
      c.addChild(g)

      const label = new PIXI.Text(m.name ?? 'Unnamed', { fontSize: 12, fill: 0xffffff, align: 'center' })
      label.y = NODE_RADIUS + 8
      label.anchor.set(0.5, 0)
      c.addChild(label)

      if (m.avatar_url) {
        const sprite = PIXI.Sprite.from(m.avatar_url)
        sprite.anchor.set(0.5)
        sprite.width = NODE_RADIUS * 2
        sprite.height = NODE_RADIUS * 2
        const mask = new PIXI.Graphics()
        mask.beginFill(0xffffff)
        mask.drawCircle(0, 0, NODE_RADIUS)
        mask.endFill()
        c.addChild(sprite)
        c.addChild(mask)
        sprite.mask = mask
      } else {
        const plus = new PIXI.Text('+', { fontSize: 20, fill: 0xffffff })
        plus.anchor.set(0.5)
        c.addChild(plus)
      }

      let dragging = false
      let dragOffset = { x: 0, y: 0 }

      c.on('pointerdown', (ev) => {
        ev.stopPropagation()
        dragging = true
        c.cursor = 'grabbing'
        const p = ev.data.global
        dragOffset = { x: p.x - c.x, y: p.y - c.y }
      })

      c.on('pointerup', async () => {
        dragging = false
        c.cursor = 'grab'
        await supabase.from('family_members').update({ pos_x: Math.round(c.x), pos_y: Math.round(c.y) }).eq('id', m.id)
      })

      c.on('pointerupoutside', () => {
        dragging = false
        c.cursor = 'grab'
      })

      c.on('pointermove', (ev) => {
        if (!dragging) return
        const p = ev.data.global
        c.x = p.x - dragOffset.x
        c.y = p.y - dragOffset.y
      })

      c.on('pointertap', () => {
        const now = Date.now()
        type ClickableContainer = PIXI.Container & { __lastClick?: number }
        const clickableC = c as ClickableContainer
        const last = clickableC.__lastClick ?? 0
        clickableC.__lastClick = now
        if (now - last < 300) {
          setEditing({ id: m.id })
          setEditName(m.name ?? '')
          setEditFile(null)
        }
      })

      return c
    }

    members.forEach((m) => {
      const node = makeNode(m)
      spritesRef.current[m.id] = node
      app.stage.addChild(node)
    })

    // DRAW LINES
    const layer = new PIXI.Container()
    members.forEach((child) => {
      const childNode = spritesRef.current[child.id]
      if (!childNode) return
      const { father_id, mother_id } = child
      const cpt = { x: childNode.x, y: childNode.y }

      if (father_id && spritesRef.current[father_id]) {
        const p = spritesRef.current[father_id]
        const g = new PIXI.Graphics()
        g.lineStyle(2, 0x94a3b8)
        g.moveTo(p.x, p.y)
        g.lineTo(cpt.x, cpt.y)
        layer.addChild(g)
      }
      if (mother_id && spritesRef.current[mother_id]) {
        const p = spritesRef.current[mother_id]
        const g = new PIXI.Graphics()
        g.lineStyle(2, 0x94a3b8)
        g.moveTo(p.x, p.y)
        g.lineTo(cpt.x, cpt.y)
        layer.addChild(g)
      }
    })
    app.stage.addChild(layer)
  }, [members])

  // -----------------------------
  // ADD MEMBER
  // -----------------------------
  const addMember = async (payload?: Partial<MemberRow>) => {
    if (!user) return alert('please login')
    const id = uuidv4()
    const row: Partial<MemberRow> = {
      id,
      user_id: user.id,
      name: payload?.name ?? 'New member',
      role: payload?.role ?? '',
      father_id: payload?.father_id ?? null,
      mother_id: payload?.mother_id ?? null,
      spouse_id: payload?.spouse_id ?? null,
      pos_x: payload?.pos_x ?? Math.round(Math.random() * 800 + 100),
      pos_y: payload?.pos_y ?? Math.round(Math.random() * 200 + 100),
    }
    const { error } = await supabase.from('family_members').insert([row])
    if (error) console.error(error)
    fetchMembers()
  }

  // -----------------------------
  // SAVE EDIT
  // -----------------------------
  const handleSaveEdit = async () => {
    if (!editing || !user) return
    try {
      let avatar_url: string | undefined
      let avatar_path: string | undefined

      if (editFile) {
        const ext = editFile.name.split('.').pop() || 'png'
        const fileName = `${user.id}-${Date.now()}.${ext}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, editFile, { upsert: true })
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatar_url = data?.publicUrl
        avatar_path = filePath
      }

      const updateFields: Partial<MemberRow> = { name: editName }
      if (avatar_url) updateFields.avatar_url = avatar_url
      if (avatar_path) updateFields.avatar_path = avatar_path

      await supabase.from('family_members').update(updateFields).eq('id', editing.id)
      setEditing(null)
      setEditFile(null)
      fetchMembers()
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message)
    }
  }

  // -----------------------------
  // EXPORT PNG
  // -----------------------------
  const exportPNG = async () => {
    const app = appRef.current
    if (!app) return
    try {
      const dataUrl = await app.renderer.extract.base64(app.stage)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `family-tree-${Date.now()}.png`
      a.click()
    } catch {
      alert('Export failed')
    }
  }

  const resetView = () => {
    const app = appRef.current
    if (!app) return
    app.stage.x = 0
    app.stage.y = 0
    app.stage.scale.set(1)
    setScale(1)
  }

  return (
    <div className={styles.familyCanvasWrapper}>
      <div className={styles.controls}>
        <button onClick={resetView}>Reset view</button>
        <button onClick={exportPNG}>Export PNG</button>
        <button onClick={() => addMember()}>Add Member</button>
        <div className={styles.nodeCount}>{loading ? 'Loading…' : `Nodes: ${members.length}`}</div>
      </div>

      <div ref={containerRef} className={styles.canvasContainer} />

      {editing && (
        <div className={styles.editOverlay}>
          <h3>Edit member</h3>
          <label>
            Name
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </label>
          <label>
            Avatar
            <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className={styles.editButtons}>
            <button onClick={() => { setEditing(null); setEditFile(null) }}>Cancel</button>
            <button onClick={handleSaveEdit}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
