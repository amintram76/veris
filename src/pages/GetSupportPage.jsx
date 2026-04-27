import styles from './GetSupportPage.module.css'

export default function GetSupportPage() {
  return (
    <div className="page-enter">
      <section className={styles.pageHero}>
        <div className="container--narrow">
          <p className={styles.eyebrow}>Get Support</p>
          <h1 className={styles.pageTitle}>Let's talk</h1>
          <p className={styles.pageIntro}>
            Sometimes a tool or an article isn't quite what you need. If you'd like
            a conversation — a sounding board, a second opinion, or just someone who
            understands the territory — reach out.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container--narrow">

          <div className={styles.supportOptions}>

            <div className={styles.option}>
              <h3 className={styles.optionTitle}>A sounding board</h3>
              <p className={styles.optionDesc}>
                Sometimes you just need to think out loud with someone who gets it.
                Whether it's a staffing challenge, a partner dynamic, a CQC worry or
                something you can't quite name — I'm happy to listen.
              </p>
            </div>

            <div className={styles.option}>
              <h3 className={styles.optionTitle}>Practical advice</h3>
              <p className={styles.optionDesc}>
                If you're facing a specific challenge — a business case, a governance gap,
                a contract question, a difficult conversation — I can offer experience-led
                thinking to help you find a way through.
              </p>
            </div>

            <div className={styles.option}>
              <h3 className={styles.optionTitle}>Suggest a tool or topic</h3>
              <p className={styles.optionDesc}>
                If there's a tool you wish existed, or an article topic that would genuinely
                help you — tell me. The best ideas for what to build come from the people
                who'd actually use it.
              </p>
            </div>

          </div>

          <div className={styles.contactBlock}>
            <p className={styles.contactIntro}>
              No forms, no process. Just get in touch directly.
            </p>
            <a href="mailto:hello@veris.org.uk" className={styles.emailBtn}>
              hello@veris.org.uk
            </a>
            <p className={styles.contactNote}>
              I'll always respond personally and treat everything shared in confidence.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}
