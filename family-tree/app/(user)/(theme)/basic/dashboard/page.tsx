import styles from './dashboard.module.css'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <section className={styles.dashboardPage}>
      <div className={styles.Container}>
        <h1>Your Family Dashboard</h1>
        <p>Overview of recent activity, invites, and quick actions.</p>
        <div className={styles.grid}>
          <Link href="/basic/dashboard/family-builder" className={styles.card}><h3>Family Tree</h3><p>Build and manage your lineage</p></Link>
          {/* <Link href="/basic/dashboard/family-tree" className={styles.card}><h3>Family Tree</h3><p>Build and manage your lineage</p></Link> */}
          {/* <Link href="/basic/dashboard/gallery" className={styles.card}><h3>Gallery</h3><p>View and upload family media</p></Link> */}
          {/* <Link href="/basic/dashboard/timeline" className={styles.card}><h3>Timeline</h3><p>View family milestones</p></Link> */}
          {/* <Link href="/basic/dashboard/events" className={styles.card}><h3>Events</h3><p>Plan and RSVP</p></Link> */}
          {/* <Link href="/basic/dashboard/stories" className={styles.card}><h3>Stories</h3><p>Read and share family stories</p></Link> */}
          {/* <Link href="/basic/dashboard/settings" className={styles.card}><h3>Settings</h3><p>Account & privacy</p></Link> */}
        </div>
      </div>
    </section>
  )
}
