import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import VerdictBadge from '../VerdictBadge'

describe('VerdictBadge', () => {
  it('renders BLOCKED verdict', () => {
    render(<VerdictBadge verdict="BLOCKED" />)
    expect(screen.getByText('BLOCKED')).toBeInTheDocument()
  })

  it('renders FLAGGED verdict', () => {
    render(<VerdictBadge verdict="FLAGGED" />)
    expect(screen.getByText('FLAGGED')).toBeInTheDocument()
  })

  it('renders SAFE verdict', () => {
    render(<VerdictBadge verdict="SAFE" />)
    expect(screen.getByText('SAFE')).toBeInTheDocument()
  })

  it('renders ERROR for unknown verdict', () => {
    render(<VerdictBadge verdict={null} />)
    expect(screen.getByText('ERROR')).toBeInTheDocument()
  })

  it('is case-insensitive — lowercase blocked renders as BLOCKED', () => {
    render(<VerdictBadge verdict="blocked" />)
    expect(screen.getByText('BLOCKED')).toBeInTheDocument()
  })

  it('shows the BLOCKED icon', () => {
    render(<VerdictBadge verdict="BLOCKED" />)
    expect(screen.getByText('🚫')).toBeInTheDocument()
  })

  it('shows the SAFE icon', () => {
    render(<VerdictBadge verdict="SAFE" />)
    expect(screen.getByText('✅')).toBeInTheDocument()
  })

  it('applies the lg size class when size=lg', () => {
    const { container } = render(<VerdictBadge verdict="SAFE" size="lg" />)
    expect(container.firstChild).toHaveClass('text-2xl')
  })

  it('defaults to md size', () => {
    const { container } = render(<VerdictBadge verdict="SAFE" />)
    expect(container.firstChild).toHaveClass('text-sm')
  })
})
