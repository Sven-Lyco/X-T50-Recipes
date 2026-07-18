import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Ensure RTL cleanup after every test (needed when Vitest globals are not enabled)
afterEach(() => {
  cleanup()
})

// jsdom does not implement matchMedia; Mantine's color scheme detection requires it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// jsdom does not implement ResizeObserver (used by Mantine Select, Popover, etc.)
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom does not implement IntersectionObserver (used by Mantine Carousel and lazy images)
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// scrollIntoView is not implemented in jsdom
Element.prototype.scrollIntoView = () => {}
