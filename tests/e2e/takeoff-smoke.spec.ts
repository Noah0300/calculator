import { test, expect } from '@playwright/test'

test('creates stuc takeoff with two rooms and openings', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'itemList_users',
      JSON.stringify([
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'worker', password: 'worker123', role: 'user' },
      ])
    )
    localStorage.setItem(
      'itemList_auth',
      JSON.stringify({ isLoggedIn: true, username: 'worker', role: 'user' })
    )
    localStorage.setItem('appLanguage', 'en')
  })

  await page.goto('/')

  await page.getByTestId('open-module-wizard').click()
  await page.getByTestId('takeoff-module-select').selectOption('stucwerk-m2')
  await page.getByText('Volgende: Meten').click()

  await page.getByTestId('room-width-0').fill('4')
  await page.getByTestId('room-height-0').fill('2.8')
  await page.getByRole('button', { name: '+ Opening' }).first().click()
  await page.getByTestId('opening-width-0-0').fill('1')
  await page.getByTestId('opening-height-0-0').fill('2')

  await page.getByRole('button', { name: '+ Ruimte toevoegen' }).click()
  await page.getByTestId('room-width-1').fill('2')
  await page.getByTestId('room-height-1').fill('2.5')

  await expect(page.getByTestId('takeoff-total-area')).toHaveText('14.20 m2')

  await page.getByRole('button', { name: 'Volgende: Parameters' }).click()
  await page.getByRole('button', { name: 'Volgende: Preview' }).click()
  await page.getByTestId('add-to-quote-btn').click()

  await expect(page.getByTestId('quote-grand-total')).toBeVisible()
  await expect(page.getByText('Stucwerk takeoff')).toBeVisible()
})
