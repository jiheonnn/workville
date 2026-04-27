'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import styles from './AtlasBanner.module.css'

type AtlasBannerVariant = 'info' | 'success' | 'warning' | 'danger'

const EXIT_DURATION_MS = 180
const DEFAULT_DISPLAY_DURATION_MS = 3000

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function AtlasBannerIcon({ variant }: { variant: AtlasBannerVariant }) {
  if (variant === 'success') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.badgeIcon}>
        <path
          d="M5 10.4 8.1 13.5 15.1 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (variant === 'warning') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.badgeIcon}>
        <path
          d="M10 3.5 17 16.5H3L10 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M10 7.2V11.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="10" cy="14" r="1.1" fill="currentColor" />
      </svg>
    )
  }

  if (variant === 'danger') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.badgeIcon}>
        <circle
          cx="10"
          cy="10"
          r="6.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <path
          d="M10 6.4V10.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="10" cy="13.6" r="1.1" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.badgeIcon}>
      <circle
        cx="10"
        cy="10"
        r="6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M10 8.3V13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="10" cy="6.2" r="1.1" fill="currentColor" />
    </svg>
  )
}

interface AtlasBannerProps {
  title: string
  message?: string
  variant?: AtlasBannerVariant
  tone?: AtlasBannerVariant
  displayDuration?: number
  autoCloseMs?: number
  dismissible?: boolean
  persistent?: boolean
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
  onClose?: () => void
}

export default function AtlasBanner({
  title,
  message,
  variant,
  tone,
  displayDuration,
  autoCloseMs,
  dismissible = true,
  persistent = false,
  actionLabel,
  onAction,
  onDismiss,
  onClose,
}: AtlasBannerProps) {
  const resolvedVariant = variant ?? tone ?? 'info'
  const resolvedDuration = displayDuration ?? autoCloseMs ?? DEFAULT_DISPLAY_DURATION_MS
  const [isClosing, setIsClosing] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    setIsClosing(false)
    setIsDismissed(false)
  }, [title, message, resolvedVariant])

  useEffect(() => {
    if (persistent) {
      return
    }

    // 이유: 부모 화면이 1초마다 리렌더되어도 배너 수명은 컴포넌트 내부에서 안정적으로 관리합니다.
    const timer = window.setTimeout(() => {
      setIsClosing(true)
    }, resolvedDuration)

    return () => window.clearTimeout(timer)
  }, [persistent, resolvedDuration, title, message, resolvedVariant])

  useEffect(() => {
    if (!isClosing) {
      return
    }

    const timer = window.setTimeout(() => {
      setIsDismissed(true)
      onDismiss?.()
      onClose?.()
    }, EXIT_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [isClosing, onClose, onDismiss])

  if (isDismissed) {
    return null
  }

  const banner = (
    <div className={styles.overlay} aria-hidden={isClosing ? 'true' : undefined}>
      <div
        className={joinClasses(
          styles.surface,
          styles[resolvedVariant],
          isClosing && styles.surfaceClosing
        )}
        role="status"
        aria-live={resolvedVariant === 'danger' ? 'assertive' : 'polite'}
      >
        <div className={styles.badge}>
          <AtlasBannerIcon variant={resolvedVariant} />
        </div>
        <div className={styles.content}>
          <div className={styles.title}>{title}</div>
          {message ? <div className={styles.message}>{message}</div> : null}
        </div>
        {actionLabel && onAction ? (
          <button type="button" className={styles.actionButton} onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        {dismissible ? (
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => {
              setIsClosing(true)
            }}
            aria-label="배너 닫기"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.closeIcon}>
              <path
                d="M6 6 14 14M14 6 6 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  )

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return banner
  }

  return createPortal(banner, document.body)
}
