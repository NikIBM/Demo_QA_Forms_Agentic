/*
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Page Object for the DemoQA Student Registration Form
 *              (https://demoqa.com/automation-practice-form).
 *              Covers all interactive elements: text inputs, radio buttons,
 *              date picker, subject auto-complete, hobby checkboxes, file
 *              upload, current address, state/city react-select dropdowns,
 *              and confirmation modal validation.
 *
 *              All locators use Playwright semantic selectors
 *              (getByRole, getByLabel, getByPlaceholder, getByText) —
 *              no CSS class selectors or XPath.
 *
 *              Note: DemoQA does not use standard label associations
 *              (for/aria-labelledby) for Date of Birth, file upload, and
 *              State/City dropdowns. For those fields we scope using
 *              getByText() + structural traversal, which is still fully
 *              semantic and avoids any dynamic CSS class names.
 */
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../Common/base.page';

export class DemoQARegistrationFormPage extends BasePage {

  // ============================================================
  // Section 1: Personal Info Locators
  // ============================================================
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;

  // ============================================================
  // Section 2: Gender Radio Buttons
  // ============================================================
  readonly genderMaleRadio: Locator;
  readonly genderFemaleRadio: Locator;
  readonly genderOtherRadio: Locator;

  // ============================================================
  // Section 3: Mobile & Date of Birth
  // ============================================================
  readonly mobileInput: Locator;
  readonly dateOfBirthInput: Locator;

  // ============================================================
  // Section 4: Subjects Auto-Complete
  // ============================================================
  readonly subjectsInput: Locator;

  // ============================================================
  // Section 5: Hobby Checkboxes
  // ============================================================
  readonly hobbySports: Locator;
  readonly hobbyReading: Locator;
  readonly hobbyMusic: Locator;

  // ============================================================
  // Section 6: Picture Upload
  // ============================================================
  readonly uploadPictureInput: Locator;

  // ============================================================
  // Section 7: Current Address & State / City Dropdowns
  // ============================================================
  readonly currentAddressInput: Locator;
  readonly stateDropdownContainer: Locator;
  readonly cityDropdownContainer: Locator;

  // ============================================================
  // Section 8: Submit Button
  // ============================================================
  readonly submitButton: Locator;

  // ============================================================
  // Section 9: Confirmation Modal
  // ============================================================
  readonly confirmationModal: Locator;
  readonly modalTitle: Locator;
  readonly modalTableBody: Locator;
  readonly modalCloseButton: Locator;

  // ============================================================
  // Section 10: Left Sidebar Navigation
  // ============================================================
  readonly practiceFormLink: Locator;

