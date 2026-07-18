import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import ReferencePage from './ReferencePage'

describe('ReferencePage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<ReferencePage />)
  })

  it('shows page title', () => {
    renderWithProviders(<ReferencePage />)
    expect(screen.getAllByRole('heading', { name: 'Einstellungen-Referenz' }).length).toBeGreaterThan(0)
  })

  it('shows film simulation badges', () => {
    renderWithProviders(<ReferencePage />)
    expect(screen.getAllByText('PROVIA').length).toBeGreaterThan(0)
    expect(screen.getAllByText('VELVIA').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ACROS').length).toBeGreaterThan(0)
  })

  it('shows Bildparameter section with English parameter labels', () => {
    renderWithProviders(<ReferencePage />)
    expect(screen.getAllByText('Dynamic Range').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sharpness').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Clarity').length).toBeGreaterThan(0)
  })

  it('shows Weißabgleich section', () => {
    renderWithProviders(<ReferencePage />)
    expect(screen.getAllByText('Weißabgleich').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Daylight').length).toBeGreaterThan(0)
  })

  it('shows Belichtung section', () => {
    renderWithProviders(<ReferencePage />)
    expect(screen.getAllByText('Belichtungskorrektur (EV)').length).toBeGreaterThan(0)
  })
})
