import { Link } from 'react-router-dom'
import styles from './ContentPage.module.css'

const tools = [
  {
    title: "GP Practice list size comparison",
    description: "Compare registered patient list sizes across practices over time. Benchmark your practice against others and the England national average, with charts and key statistics.",
    tag: "Data & Analytics",
    link: "/tools/gp-list-sizes",
  },
]

export default function ToolsPage() {
  return (
    <div className="page-enter">
      <section className={styles.pageHero}>
        <div className="container--narrow">
          <p className={styles.eyebrow}>Tools</p>
          <h1 className={styles.pageTitle}>Practical tools for primary care</h1>
          <p className={styles.pageIntro}>
            Free, ready-to-use tools built around the real challenges of leading in primary care.
            Calculators, templates, frameworks and more — built to save you time and sharpen your thinking.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.cardGrid}>
            {tools.map((tool, i) => (
              <div key={i} className={styles.card}>
                <span className="tag">{tool.tag}</span>
                <h3 className={styles.cardTitle}>{tool.title}</h3>
                <p className={styles.cardDesc}>{tool.description}</p>
                {tool.link && (
                  <Link to={tool.link} className={styles.cardLink}>Open tool →</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