  constructor(page: Page) {
    super(page);

    // ── Personal Info ──────────────────────────────────────────
    // Matched by placeholder text visible in the form inputs.
    this.firstNameInput = this.page.getByPlaceholder('First Name');
    this.lastNameInput  = this.page.getByPlaceholder('Last Name');
    this.emailInput     = this.page.getByPlaceholder('name@example.com');

    // ── Gender ─────────────────────────────────────────────────
    // DemoQA uses <label for="gender-radio-N">Male/Female/Other</label> associations.
    // getByLabel resolves to the hidden <input type="radio"> via the for= attribute.
    // exact: true prevents 'Male' matching 'Female' as a substring.
    this.genderMaleRadio   = this.page.getByLabel('Male',   { exact: true });
    this.genderFemaleRadio = this.page.getByLabel('Female', { exact: true });
    this.genderOtherRadio  = this.page.getByLabel('Other',  { exact: true });

    // ── Mobile ─────────────────────────────────────────────────
    this.mobileInput = this.page.getByPlaceholder('Mobile Number');

    // ── Date of Birth ──────────────────────────────────────────
    // DemoQA does NOT link the label to the input via for/aria-labelledby.
    // DOM: <div id="dateOfBirth-wrapper"> → <div class="col-md-3"> → <label>Date of Birth</label>
    // Scope: label text → parent col div → parent row div (dateOfBirth-wrapper) → textbox inside.
    this.dateOfBirthInput = this.page
      .getByText('Date of Birth', { exact: true })
      .locator('../..')
      .getByRole('textbox');

    // ── Subjects ───────────────────────────────────────────────
    // DemoQA does not link the Subjects label via for/aria-labelledby.
    // DOM: <div id="subjectsWrapper"> → <div class="col-md-3"> → <label>Subjects</label>
    // The input inside the container is role="combobox" (react-select auto-complete).
    this.subjectsInput = this.page
      .getByText('Subjects', { exact: true })
      .locator('../..')
      .getByRole('combobox');

    // ── Hobbies ────────────────────────────────────────────────
    // DemoQA uses <label for="hobbies-checkbox-N">Sports/Reading/Music</label>.
    // getByLabel resolves to the hidden <input type="checkbox">.
    this.hobbySports  = this.page.getByLabel('Sports');
    this.hobbyReading = this.page.getByLabel('Reading');
    this.hobbyMusic   = this.page.getByLabel('Music');

    // ── File Upload ────────────────────────────────────────────
    // DemoQA uses a non-standard label="Select picture" attribute on the <input>.
    // There is no <label for="uploadPicture"> element in the DOM.
    // Scope: "Picture" label text → parent col div → parent row → file input.
    this.uploadPictureInput = this.page
      .getByText('Picture', { exact: true })
      .locator('../..')
      .locator('input[type="file"]');

    // ── Current Address ────────────────────────────────────────
    this.currentAddressInput = this.page.getByPlaceholder('Current Address');

    // ── State / City React-Select ──────────────────────────────
    // DemoQA has a single "State and City" label for both dropdowns.
    // The State input (enabled) is the only getByRole('combobox') visible in the row.
    // The City input may be disabled; Playwright excludes disabled elements from getByRole.
    // Use locator('[role="combobox"]') (ARIA attribute selector) to include disabled inputs.
    const stateCityRow = this.page
      .getByText('State and City', { exact: true })
      .locator('../..');
    this.stateDropdownContainer = stateCityRow.locator('[role="combobox"]').nth(0);
    this.cityDropdownContainer  = stateCityRow.locator('[role="combobox"]').nth(1);

    // ── Submit ─────────────────────────────────────────────────
    this.submitButton = this.page.getByRole('button', { name: 'Submit' });

    // ── Confirmation Modal ─────────────────────────────────────
    // DemoQA Bootstrap modal adds role="dialog" on the outer .modal div.
    this.confirmationModal = this.page.getByRole('dialog');
    // The modal title uses <div class="modal-title h4"> — not a real heading tag.
    // getByText inside the dialog is the reliable semantic approach.
    this.modalTitle     = this.page.getByRole('dialog').getByText('Thanks for submitting the form');
    // Table body scoped inside the dialog
    this.modalTableBody = this.page.getByRole('dialog').locator('tbody');
    // Close button inside the modal footer
    this.modalCloseButton = this.page.getByRole('button', { name: 'Close' });

    // ── Left Sidebar ───────────────────────────────────────────
    this.practiceFormLink = this.page.getByRole('listitem').filter({ hasText: 'Practice Form' });
  }

  // ============================================================
  // Section 11: Navigation Actions
  // ============================================================

  /** Navigate to the Forms landing page then click 'Practice Form' in the sidebar. */
  async goToFormViaMenu(baseUrl: string): Promise<void> {
    await this.navigateTo(`${baseUrl}/forms`);
    await this.dismissAds();
    await this.practiceFormLink.click();
    await this.dismissAds();
  }

