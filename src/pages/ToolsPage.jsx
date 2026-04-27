import styles from './ContentPage.module.css'

const tools = [
  {
    title: "Coming soon",
    description: "Practical tools for primary care leaders are being built. Check back soon — or get in touch if there's something specific you'd find useful.",
    tag: "Upcoming",
    link: null,
  }
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
                  <a href={tool.link} className={styles.cardLink}>Open tool →</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
