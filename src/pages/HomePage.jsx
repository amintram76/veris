import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

/* Live-data pulse dot */
function LiveDot() {
  return <span className={styles.liveDot} aria-hidden="true" />
}

const TOOLS = [
  {
    tag:  'Data & Analytics',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'GP Practice list size comparison',
    desc:  'Compare registered patient list sizes across practices over time. Benchmark against others and the England national average, with trend charts and key statistics.',
    to:    '/tools/gp-list-sizes',
    live:  true,
  },
  {
    tag:  'Mapping',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
    title: 'GP Practice boundary map',
    desc:  'Explore registered catchment boundaries across England. Search by name to overlay boundaries, or click anywhere on the map to find nearest practices and check which catchment covers that point.',
    to:    '/tools/gp-map',
    live:  true,
  },
]

export default function HomePage() {
  return (
    <div className="page-enter">

      {/* ── Compact intro ───────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className="container">
          <p className="eyebrow">Primary Care Insight &amp; Support</p>
          <h1 className={styles.introH}>
            Free tools and honest writing for primary care leaders.
          </h1>
          <p className={styles.introSub}>
            Practical resources for Practice Managers, GP Partners and primary care leaders —
            built around the real complexity of general practice.
          </p>
        </div>
      </section>

      {/* ── Tools — primary focus ────────────────────────────────── */}
      <section className={styles.homeSec}>
        <div className="container">
          <div className={styles.secHead}>
            <div>
              <p className="eyebrow">Tools</p>
              <h2 className={styles.secTitle}>Tools built for primary care</h2>
            </div>
            <Link to="/tools" className={styles.allLink}>All tools →</Link>
          </div>

          <div className={styles.toolsGrid}>
            {TOOLS.map(tool => (
              <Link key={tool.title} to={tool.to} className={styles.toolCard}>
                <div className={styles.toolHead}>
                  <span className={styles.toolIcon}>{tool.icon}</span>
                  <span className={styles.toolTag}>{tool.tag}</span>
                </div>
                <h3 className={styles.toolTitle}>{tool.title}</h3>
                <p className={styles.toolDesc}>{tool.desc}</p>
                <div className={styles.toolFoot}>
                  <span className={styles.toolLink}>Open tool →</span>
                  {tool.live && (
                    <span className={styles.liveBadge}>
                      <LiveDot />
                      Live NHS data
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Articles — secondary focus ───────────────────────────── */}
      <section className={`${styles.homeSec} ${styles.homeSecAlt}`}>
        <div className="container">
          <div className={styles.secHead}>
            <div>
              <p className="eyebrow">Articles</p>
              <h2 className={styles.secTitle}>Clear thinking, honestly written</h2>
            </div>
            <Link to="/articles" className={styles.allLink}>All articles →</Link>
          </div>

          <div className={styles.articlesBanner}>
            <p>
              <strong>Articles are on the way.</strong>{' '}
              Experience-led writing on the real challenges of leading in primary care —
              no jargon, no quick fixes. If there's a topic you'd like covered,{' '}
              <Link to="/get-support">get in touch</Link>.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
