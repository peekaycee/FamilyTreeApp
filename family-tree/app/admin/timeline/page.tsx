import styles from './timeline.module.css'
export default function Timeline() {
  return (
    <div className={styles.container}>
      <h1>Timeline</h1>
      <p>Chronological family milestones.</p>
      <ol className={styles.list}>
        <li><strong>1950</strong> — Grandpa Adeyemi born</li>
        <li><strong>1980</strong> — Tunde graduates university</li>
        <li><strong>2024</strong> — Family Reunion in Lagos</li>
      </ol>
    </div>
  )
}
