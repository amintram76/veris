import { useState } from 'react'
import { downloadCSV } from '../../utils/exportUtils'
import styles from './ExportBar.module.css'

const COLUMN_DEFS = [
  { key: 'icb',        label: 'ICB' },
  { key: 'listStart',  label: 'List size (start period)' },
  { key: 'listEnd',    label: 'List size (end period)' },
  { key: 'changePct',  label: '% change' },
  { key: 'englandPct', label: 'England population % change' },
  { key: 'vsPp',       label: 'vs. England (pp)' },
]

export default function ExportBar({
  stats,
  periods,
  fromIndex,
  toIndex,
  visibleColumns,
  onColumnsChange,
  printIncludeChart,
  onPrintIncludeChartChange,
  onPrint,
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleCSV() {
    downloadCSV(stats, periods, fromIndex, toIndex)
  }

  function handleOpenDialog() {
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
  }

  function handlePrint() {
    setDialogOpen(false)
    onPrint()
  }

  function toggleColumn(key) {
    onColumnsChange({ ...visibleColumns, [key]: !visibleColumns[key] })
  }

  return (
    <>
      <div className={styles.bar} data-no-print>
        <button className={styles.btnSecondary} onClick={handleCSV}>
          <span className={styles.icon}>↓</span> Download CSV
        </button>
        <button className={styles.btnSecondary} onClick={handleOpenDialog}>
          <span className={styles.icon}>⎙</span> Print / Export
        </button>
      </div>

      {dialogOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Print options">
          <div className={styles.dialog}>
            <h2 className={styles.dialogTitle}>Print options</h2>
            <p className={styles.dialogHint}>
              Changes are reflected in the table below — what you see is what will print.
            </p>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Chart</legend>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={printIncludeChart}
                  onChange={e => onPrintIncludeChartChange(e.target.checked)}
                  className={styles.check}
                />
                Include chart
              </label>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Columns</legend>
              <p className={styles.alwaysOn}>Practice name is always included.</p>
              {COLUMN_DEFS.map(({ key, label }) => (
                <label key={key} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={visibleColumns[key] ?? true}
                    onChange={() => toggleColumn(key)}
                    className={styles.check}
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            <div className={styles.dialogActions}>
              <button className={styles.btnGhost} onClick={handleClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handlePrint}>Print</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
