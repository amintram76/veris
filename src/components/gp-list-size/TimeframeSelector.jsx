import styles from './TimeframeSelector.module.css'

export default function TimeframeSelector({ periods, fromIndex, toIndex, onFromChange, onToChange }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Period:</span>
      <div className={styles.selects}>
        <select
          className={styles.select}
          value={fromIndex}
          onChange={(e) => {
            const val = Number(e.target.value)
            onFromChange(val)
            if (val > toIndex) onToChange(val)
          }}
          aria-label="From period"
        >
          {periods.map((p, i) => (
            <option key={p.id} value={i}>{p.label}</option>
          ))}
        </select>

        <span className={styles.to}>to</span>

        <select
          className={styles.select}
          value={toIndex}
          onChange={(e) => {
            const val = Number(e.target.value)
            onToChange(val)
            if (val < fromIndex) onFromChange(val)
          }}
          aria-label="To period"
        >
          {periods.map((p, i) => (
            <option key={p.id} value={i} disabled={i < fromIndex}>{p.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
