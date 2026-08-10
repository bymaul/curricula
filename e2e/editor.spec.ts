import { expect, test, type Page } from '@playwright/test';

const NAME_PLACEHOLDER = 'e.g. Alex Johnson';

/**
 * Navigate to the editor with a clean slate: wipe localStorage on the first
 * visit, then reload so the resume store rehydrates from empty and seeds one
 * fresh resume. Reloading after the wipe (instead of an init script) keeps
 * later reloads inside a test (e.g. the persistence check) intact.
 *
 * The readiness check is the header + name input (rendered after hydration),
 * not the preview: on mobile the preview is hidden behind the edit/preview
 * toggle.
 */
async function freshEditor(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Curricula' })).toBeVisible();
  await expect(nameInput(page)).toBeVisible();
}

const nameInput = (page: Page) => page.getByPlaceholder(NAME_PLACEHOLDER);

/** The preview pane (hidden behind the mobile toggle on small screens). */
const preview = (page: Page) => page.locator('[data-template-id]');

/** Waits for the autosave debounce to flush so history/persistence settled. */
async function expectSaved(page: Page): Promise<void> {
  await expect(page.getByText('Saved', { exact: false })).toBeVisible();
}

test('loads the editor with a fresh resume', async ({ page, isMobile }) => {
  await freshEditor(page);

  await expect(page.getByRole('heading', { name: 'Curricula' })).toBeVisible();
  await expect(nameInput(page)).toHaveValue('');
  if (!isMobile) {
    // The default template renders the placeholder name.
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

  // The shortcut handler skips inputs/textareas, so move focus away first.
  await page.getByRole('heading', { name: 'Curricula' }).click();

  await page.keyboard.press('Control+z');
  await expect(input).toHaveValue('');
  await expect(preview(page)).not.toContainText('Grace Hopper');

  // Redo via Ctrl+Shift+Z.
  await page.keyboard.press('Control+Shift+z');
  await expect(input).toHaveValue('Grace Hopper');

  // Undo again, then redo via Ctrl+Y (macOS-style alternative).
  await page.keyboard.press('Control+z');
  await expect(input).toHaveValue('');
  await page.keyboard.press('Control+y');
  await expect(input).toHaveValue('Grace Hopper');
});

test('switches templates and updates the preview', async ({
  page,
  isMobile,
}) => {
  await freshEditor(page);
  await nameInput(page).fill('Grace Hopper');

  const templateSelect = (current: string) =>
    page.getByRole('combobox').filter({ hasText: current });

  await templateSelect('Harvard').click();
  await page.getByRole('option', { name: 'Modern' }).click();
  if (!isMobile) {
    await expect(page.locator('[data-template-id="modern"]')).toBeVisible();
    await expect(page.locator('[data-template-id="modern"]')).toContainText(
      'Grace Hopper',
    );
  }

  await templateSelect('Modern').click();
  await page.getByRole('option', { name: 'Minimal' }).click();
  if (!isMobile) {
    await expect(page.locator('[data-template-id="minimal"]')).toBeVisible();
    await expect(page.locator('[data-template-id="minimal"]')).toContainText(
      'Grace Hopper',
    );
  }
});

test('clicking a preview section focuses its tab', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'preview is hidden behind the mobile toggle');
  await freshEditor(page);

  // Add an experience entry so its section renders in the preview.
  await page.getByRole('button', { name: 'Experience', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add New Experience', exact: true })
    .click();
  await page.getByPlaceholder('Software Engineer').fill('Analytical Engineer');
  await page.getByPlaceholder('Jan 2022 - Present').fill('2022 - Present');

  // Back to the personal tab, then click the experience section in the
  // preview (desktop only) and verify the editor switches tabs.
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

  // Emulate print media so Tailwind's print: variants apply.
  await page.emulateMedia({ media: 'print' });

  // Editor chrome is hidden: app header, sidebar, zoom controls, page badge.
  await expect(page.locator('header')).toBeHidden();
  await expect(page.locator('aside')).toBeHidden();
  await expect(page.getByLabel('Zoom in')).toBeHidden();
  await expect(page.getByLabel('Resume is 1 page long')).toBeHidden();

  // The CV page itself stays visible.
  await expect(preview(page)).toBeVisible();
  await expect(preview(page)).toContainText('Grace Hopper');

  // Back to screen media so the next test in the worker is unaffected.
  await page.emulateMedia({ media: 'screen' });
});
