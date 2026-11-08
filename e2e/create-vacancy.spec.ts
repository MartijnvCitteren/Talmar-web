import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080';

test.describe('create-vacancy happy path', () => {
  test('fills all steps and publishes the vacancy (manual description path)', async ({ page }) => {
    await page.route('**/config.json', async (route) => {
      await route.fulfill({ json: { apiBaseUrl: API_BASE_URL } });
    });

    await page.route(`${API_BASE_URL}/vacancy`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'vacancy-e2e-1',
          status: 'DRAFT',
          jobTitle: 'Senior Backend Developer',
          language: 'NL',
          category: 'ENGINEERING',
          location: { country: 'NL', city: 'Amsterdam' },
          workplaceType: 'HYBRID',
          minHoursPerWeek: 24,
          maxHoursPerWeek: 36,
          createdAt: '2026-09-19T00:00:00Z',
        }),
      });
    });

    await page.route(`${API_BASE_URL}/vacancy/vacancy-e2e-1/description`, async (route) => {
      // Echo the submitted body back (like the real API's whole-object PATCH-style save),
      // so the Overzicht "Opslaan" round-trip below reflects what was actually typed.
      const submitted = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: 'Written by hand for the e2e test',
          jobDescription: 'Role text',
          tasks: 'Task list',
          ...submitted,
        }),
      });
    });

    await page.route(`${API_BASE_URL}/vacancy/vacancy-e2e-1`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'vacancy-e2e-1',
          status: 'DRAFT',
          jobTitle: 'Senior Backend Developer',
          language: 'NL',
          category: 'ENGINEERING',
          location: { country: 'NL', city: 'Amsterdam' },
          workplaceType: 'HYBRID',
          minHoursPerWeek: 24,
          maxHoursPerWeek: 36,
          createdAt: '2026-09-19T00:00:00Z',
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
          offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR', salaryPeriod: 'MONTHLY' },
        }),
      });
    });

    await page.route(`${API_BASE_URL}/vacancy/vacancy-e2e-1/transitions`, async (route) => {
      expect(route.request().postDataJSON()).toEqual({ action: 'PUBLISH' });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'vacancy-e2e-1',
          status: 'PUBLISHED',
          jobTitle: 'Senior Backend Developer',
          language: 'NL',
          category: 'ENGINEERING',
          location: { country: 'NL', city: 'Amsterdam' },
          workplaceType: 'HYBRID',
          minHoursPerWeek: 24,
          maxHoursPerWeek: 36,
          createdAt: '2026-09-19T00:00:00Z',
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
          offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR', salaryPeriod: 'MONTHLY' },
        }),
      });
    });

    await page.goto('/vacancies/new');

    // Step 1: Basisgegevens
    await expect(page.getByRole('heading', { name: 'Basisgegevens' })).toBeVisible();
    await page.getByLabel('Functietitel').fill('Senior Backend Developer');
    await expect(page.getByLabel('Taal van de vacature')).toHaveValue('NL');
    await page.getByLabel('Categorie').selectOption('ENGINEERING');
    await page.getByLabel('Land').selectOption('NL');
    await page.getByLabel('Stad').fill('Amsterdam');
    await page.getByRole('button', { name: 'Hybride' }).click();
    await page.getByLabel('Uren per week (minimum)').fill('24');
    await page.getByLabel('Uren per week (maximum)').fill('36');
    await page.getByRole('button', { name: 'Volgende' }).click();
    await expect(page.getByText('Concept opgeslagen')).toBeVisible();

    // Step 2: Vacaturetekst mode choice (manual path, skipping AI generation)
    await expect(page.getByRole('heading', { name: 'Vacaturetekst' })).toBeVisible();
    await page.getByRole('button', { name: 'Zelf schrijven' }).click();
    await page.getByRole('button', { name: 'Volgende' }).click();

    // Step 2, write view: Vacaturetekst alone (still step 2 — the manual/AI split).
    await page.getByLabel('Samenvatting').fill('Written by hand for the e2e test');
    await page.getByRole('button', { name: 'Volgende' }).click();

    // Step 3: Contact en voorwaarden only — no description fields on this page anymore.
    await expect(page.getByLabel('Samenvatting')).toHaveCount(0);
    await page.getByLabel('Naam').fill('Jane Doe');
    await page.getByLabel('E-mailadres').fill('jane@example.com');
    await page.getByRole('button', { name: 'Volgende' }).click();

    // Step 4: read-only Overzicht with per-section edit
    await expect(page.getByRole('heading', { name: 'Overzicht' })).toBeVisible();
    await expect(page.getByText('Senior Backend Developer')).toBeVisible();
    await expect(page.getByText('Jane Doe')).toBeVisible();

    await page.getByRole('button', { name: 'Aanpassen Samenvatting' }).click();
    await page.getByLabel('Samenvatting').fill('Updated via Overzicht for the e2e test');
    await page.getByRole('button', { name: 'Opslaan' }).click();
    await expect(page.getByText('Updated via Overzicht for the e2e test')).toBeVisible();

    await page.getByRole('button', { name: 'Bekijk je vacature' }).click();

    // Preview — candidate's view
    await expect(page.getByText('Zo ziet een sollicitant je vacature')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Solliciteren' })).toBeDisabled();
    await page.getByRole('button', { name: 'Publiceer vacature' }).click();

    // Publish confirmation modal
    await expect(page.getByRole('dialog', { name: 'Vacature publiceren?' })).toBeVisible();
    await page.getByRole('button', { name: 'Ja, publiceer' }).click();

    // Published
    await expect(page.getByText('Vacature gepubliceerd')).toBeVisible();
  });
});
