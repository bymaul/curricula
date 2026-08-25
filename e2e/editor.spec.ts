import { expect, test, type Page } from '@playwright/test';

const NAME_PLACEHOLDER = 'e.g. Alex Johnson';

async function freshEditor(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Curricula' })).toBeVisible();
  await expect(nameInput(page)).toBeVisible();
}

const nameInput = (page: Page) => page.getByPlaceholder(NAME_PLACEHOLDER);

const preview = (page: Page) => page.locator('[data-template-id]');

async function expectSaved(page: Page): Promise<void> {
  await expect(page.getByText('Saved', { exact: false })).toBeVisible();
}

test('loads the editor with a fresh resume', async ({ page, isMobile }) => {
  await freshEditor(page);

  await expect(page.getByRole('heading', { name: 'Curricula' })).toBeVisible();
  await expect(nameInput(page)).toHaveValue('');
  if (!isMobile) {
    await expect(preview(page)).toBeVisible();
    await expect(preview(page)).toContainText('Your Name');
  }
});

test('persists edits across reloads', async ({ page, isMobile }) => {
  await freshEditor(page);

  await nameInput(page).fill('Grace Hopper');
  await expect(preview(page)).toContainText('Grace Hopper');
  await expectSaved(page);

  await page.reload();
  await expect(nameInput(page)).toBeVisible();
  await expect(nameInput(page)).toHaveValue('Grace Hopper');
  if (!isMobile) {
    await expect(preview(page)).toBeVisible();
    await expect(preview(page)).toContainText('Grace Hopper');
  }
});

test('undoes and redoes edits with keyboard shortcuts', async ({ page }) => {
  await freshEditor(page);
  const input = nameInput(page);

  await input.fill('Grace Hopper');
  await expectSaved(page);

  await page.getByRole('heading', { name: 'Curricula' }).click();

  await page.keyboard.press('Control+z');
  await expect(input).toHaveValue('');
  await expect(preview(page)).not.toContainText('Grace Hopper');

  await page.keyboard.press('Control+Shift+z');
  await expect(input).toHaveValue('Grace Hopper');

  await page.keyboard.press('Control+z');
  await expect(input).toHaveValue('');
  await page.keyboard.press('Control+y');
  await expect(input).toHaveValue('Grace Hopper');
});

const openDesignTab = (page: Page) =>
  page.getByRole('button', { name: 'Design', exact: true }).click();

test('switches templates and updates the preview', async ({
  page,
  isMobile,
}) => {
  await freshEditor(page);
  await nameInput(page).fill('Grace Hopper');
  await openDesignTab(page);

  const templateRadio = (name: string) => page.getByRole('radio', { name });

  await templateRadio('Modern').click();
  if (!isMobile) {
    await expect(page.locator('[data-template-id="modern"]')).toBeVisible();
    await expect(page.locator('[data-template-id="modern"]')).toContainText(
      'Grace Hopper',
    );
  }

  await templateRadio('Minimal').click();
  if (!isMobile) {
    await expect(page.locator('[data-template-id="minimal"]')).toBeVisible();
    await expect(page.locator('[data-template-id="minimal"]')).toContainText(
      'Grace Hopper',
    );
  }

  await templateRadio('Harvard').click();
});

test('shows select labels in the trigger instead of raw values', async ({
  page,
}) => {
  await freshEditor(page);
  await openDesignTab(page);

  const languageSelect = page
    .getByRole('combobox')
    .filter({ hasText: 'English' });
  const templateRadio = page.getByRole('radio', { name: 'Harvard' });

  await expect(languageSelect.locator('[data-slot="select-value"]')).toHaveText(
    'English',
  );
  await expect(templateRadio).toHaveAttribute('aria-checked', 'true');

  await languageSelect.click();
  await page.getByRole('option', { name: 'Bahasa Indonesia' }).click();
  await expect(
    page
      .getByRole('combobox')
      .filter({ hasText: 'Bahasa Indonesia' })
      .locator('[data-slot="select-value"]'),
  ).toHaveText('Bahasa Indonesia');
});

test('resets the form scroll when switching tabs', async ({ page }) => {
  await freshEditor(page);

  await page.getByRole('button', { name: 'Experience', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add New Experience', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add New Experience', exact: true })
    .click();

  const formViewport = page
    .locator('section [data-slot="scroll-area-viewport"]')
    .first();
  await formViewport.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect
    .poll(async () => formViewport.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Personal', exact: true }).click();

  await expect
    .poll(async () => formViewport.evaluate((el) => el.scrollTop))
    .toBe(0);
  await expect(
    page.getByPlaceholder(
      'A brief overview of your professional background, key achievements, and core strengths...',
    ),
  ).not.toBeInViewport();
});

test('clicking a preview section focuses its tab', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'preview is hidden behind the mobile toggle');
  await freshEditor(page);

  await page.getByRole('button', { name: 'Experience', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add New Experience', exact: true })
    .click();
  await page.getByPlaceholder('Software Engineer').fill('Analytical Engineer');
  await page.getByPlaceholder('Jan 2022 - Present').fill('2022 - Present');

  await page.getByRole('button', { name: 'Personal', exact: true }).click();
  const experienceTab = page.getByRole('button', {
    name: 'Experience',
    exact: true,
  });
  await expect(experienceTab).not.toHaveAttribute('aria-current', 'page');

  await page
    .locator('[data-template-id="harvard"] [data-section-id="experience"]')
    .click();
  await expect(experienceTab).toHaveAttribute('aria-current', 'page');
});

test('adds a custom section and renders its heading', async ({
  page,
  isMobile,
}) => {
  await freshEditor(page);

  const sectionTabs = page.getByRole('navigation', {
    name: 'CV sections',
  });

  await page.getByRole('button', { name: 'Reorder sections' }).click();
  await page.getByRole('button', { name: 'Add section' }).click();
  await page.getByRole('menuitem', { name: 'Publications' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();

  await sectionTabs.getByRole('button', { name: 'Publications' }).click();

  if (!isMobile) {
    await expect(
      page
        .locator('[data-template-id]')
        .getByRole('heading', { name: 'Publications' }),
    ).toBeVisible();
  }
});

test('toggles the preview pane on mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only edit/preview toggle');
  await freshEditor(page);

  await expect(preview(page)).toBeHidden();

  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(preview(page)).toBeVisible();

  await page.getByRole('tab', { name: 'Edit' }).click();
  await expect(preview(page)).toBeHidden();
});

test('print stylesheet hides editor chrome and keeps the CV', async ({
  page,
}) => {
  await freshEditor(page);
  await nameInput(page).fill('Grace Hopper');

  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('header')).toBeHidden();
  await expect(page.locator('aside')).toBeHidden();
  await expect(page.getByLabel('Zoom in')).toBeHidden();
  await expect(page.getByLabel('Resume is 1 page long')).toBeHidden();

  await expect(preview(page)).toBeVisible();
  await expect(preview(page)).toContainText('Grace Hopper');

  await page.emulateMedia({ media: 'screen' });
});

test('service worker registers without CSP violations', async ({ page }) => {
  const cspViolations: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text())) {
      cspViolations.push(msg.text());
    }
  });

  await freshEditor(page);

  await expect
    .poll(async () =>
      page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return 'unsupported';
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return 'none';
        if (reg.active) return 'active';
        if (reg.installing || reg.waiting) return 'pending';
        return 'inactive';
      }),
    )
    .toBe('active');

  await page.reload();
  await expect(nameInput(page)).toBeVisible();
  expect(cspViolations).toEqual([]);
});
