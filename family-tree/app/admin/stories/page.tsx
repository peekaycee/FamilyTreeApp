import styles from './stories.module.css'
export default function Stories() {
  return (
    <div className={styles.container}>
      <h1>Storytelling Hub</h1>
      <p>Private family posts, tributes, and long-form memories.</p>
      <div className={styles.list}>[Stories Placeholder]</div>
      <button className={styles.cta}>Add New Story</button>
    </div>
  )
}
