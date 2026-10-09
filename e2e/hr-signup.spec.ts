import { test, expect } from '@playwright/test';

/*
 * The signup API contract doesn't exist yet: the app answers signup calls with its
 * in-browser stub (entities/account), which marks the account verified a few seconds
 * after creation. Once the real API lands, mock its routes here like create-vacancy does.
 */
test.describe('HR signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/config.json', async (route) => {
      await route.fulfill({ json: { apiBaseUrl: 'http://localhost:8080' } });
    });
  });

  test('signs up in four questions, waits for verification and lands on the dashboard', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByRole('heading', { name: 'Hoe heet je?' })).toBeVisible();
    await expect(page.getByText('Stap 1 van 4')).toBeVisible();
    await expect(page.getByLabel('Voornaam', { exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Volgende' })).toBeDisabled();
    await page.getByLabel('Voornaam', { exact: true }).fill('Sanne');
    await page.getByLabel('Voornaam', { exact: true }).press('Enter');

    await expect(page.getByText('Stap 2 van 4')).toBeVisible();
    await page.getByLabel('Achternaam', { exact: true }).fill('de Vries');
    await page.getByRole('button', { name: 'Volgende' }).click();

    await expect(page.getByText('Stap 3 van 4')).toBeVisible();
    await page.getByLabel('Werk e-mail', { exact: true }).fill('sanne@gmail.com');
    await page.getByRole('button', { name: 'Volgende' }).click();
    await expect(page.getByText('Dit lijkt geen werk e-mail — check je bedrijfsdomein.')).toBeVisible();
    await page.getByLabel('Werk e-mail', { exact: true }).fill('sanne@bedrijf.nl');
    await page.getByRole('button', { name: 'Volgende' }).click();

    await expect(page.getByText('Stap 4 van 4')).toBeVisible();
    await page.getByLabel('Rol', { exact: true }).selectOption({ label: 'HR-Manager' });
    await page.getByRole('button', { name: 'Account maken' }).click();

    await expect(page).toHaveURL(/\/signup\/verify$/);
    await expect(page.getByRole('heading', { name: 'Check je mail' })).toBeVisible();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Welkom, Sanne' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nog geen vacatures' })).toBeVisible();

    await page.getByRole('button', { name: 'Nieuwe vacature' }).click();
    await expect(page).toHaveURL(/\/vacancies\/new$/);
  });

  test('keeps answers when stepping back', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('Voornaam', { exact: true }).fill('Sanne');
    await page.getByLabel('Voornaam', { exact: true }).press('Enter');
    await page.getByLabel('Achternaam', { exact: true }).fill('de Vries');
    await page.getByLabel('Achternaam', { exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Terug' }).click();

    await expect(page.getByLabel('Achternaam', { exact: true })).toHaveValue('de Vries');
    await page.getByRole('button', { name: 'Terug' }).click();
    await expect(page.getByLabel('Voornaam', { exact: true })).toHaveValue('Sanne');
  });

  test('sends a direct visit to the verify screen back to the start', async ({ page }) => {
    await page.goto('/signup/verify');

    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('heading', { name: 'Hoe heet je?' })).toBeVisible();
  });
});
