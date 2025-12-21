# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-page application (SPA) for generating custom cabinetry quotes. The application uses a **modular ES6 architecture** with separated concerns for maintainability and extensibility. It uses client-side localStorage for data persistence and sessionStorage for authentication.

**Technology Stack:**
- Vanilla JavaScript (ES6 modules)
- CSS3 with custom properties
- localStorage/sessionStorage APIs
- No frameworks or build tools required

## Architecture

### Modular File Structure

```
quotingTool/
├── src/                          # Source code
│   ├── css/
│   │   ├── main.css             # Main styles (layout, forms, buttons)
│   │   └── components.css        # Component-specific styles (modals, line items)
│   │
│   ├── js/
│   │   ├── app.js               # Main application entry point
│   │   │
│   │   ├── components/          # UI components
│   │   │   ├── auth.js          # Password authentication
│   │   │   ├── modals.js        # Help and Config modals
│   │   │   ├── quoteForm.js     # Client info, project settings, quote history
│   │   │   ├── lineItems.js     # Line item rendering and management
│   │   │   └── quoteSummary.js  # Quote totals display
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── calculator.js    # Pricing calculations
│   │   │   └── storage.js       # localStorage/sessionStorage operations
│   │   │
│   │   └── utils/               # Utilities
│   │       ├── constants.js     # All constants (rates, conversions, etc.)
│   │       ├── formatting.js    # formatCurrency(), formatDimension(), escapeHtml()
│   │       ├── validation.js    # Input validation
│   │       └── dom.js           # DOM manipulation helpers
│   │
│   └── index.html               # Main HTML (structure only, no inline JS/CSS)
│
├── package.json                 # npm scripts for dev server
├── README.md                    # User documentation
└── CLAUDE.md                    # This file (AI assistant guidance)
```

### Key Components

#### **app.js** - Main Application
- `QuoteApp` class manages application state
- Coordinates all components
- Handles line item CRUD operations
- Implements debounced auto-save
- Exposed as `window.quoteApp` for component callbacks

#### **services/calculator.js** - Core Calculation Logic
`calculateLineItem(item)` function:
1. Converts linear feet to meters (1 LF = 0.3048m)
2. Calculates door area based on cabinet heights and linear footage
3. Calculates carcass (box) surface area
4. Applies finish rates (shaped vs unshaped doors)
5. Adds drawer and accessory costs
6. Applies discount to cabinetry costs
7. **Converts USD pricing to CAD** using exchange rate
8. Adds shipping and installation (per LF, already in CAD)
9. Applies markup percentage to get final price

**Important**: Cabinetry pricing is in USD and gets converted to CAD, but shipping and installation are already in CAD.

#### **services/storage.js** - Data Persistence
- `saveCurrentQuote()` - Auto-save current working quote
- `loadCurrentQuote()` - Load last working quote
- `saveQuoteToHistory()` - Save named quote to history
- `getSavedQuotes()` - Get all saved quotes
- Error handling for QuotaExceededError and SecurityError

#### **components/lineItems.js** - Line Item Management
- `renderLineItems()` - Full re-render of all line items
- `updateLineItemDOM()` - Partial update for performance
- Attaches event listeners to line item inputs
- Handles collapse/expand, override toggles, delete

#### **utils/constants.js** - Configuration
- `FINISH_RATES` - Door finish pricing lookup table
- `CEILING_TO_MM` - Ceiling height to millimeter conversions
- `CEILING_TO_UPPER_HT` - Ceiling height to upper cabinet height mappings
- `CARCASS_RATES` - Supplier pricing
- `DEFAULT_RATES` - Shipping, install, drawer, accessory, exchange, markup, discount
- `STORAGE_KEYS` - localStorage/sessionStorage key names

### State Management

**Data Flow:**
1. User interacts with UI (inputs, buttons)
2. Event listeners call `QuoteApp` methods
3. `QuoteApp` updates `lineItems` array
4. Components re-render affected parts
5. `debouncedSave()` triggers after 500ms of inactivity
6. `saveCurrentQuote()` writes to localStorage

**Auto-save**: Debounced (500ms) to prevent excessive localStorage writes
**Manual save**: User clicks "Save Quote" → prompts for name → adds to `bosco_saved_quotes` array
**Quote loading**: Restores all form fields and line items from saved data

### Dimension Override System

The app uses a cascading priority system for dimensions:
1. **Line item override** (if enabled and value entered)
2. **Project default** (from sidebar settings)
3. **Hardcoded fallback** (system defaults in constants.js)

