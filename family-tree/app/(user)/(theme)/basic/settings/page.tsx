import styles from './settings.module.css'
import Link from 'next/link'

export default function Settings() {
  return (
    <div className={styles.container}>
      <Link href="/basic/dashboard">Users Dashboard Link...</Link>
      <h1>Account Settings</h1>
      <p>Manage profile, family name, and privacy.</p>
      <div className={styles.box}>[Settings form placeholder]</div>
    </div>
  )
}
