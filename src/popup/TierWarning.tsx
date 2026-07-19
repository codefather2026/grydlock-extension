import type { CSSProperties, ReactNode } from 'react'
import type { TierInfo } from '../lib/tiers'

interface TierWarningProps {
  tier: TierInfo
  score: number
  destination?: string
  onCancel: () => void
  onProceed: () => void
  devControl?: ReactNode
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true',
  )
}

export default function TierWarning({
  tier,
  score,
  destination,
  onCancel,
  onProceed,
  devControl,
}: TierWarningProps) {
  const highConfirmId = useId()
  const criticalConfirmId = useId()
  const [highConfirmed, setHighConfirmed] = useState(false)
  const [criticalConfirmation, setCriticalConfirmation] = useState('')
  const requiresHighConfirmation = tier.tier === 'high'
  const requiresCriticalConfirmation = tier.tier === 'critical'
  const criticalPhrase = tier.label.toUpperCase()
  const proceedEnabled =
    !requiresHighConfirmation && !requiresCriticalConfirmation
      ? true
      : requiresHighConfirmation
        ? highConfirmed
        : criticalConfirmation.trim().toUpperCase() === criticalPhrase

  return (
    <div
      className="popup"
      data-tier={tier.tier}
      style={
        {
          '--tier-accent-light': tier.colour,
          '--tier-accent-dark': tier.darkColour,
        } as CSSProperties
      }
    >
      {/* Icon paired with label so tier is never conveyed by colour alone (WCAG 1.4.1) */}
      <h1 id="tier-warning-title" aria-live="assertive">
        <span className="tier-icon" aria-hidden="true">
          {tier.icon}
        </span>{' '}
        {tier.label} risk
      </h1>
      {destination && <p className="destination">{destination}</p>}
      <p className="score">Score: {score}</p>
      <p className="message">{tier.message}</p>
      {requiresHighConfirmation && (
        <label className="confirmation-panel confirmation-check" htmlFor={highConfirmId}>
          <input
            id={highConfirmId}
            type="checkbox"
            checked={highConfirmed}
            onChange={(event) => setHighConfirmed(event.target.checked)}
          />
          <span>I understand this destination shows strong risk signals.</span>
        </label>
      )}
      {requiresCriticalConfirmation && (
        <div className="confirmation-panel">
          <label htmlFor={criticalConfirmId}>
            Type <strong>{criticalPhrase}</strong> to enable Proceed.
          </label>
          <input
            id={criticalConfirmId}
            className="confirmation-input"
            type="text"
            value={criticalConfirmation}
            onChange={(event) => setCriticalConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}
      <div className="actions">
        <button className="cancel" onClick={onCancel} ref={cancelRef}>
          Cancel
        </button>
        <button className="proceed" onClick={onProceed} disabled={!proceedEnabled}>
          Proceed
        </button>
      </div>
      {devControl}
    </div>
  )
}