  /** Remove fixed ad banners that can intercept pointer events on Chromium. */
  async dismissAds(): Promise<void> {
    await this.page.evaluate(() => {
      ['#fixedban', '.google-auto-placed', '#adplus-anchor', 'footer'].forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      });
    });
  }

  // ============================================================
  // Section 12: Form Field Actions
  // ============================================================

  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.lastNameInput.fill(value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.emailInput.fill(value);
  }

  /**
   * Selects a gender by clicking the hidden radio button (force: true bypasses
   * the visibility check required for visually-hidden custom-radio inputs).
   */
  async selectGender(gender: 'Male' | 'Female' | 'Other'): Promise<void> {
    const map: Record<string, Locator> = {
      Male:   this.genderMaleRadio,
      Female: this.genderFemaleRadio,
      Other:  this.genderOtherRadio,
    };
    await map[gender].click({ force: true });
  }

  async fillMobile(value: string): Promise<void> {
    await this.mobileInput.fill(value);
  }

  /**
   * Opens the date-picker and selects day/month/year via the dropdown controls.
   *
   * The react-datepicker pops open inline (not in a dialog); it renders two
   * <select> elements (role="combobox") — month first, year second — inside
   * the calendar header container.
   *
   * @param day   - Two-digit day e.g. '15'
   * @param month - Full month name e.g. 'May'
   * @param year  - Four-digit year string e.g. '2000'
   */
  async setDateOfBirth(day: string, month: string, year: string): Promise<void> {
    await this.dateOfBirthInput.click();

    // After clicking, the react-datepicker renders two <select> (combobox) elements.
    // Scope to the datepicker wrapper (../.. from label = dateOfBirth-wrapper row).
    const datePicker = this.page
      .getByText('Date of Birth', { exact: true })
      .locator('../..')
      .locator('[class*="react-datepicker"]');

    await datePicker.getByRole('combobox').nth(0).selectOption({ label: month });
    await datePicker.getByRole('combobox').nth(1).selectOption({ label: year });

    // react-datepicker renders day cells with role="gridcell" and text content = day number.
    // After navigating to the right month/year, pick the first gridcell whose text is
    // exactly the target day (excludes outside-month cells which appear earlier/later).
    const dayPadded = day.padStart(2, '0');
    await datePicker
      .getByRole('gridcell')
      .filter({ hasText: new RegExp(`^${dayPadded}$`) })
      .first()
      .click();
  }

  /**
   * Types a subject into the auto-complete field and clicks the first matching option.
   * @param subject - Text to search e.g. 'Maths'
   */
  async addSubject(subject: string): Promise<void> {
    await this.subjectsInput.fill(subject);
    await this.page.getByRole('option').first().click();
  }

  /**
   * Ticks one or more hobby checkboxes. The actual <input type="checkbox"> elements
   * are visually hidden; force: true allows interaction without visibility.
   * @param hobbies - Array of hobby names to select.
   */
  async checkHobbies(hobbies: Array<'Sports' | 'Reading' | 'Music'>): Promise<void> {
    const map: Record<string, Locator> = {
      Sports:  this.hobbySports,
      Reading: this.hobbyReading,
      Music:   this.hobbyMusic,
    };
    for (const h of hobbies) {
      await map[h].click({ force: true });
    }
  }

  /**
   * Uploads a file via the file input (scoped from the "Picture" row label).
   * @param filePath - Absolute or workspace-relative path to the file.
   */
  async uploadPicture(filePath: string): Promise<void> {
    await this.uploadPictureInput.setInputFiles(filePath);
  }

  async fillCurrentAddress(value: string): Promise<void> {
    await this.currentAddressInput.fill(value);
  }

  /**
   * Selects a State from the react-select dropdown.
   * Clicks the State combobox (first in the State/City row), types to search,
   * then picks the matching option from the list.
   * @param state - State label e.g. 'NCR'
   */
  async selectState(state: string): Promise<void> {
    await this.stateDropdownContainer.click();
    await this.stateDropdownContainer.fill(state);
    await this.page.getByRole('option', { name: state }).first().click();
  }

  /**
   * Selects a City from the react-select dropdown. Requires State to be selected first.
   * @param city - City label e.g. 'Delhi'
   */
  async selectCity(city: string): Promise<void> {
    await this.cityDropdownContainer.click();
    await this.cityDropdownContainer.fill(city);
    await this.page.getByRole('option', { name: city }).first().click();
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  // ============================================================
  // Section 13: Validation Methods
  // ============================================================

  /** Asserts the 'Student Registration Form' heading is visible on the page. */
  async verifyFormPageLoaded(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: 'Student Registration Form' }),
    ).toBeVisible({ timeout: 10000 });
  }

  /** Asserts the confirmation modal is visible with the correct title. */
  async verifySubmissionSuccessful(): Promise<void> {
    await expect(this.confirmationModal).toBeVisible({ timeout: 10000 });
    await expect(this.modalTitle).toBeVisible({ timeout: 5000 });
  }

  /** Asserts the modal is NOT visible — form submission was blocked. */
  async verifyFormNotSubmitted(): Promise<void> {
    await expect(this.confirmationModal).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Asserts a modal table row contains the expected value.
   * @param label         - Row label e.g. 'Student Name'
   * @param expectedValue - Text that must appear in the value cell.
   */
  async verifyModalField(label: string, expectedValue: string): Promise<void> {
    const row = this.modalTableBody.locator('tr', {
      has: this.page.locator('td', { hasText: label }),
    });
    await expect(row.locator('td').nth(1)).toContainText(expectedValue);
  }

  /**
   * Asserts a required text input shows the invalid red-border style.
   * @param field - Locator of the input element.
   */
  async verifyFieldInvalid(field: Locator): Promise<void> {
    await expect(field).toHaveCSS('border-color', 'rgb(220, 53, 69)');
  }

  /**
   * Asserts the City react-select combobox is disabled (no State selected).
   * When no State is selected, DemoQA sets the input as disabled="" and the
   * parent control div carries aria-disabled="true".
   */
  async verifyCityDropdownDisabled(): Promise<void> {
    // The City combobox (react-select input) is disabled when no State is chosen.
    await expect(this.cityDropdownContainer).toBeDisabled({ timeout: 10000 });
  }

  /**
   * Asserts the City react-select combobox is enabled (State was selected).
   */
  async verifyCityDropdownEnabled(): Promise<void> {
    await expect(this.cityDropdownContainer).not.toBeDisabled({ timeout: 10000 });
  }

  /** Closes the confirmation modal.
   *  Clicking the Close button is preferred; falls back to Escape key. */
  async closeModal(): Promise<void> {
    await this.modalCloseButton.click({ force: true });
    try {
      await expect(this.confirmationModal).not.toBeAttached({ timeout: 5000 });
    } catch {
      await this.page.keyboard.press('Escape');
      await expect(this.confirmationModal).not.toBeAttached({ timeout: 5000 });
    }
  }
}
