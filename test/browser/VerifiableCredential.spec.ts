import { test, expect } from '@playwright/test'

test('SSI types module loads in browser', async ({ page }) => {
  await page.goto('/test/index.html')
  const result = await page.evaluate(async () => {
    const mod = await import('/src/index.ts')
    return typeof mod === 'object' && mod !== null
  })
  expect(result).toBe(true)
})
