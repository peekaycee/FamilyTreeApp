import styles from './events.module.css'
export default function Events() {
  return (
    <div className={styles.container}>
      <h1>Events</h1>
      <p>Upcoming family events and past reunions.</p>
      <ul className={styles.list}>
        <li><strong>Family Reunion — 2025-02-14</strong> — <em>RSVP open</em></li>
        <li><strong>Grandma's 80th — 2026-05-01</strong> — <em>Planned</em></li>
      </ul>
    </div>
  )
}
