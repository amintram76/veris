import styles from './ContentPage.module.css'

export default function ArticlesPage() {
  return (
    <div className="page-enter">
      <section className={styles.pageHero}>
        <div className="container--narrow">
          <p className={styles.eyebrow}>Articles</p>
          <h1 className={styles.pageTitle}>Clear thinking for primary care leaders</h1>
          <p className={styles.pageIntro}>
            Experience-led writing on the real challenges of leading in primary care.
            No jargon, no quick fixes — just honest reflection and practical ideas.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container--narrow">
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
            Articles coming soon. If there's a topic you'd like to see covered, <a href="/get-support">get in touch</a>.
          </p>
        </div>
      </section>
    </div>
  )
}