When ceiling height changes, upper cabinet height auto-updates via `CEILING_TO_UPPER_HT` lookup.

### localStorage Schema

**Keys** (defined in `utils/constants.js`):
- `bosco_current_quote`: Current working quote (auto-saved)
- `bosco_saved_quotes`: Array of manually saved quotes

**sessionStorage:**
- `bosco_auth`: Authentication flag ('true' when logged in)

## Development Workflow

### Running Locally

```bash
npm run dev
# Opens browser to http://localhost:8080 (serves src/ folder)
```

**Default password**: `bosco2024` (in `src/js/components/auth.js` line 10)

### Making Changes

#### **To modify rates/pricing:**
- Finish rates: Edit `src/js/utils/constants.js` → `FINISH_RATES`
- Ceiling/height mappings: Edit `src/js/utils/constants.js` → `CEILING_TO_MM`, `CEILING_TO_UPPER_HT`
- Default rates: Edit `src/js/utils/constants.js` → `DEFAULT_RATES`
- Default form values: Edit `src/index.html` input `value` attributes

#### **To change password:**
Edit `src/js/components/auth.js` line 10:
```javascript
const PASSWORD = 'bosco2024';
```

#### **To modify calculations:**
Edit `src/js/services/calculator.js` → `calculateLineItem()` function

#### **To change exchange rate default:**
Edit `src/js/utils/constants.js` → `DEFAULT_RATES.EXCHANGE_RATE`

#### **To add new UI components:**
1. Create new file in `src/js/components/`
2. Export initialization function and public methods
3. Import and initialize in `src/js/app.js`

### Testing Changes

After modifying calculation logic:
1. Clear localStorage: `localStorage.clear()` in browser console
2. Reload page and re-enter password
3. Create test line items with known values
4. Verify calculations against expected results

**Example test case**:
- 10 LF upper, 15 LF base, 5 LF pantry @ 8ft ceiling
- PVC unshaped, Holike carcass
- 8 drawers, 3 accessories
- Expected final price: ~$13,227.80

## Important Code Patterns

### Event Handling

**All buttons use proper IDs** (no inline `onclick` attributes):
```javascript
// Good - Modern approach
const addBtn = getElementById('addLineItemBtn');
addBtn.addEventListener('click', () => { /* ... */ });

// Bad - Old approach (don't use)
<button onclick="addLineItem()">Add Item</button>
```

**Critical button IDs:**
- `addLineItemBtn` - Add new line item
- `newQuoteBtn` - Create new quote
- `saveQuoteBtn` - Save quote to history
- `showHelpBtn`, `closeHelpBtn` - Help modal
- `showConfigBtn`, `closeConfigBtn` - Config modal
- `logoutBtn` - Logout

### Updating Line Items

The `QuoteApp.updateLineItem(id, field, value)` method:
1. Validates input (numeric fields, count fields)
2. Updates the in-memory data structure
3. Calculates new totals
4. Calls `updateLineItemDOM()` for partial DOM update (performance)
5. Updates quote summary
6. Triggers debounced save

### Adding New Finish Types

1. Add to `src/js/utils/constants.js` → `FINISH_RATES` object
2. Add `<option>` in `src/js/components/lineItems.js` → `renderFinishOptions()` (if exists) or in the template
3. Update help modal content in `src/index.html`

### Adding New Ceiling Heights

1. Add to `src/js/utils/constants.js`:
   - `CEILING_TO_MM` object
   - `CEILING_TO_UPPER_HT` object
2. Add `<option>` in `src/index.html`:
   - Project settings `#defaultCeiling` select
   - Line item ceiling override selects (in rendered templates)
3. Update help modal table in `src/index.html`

### Re-rendering vs Partial Updates

- **Full re-render**: `renderLineItems()` - rebuilds entire line items HTML
  - Use when: adding/removing items, toggling collapse, changing structure
- **Partial update**: `updateLineItemDOM()` - updates specific elements by ID
  - Use when: user types in input, changes dropdown value
  - Much faster, avoids losing input focus

### XSS Protection

**Always escape user input** when rendering HTML:
```javascript
import { escapeHtml } from '../utils/formatting.js';

// Good
container.innerHTML = `<div>${escapeHtml(item.name)}</div>`;

// Bad (XSS vulnerability)
container.innerHTML = `<div>${item.name}</div>`;
```

The `escapeHtml()` function escapes `<`, `>`, `&`, `"`, `'` characters.

## Deployment

This is a static site - just serve the `src/` folder.

### Deployment Options

**Netlify**:
1. Deploy the `quotingTool` folder
2. Set publish directory to `src/`

