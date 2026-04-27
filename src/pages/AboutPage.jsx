import { Link } from 'react-router-dom'
import styles from './AboutPage.module.css'

export default function AboutPage() {
  return (
    <div className="page-enter">
      <section className={styles.pageHero}>
        <div className="container--narrow">
          <p className={styles.eyebrow}>About</p>
          <h1 className={styles.pageTitle}>The thinking behind Veris</h1>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container--narrow">

          <div className={styles.body}>
            <p>
              I'm Andy Mintram, a Practice Manager working in NHS general practice. I built Veris
              because of what I know about those moments — the ones where a conversation with the
              right person at the right time changes everything.
            </p>

            <p>
              Not because they gave you a policy document or pointed you to a framework.
              Because they listened, understood the context, and helped you see things more clearly.
              That's the kind of support that actually makes a difference.
            </p>

            <p>
              Primary care leadership can be a genuinely isolating place. Practice Managers,
              GP Partners and primary care leaders carry enormous operational and relational
              complexity — often without the peer network, headspace or external perspective
              that would help.
            </p>

            <p>
              Veris exists to be a small part of that support. Free tools that save you time.
              Articles that name the things you're already thinking. And when you need more
              than that — a door you can knock on.
            </p>

            <h2>Why Veris?</h2>

            <p>
              The word sits at the intersection of two Latin roots. <em>Ver</em> — spring,
              new growth, the moment of renewal after winter. And <em>verus</em> — true,
              genuine, real. That felt right for something built on honest thinking and the
              belief that clarity is possible, even in complex and uncertain territory.
            </p>

            <h2>What's here</h2>

            <p>
              Right now, Veris is a growing collection of free tools and articles for primary
              care leaders. Over time it will evolve — new tools, more writing, and for those
              who want it, direct support and advice.
            </p>

            <p>
              If you find something useful here, or if you'd like to get in touch,
              I'd genuinely be glad to hear from you.
            </p>
          </div>

          <div className={styles.cta}>
            <Link to="/get-support" className={styles.ctaBtn}>Get in touch →</Link>
          </div>

        </div>
      </section>
    </div>
  )
}
