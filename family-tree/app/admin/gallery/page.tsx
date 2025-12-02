import styles from './gallery.module.css'
export default function Gallery() {
  return (
    <div className={styles.container}>
      <h1>Family Gallery</h1>
      <p>Upload and browse family photos and documents.</p>
      <div className={styles.grid}>[Media Grid Placeholder]</div>
      <button className={styles.cta}>Upload Media</button>
    </div>
  )
}