**GitHub Pages**:
```bash
git add .
git commit -m "Deploy"
git push
# Enable Pages in repo settings, set source to /src folder
```

**Any static host**: Upload entire `src/` folder

### Production Checklist

1. **Change password** (`src/js/components/auth.js` line 10)
2. **Test on target browsers** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
3. **Verify HTTPS** is enabled (required for localStorage to work properly)
4. **Warn users** about localStorage limitations (browser-specific, cleared with cache)
5. **Consider server-side auth** for true security (current auth is client-side only)

## Common Tasks

### Add "Open Shelf" option (Already Implemented)
Open shelf items have no door cost. Check `item.openShelf === 'yes'` in `src/js/services/calculator.js` → `calculateLineItem()`.

### Modify Exchange Rate
The USD to CAD conversion applies to cabinetry costs only. Shipping and installation are already in CAD. Exchange rate:
- Default: `src/js/utils/constants.js` → `DEFAULT_RATES.EXCHANGE_RATE`
- User input: Config modal "Rates" tab → `#exchangeRate` input

### Change Install Rates by Project Type
- Full House: $100/LF (default)
- Single Project: $120/LF

Auto-updates when project type changes (see `src/js/components/quoteForm.js` → `handleProjectTypeChange()`).

### Debug Calculation Issues
1. Check browser console for errors (F12)
2. Add `console.log()` in `src/js/services/calculator.js` → `calculateLineItem()`
3. Verify dimension overrides aren't interfering
4. Check cost breakdown in line item footer
5. Verify `getProjectSettings()` is reading correct form values
6. Compare against README calculation examples

### Add New Input Field to Line Items

1. **Add to data model** (`src/js/app.js` → `addLineItem()` method):
   ```javascript
   this.lineItems.push({
       id,
       name: '',
       myNewField: 0,  // Add here
       // ... other fields
   });
   ```

2. **Add to render template** (`src/js/components/lineItems.js` → `renderLineItem()`):
   ```javascript
   <input type="text" value="${item.myNewField || ''}"
          onchange="window.quoteApp.updateLineItem(${item.id}, 'myNewField', this.value)">
   ```

3. **Add validation** (if needed) (`src/js/app.js` → `updateLineItem()` method):
   ```javascript
   const numericFields = [..., 'myNewField'];
   ```

4. **Update calculations** (if affects pricing) (`src/js/services/calculator.js` → `calculateLineItem()`).

5. **Save/Load** automatically handles all fields (no changes needed).

## Security Notes

**Current authentication**: Client-side password check only (sessionStorage flag)

**For production**: Password is visible in source code. This provides minimal security against casual access but is not secure against determined users. Consider:
- Server-side authentication for production deployment
- Environment variables for sensitive configuration
- HTTPS is mandatory

**Data privacy**: All quote data stored in browser localStorage is not encrypted and tied to specific browser/device.

**XSS Protection**: All user input is escaped via `escapeHtml()` before rendering to prevent XSS attacks.

## Code Style

When modifying this codebase:
- **Maintain modular architecture** - don't merge files back into one
- **Use ES6 modules** - import/export, not global functions
- **Use proper event listeners** - `addEventListener()`, not inline `onclick`
- **Keep vanilla JavaScript** - no frameworks
- **Use template strings** for HTML generation
- **Escape user input** with `escapeHtml()` when rendering
- **Format currency** with `formatCurrency()` helper
- **Format dimensions** with `formatDimension()` helper
- **Validate inputs** using `utils/validation.js` functions
- **Maintain CSS custom property naming** (--bg-*, --text-*, --accent*)
- **Use CAD currency display format**: `formatCurrency()` appends " CAD"

## Troubleshooting

### Line Items Not Showing
- Check browser console for module loading errors
- Verify `window.quoteApp` exists (type in console)
- Check if `#addLineItemBtn` button has event listener attached
- Verify `renderLineItems()` is being called after auth success

### Buttons Not Working
- Verify button IDs match what JavaScript expects
- Check that event listeners are attached in component init functions
- Look for console errors about undefined elements

### Calculations Wrong
- Verify exchange rate is applied correctly (only to cabinetry, not shipping/install)
- Check that dimension overrides are working as expected
- Add console.logs in `calculateLineItem()` to trace values
- Verify `getProjectSettings()` returns correct form values

### Auto-Save Not Working
- Check localStorage is available (not in private browsing mode)
- Verify `debouncedSave()` is being called on changes
- Check browser console for QuotaExceededError
- Verify `STORAGE_KEYS.CURRENT_QUOTE` key exists in localStorage
