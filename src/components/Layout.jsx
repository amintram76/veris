import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import styles from './Layout.module.css'

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.logoMark}>V</span>
            <span className={styles.logoText}>
              <span className={styles.logoName}>Veris</span>
              <span className={styles.logoSub}>Primary Care Insight & Support</span>
            </span>
          </NavLink>
          <nav className={styles.nav}>
            <NavLink to="/tools" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
              Tools
            </NavLink>
            <NavLink to="/articles" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
              Articles
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
              About
            </NavLink>
            <NavLink to="/get-support" className={styles.navCta}>
              Get Support
            </NavLink>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerName}>Veris</span>
            <span className={styles.footerTagline}>Clarity, fresh thinking and genuine support for those who lead in primary care.</span>
          </div>
          <nav className={styles.footerNav}>
            <NavLink to="/tools">Tools</NavLink>
            <NavLink to="/articles">Articles</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/get-support">Get Support</NavLink>
          </nav>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} Veris</p>
        </div>
      </footer>
    </div>
  )
}
