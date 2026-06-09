import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import styles from './Layout.module.css'

/* Geometric two-tone "V" logo mark — inline so it works without asset path issues */
function LogoMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="44"
      height="44"
      className={styles.logoMark}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="48" height="48" rx="12" fill="#173E2C" />
      <path d="M11 12 L18 12 L25 30 L21.5 38 Z" fill="#95D5B2" />
      <path d="M37 12 L30 12 L23 30 L26.5 38 Z" fill="#52B788" />
    </svg>
  )
}

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className={styles.wrapper}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className={styles.header}>
        {/* Dark-green sweep in the top-right corner + divider line */}
        <span className={styles.headerFrame} aria-hidden="true">
          <svg viewBox="0 0 1200 78" preserveAspectRatio="none" fill="none">
            <path
              className={styles.frameFill}
              d="M1200 0 L770 0 C690 0 690 78 600 78 L1200 78 Z"
            />
            <path
              className={styles.frameLine}
              d="M0 77 L600 77 C690 77 690 1 770 1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>

        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.logo}>
            <LogoMark />
            <span className={styles.logoText}>
              <span className={styles.logoName}>Veris</span>
              <span className={styles.logoSub}>Primary Care Insight &amp; Support</span>
            </span>
          </NavLink>

          <nav className={styles.nav}>
            <NavLink
              to="/tools"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Tools
            </NavLink>
            <NavLink
              to="/articles"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Articles
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              About
            </NavLink>
            <NavLink to="/get-support" className={styles.navCta}>
              Get Support
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        {/* Dark-green sweep in the bottom-left corner + divider line */}
        <span className={styles.footerFrame} aria-hidden="true">
          <svg viewBox="0 0 1200 78" preserveAspectRatio="none" fill="none">
            <path
              className={styles.frameFill}
              d="M0 78 L430 78 C510 78 510 0 600 0 L0 0 Z"
            />
            <path
              className={styles.frameLine}
              d="M430 77 C510 77 510 1 600 1 L1200 1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>

        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerName}>Veris</span>
            <span className={styles.footerTagline}>
              Clarity, fresh thinking and genuine support for those who lead in primary care.
            </span>
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
