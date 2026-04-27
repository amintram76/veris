import { useState, useRef, useEffect } from 'react'
import { searchPractices } from '../../services/gpListSizeService'
import { CHART_COLORS } from '../../data/gpListSizeData'
import styles from './PracticeSelector.module.css'

const MAX_PRACTICES = 8

export default function PracticeSelector({ selectedPractices, onAdd, onRemove }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const hits = searchPractices(query)
    setResults(hits.slice(0, 10))
    setIsOpen(hits.length > 0 && query.trim().length >= 2)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(practice) {
    if (selectedPractices.find((p) => p.code === practice.code)) return
    onAdd(practice)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const selectedCodes = new Set(selectedPractices.map((p) => p.code))
  const canAdd = selectedPractices.length < MAX_PRACTICES

  return (
    <div className={styles.wrapper}>
      <div className={styles.chips}>
        {selectedPractices.map((practice, i) => (
          <span key={practice.code} className={styles.chip} style={{ '--chip-color': CHART_COLORS[i % CHART_COLORS.length] }}>
            <span className={styles.chipDot} />
            <span className={styles.chipName}>{practice.name}</span>
            <span className={styles.chipCode}>{practice.code}</span>
            <button
              className={styles.chipRemove}
              onClick={() => onRemove(practice.code)}
              aria-label={`Remove ${practice.name}`}
            >
              ×
            </button>
          </span>
        ))}

        {canAdd && (
          <div className={styles.searchWrapper} ref={dropdownRef}>
            <div className={styles.inputRow}>
              <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="9" r="6" />
                <path d="M15 15l3 3" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                className={styles.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selectedPractices.length === 0 ? 'Search by practice name, code or ICB…' : 'Add another practice…'}
                aria-label="Search for a GP practice"
                autoComplete="off"
              />
              {query && (
                <button className={styles.clearBtn} onClick={() => { setQuery(''); setIsOpen(false) }} aria-label="Clear search">×</button>
              )}
            </div>

            {isOpen && (
              <ul className={styles.dropdown} role="listbox">
                {results.map((practice) => {
                  const alreadySelected = selectedCodes.has(practice.code)
                  return (
                    <li
                      key={practice.code}
                      role="option"
                      aria-selected={alreadySelected}
                      className={`${styles.dropdownItem} ${alreadySelected ? styles.dropdownItemDisabled : ''}`}
                      onClick={() => !alreadySelected && handleSelect(practice)}
                    >
                      <span className={styles.dropdownName}>{practice.name}</span>
                      <span className={styles.dropdownMeta}>{practice.code} · {practice.icb}</span>
                    </li>
                  )
                })}
              </ul>
            )}

            {query.trim().length >= 2 && results.length === 0 && (
              <div className={styles.noResults}>No practices found matching "{query}"</div>
            )}
          </div>
        )}
      </div>

      {selectedPractices.length === MAX_PRACTICES && (
        <p className={styles.maxNote}>Maximum of {MAX_PRACTICES} practices reached. Remove one to add another.</p>
      )}
    </div>
  )
}
