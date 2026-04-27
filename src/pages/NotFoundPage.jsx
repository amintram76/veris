import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={`page-enter ${styles.wrapper}`}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>This path leads nowhere</h1>
      <p className={styles.sub}>The page you're looking for doesn't exist — but there's plenty here that does.</p>
      <Link to="/" className={styles.homeLink}>Back to Veris →</Link>
    </div>
  )
}
