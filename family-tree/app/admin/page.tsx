import styles from './admin.module.css'
import Link from 'next/link'

export default function Admin() {
  return (
    <section className={styles.adminPage}>
      <div className={styles.Container}>
        <h1>Admin Dashboard</h1>
        <p>Control and access of family tree components.</p>
        <div className={styles.grid}>
          <Link href="/admin/family-tree" className={styles.card}><h3>Family Tree - Admin</h3><p>Build and manage your lineage</p></Link>
          <Link href="/admin/gallery" className={styles.card}><h3>Gallery - Admin</h3><p>View and upload family media</p></Link>
          <Link href="/admin/timeline" className={styles.card}><h3>Timeline - Admin</h3><p>View family milestones</p></Link>
          <Link href="/admin/events" className={styles.card}><h3>Events - Admin</h3><p>Plan and RSVP</p></Link>
          <Link href="/admin/stories" className={styles.card}><h3>Stories - Admin</h3><p>Read and share family stories</p></Link>
          <Link href="/admin/settings" className={styles.card}><h3>Settings - Admin</h3><p>Account & privacy</p></Link>
        </div>
      </div>
    </section>
  )
}
