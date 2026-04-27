import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className="page-enter">

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Primary Care Insight & Support</p>
            <h1 className={styles.heroHeading}>
              Clarity, fresh thinking<br />
              <em>and genuine support</em>
            </h1>
            <p className={styles.heroSub}>
              Veris is a resource for those who lead in primary care — Practice Managers, GP Partners,
              and primary care leaders navigating the real complexity of general practice.
              Free tools, honest articles, and a place to find support.
            </p>
            <div className={styles.heroCtas}>
              <Link to="/tools" className={styles.ctaPrimary}>Explore the tools</Link>
              <Link to="/articles" className={styles.ctaSecondary}>Read the articles</Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is Veris */}
      <section className={styles.about}>
        <div className="container--narrow">
          <p className={styles.aboutLead}>
            The word <em>veris</em> speaks of spring — of new growth, fresh beginnings, and things
            becoming clear after a long winter. It also carries the Latin root <em>verus</em>: true,
            genuine, real. That's the spirit behind this site.
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className={styles.pillars}>
        <div className="container">
          <div className={styles.pillarsGrid}>

            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h3 className={styles.pillarTitle}>Tools</h3>
              <p className={styles.pillarDesc}>
                Practical tools built for primary care — calculators, templates, and frameworks
                to save you time and support clearer thinking.
              </p>
              <Link to="/tools" className={styles.pillarLink}>Browse tools →</Link>
            </div>

            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className={styles.pillarTitle}>Articles</h3>
              <p className={styles.pillarDesc}>
                Honest, experience-led writing on the challenges of leading in primary care.
                No jargon, no quick fixes — just clear thinking.
              </p>
              <Link to="/articles" className={styles.pillarLink}>Read articles →</Link>
            </div>

            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={styles.pillarTitle}>Get Support</h3>
              <p className={styles.pillarDesc}>
                Sometimes you need more than a template. Whether you want a sounding board
                or specific advice — reach out and let's talk.
              </p>
              <Link to="/get-support" className={styles.pillarLink}>Get in touch →</Link>
            </div>

          </div>
        </div>
      </section>

      {/* Closing thought */}
      <section className={styles.closing}>
        <div className="container--narrow">
          <blockquote className={styles.quote}>
            "The best support I've ever received wasn't advice — it was someone who listened,
            understood the context, and helped me see things more clearly."
          </blockquote>
          <p className={styles.quoteAttr}>— The thinking behind Veris</p>
        </div>
      </section>

    </div>
  )
}
