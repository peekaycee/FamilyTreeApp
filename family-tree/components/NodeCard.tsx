'use client'
import React from 'react'
import styles from './components.module.css'

interface NodeCardProps {
  node: any
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function NodeCard({ node, onEdit, onDelete }: NodeCardProps) {
  const name = node.name || node.original?.name || 'Unnamed'
  const role = node.original?.role || '—'
  const avatar = node.avatar_url || node.original?.avatar_url || null

  return (
    <div className={styles.nodeCard}>
      
      {avatar && (
        <img
          src={avatar}
          alt={name}
          className={styles.nodeAvatar}
        />
      )}

      <strong className={styles.nodeName}>{name}</strong>

      <div className={styles.nodeRole}>
        {role}
      </div>

      <div className={styles.nodeActions}>
        <button
          onClick={() => onEdit(node.id)}
          className={`${styles.btnSmall} ${styles.btnEdit}`}
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(node.id)}
          className={`${styles.btnSmall} ${styles.btnDelete}`}
        >
          Delete
        </button>
      </div>
      
    </div>
  )
}