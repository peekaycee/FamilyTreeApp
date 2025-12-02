import styles from './family-tree.module.css'

export default function FamilyTree() {
  return (
    <div className={styles.container}>
      <h1>Family Tree</h1>
      <p>Interactive tree view placeholder. Click nodes to view details and add members.</p>
      <div className={styles.placeholder}>[Family Tree Visualization Here]</div>
      <button className={styles.cta}>Add Member</button>
    </div>
  )
}
