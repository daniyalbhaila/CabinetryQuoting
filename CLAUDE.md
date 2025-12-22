# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-page application (SPA) for generating custom cabinetry quotes. The application uses a **modular ES6 architecture** with separated concerns for maintainability and extensibility. It uses client-side localStorage for data persistence and sessionStorage for authentication.

**Technology Stack:**
- Vanilla JavaScript (ES6 modules)
- CSS3 with custom properties
- localStorage/sessionStorage APIs
- No frameworks or build tools required

**Version 3.0 Key Features:**
- **3-Tier Configuration System**: Global defaults → Quote overrides → Line item overrides
- **Progressive Disclosure UI**: Basic (always visible, 3 columns) + Advanced (collapsed) sections
- **Cascading Resolution**: Settings cascade from global to quote to line item level
- **Project-Type-Specific Rates**: Different markup/install rates for full house vs single project
- **Visual Hierarchy**: Clear indicators showing which tier is being used
- **Smart Defaults**: Markup rate auto-selects based on project type unless overridden

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
│   │   │   ├── modals.js        # Help and Global Settings modals
│   │   │   ├── quoteForm.js     # Client info, project settings, quote history, quote-level overrides
│   │   │   ├── lineItems.js     # Line item rendering with Basic/Advanced sections
│   │   │   ├── quoteSummary.js  # Quote totals display
│   │   │   └── breakdown.js     # Calculation breakdown modal
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── calculator.js    # Pricing calculations with 3-tier resolution
│   │   │   └── storage.js       # localStorage/sessionStorage + global config management
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

#### **services/calculator.js** - Core Calculation Logic with 3-Tier Resolution
Key functions:
- `getProjectSettings()` - Resolves quote-level and global settings (TIER 1 & 2)
- `getEffectiveDimensions(item)` - Resolves dimensions through 3 tiers
- `getEffectiveRates(item)` - Resolves rates through 3 tiers
- `calculateLineItem(item)` - Main calculation using resolved settings

Calculation steps:
1. Resolve all settings through 3-tier cascade (line item → quote → global)
2. Convert linear feet to meters (1 LF = 0.3048m)
3. Calculate door area based on cabinet heights and linear footage
4. Calculate carcass (box) surface area **only if LF > 0** (v3.0 fix)
5. Apply finish rates (shaped vs unshaped doors, or 0 for open shelf)
6. Add drawer and accessory costs
7. Apply discount to cabinetry costs
8. **Convert USD pricing to CAD** using exchange rate
9. Add shipping and installation (per LF, already in CAD)
10. Add additional items (already in CAD)
11. Apply markup percentage to get final price

**Important**: Cabinetry pricing is in USD and gets converted to CAD, but shipping and installation are already in CAD.

#### **services/storage.js** - Data Persistence + Global Config Management
Quote operations:
- `saveCurrentQuote()` - Auto-save current working quote (v2 schema with overrides)
- `loadCurrentQuote()` - Load last working quote
- `saveQuoteToHistory()` - Save named quote to history
- `getSavedQuotes()` - Get all saved quotes

Global config operations (NEW in v3.0):
- `loadGlobalConfig()` - Load global defaults from localStorage
- `saveGlobalConfig(config)` - Save global defaults
- `ensureGlobalConfig()` - Load or create global config with factory defaults
- Auto-migration from v1/v2 quotes to v3 schema

Error handling for QuotaExceededError and SecurityError

#### **components/lineItems.js** - Line Item Management with Progressive Disclosure
Rendering structure:
- `renderLineItems()` - Full re-render of all line items
- `renderLineItemBody()` - Splits into Basic and Advanced sections
- `renderBasicSection()` - Always visible, 3 columns:
  - `renderLinearFootageSection()` - Upper/Base/Pantry LF
  - `renderFinishSection()` - Finish, Shaped, Open Shelf, Drawers, Accessories
  - `renderRoomSettingsSection()` - Ceiling Height, Carcass Supplier (NEW in v3.0)
- `renderAdvancedSection()` - Collapsed by default: Dimension Overrides, Pricing, Additional Items
- `updateLineItemDOM()` - Partial update for performance

Event handling:
- Uses event delegation on line items container
- Handles: update, delete, toggle-collapse, toggle-override, toggle-advanced, toggle-config-override
- Supports additional items (add/remove)

#### **components/quoteForm.js** - Quote Management + Quote-Level Overrides
Form operations:
- Client info and project settings management
- Quote history rendering and loading
- Project type change handling (affects install rate)

Quote-level override operations (NEW in v3.0):
- `setupQuoteSettingsCard()` - Initializes quote override UI in Project Settings dropdown
- `loadQuoteOverrides(quoteData)` - Loads quote overrides into form
- `getQuoteOverrides()` - Extracts non-empty quote overrides from form
- `resetQuoteOverrides()` - Clears all quote overrides
- `updateQuoteSettingsDisplay()` - Updates visual indicators and badges

#### **components/breakdown.js** - Calculation Breakdown Modal (NEW in v3.0)
- Shows detailed step-by-step calculation for a line item
- Displays metric conversions, area calculations, cost components
- Visual breakdown of USD → CAD conversion, markup, etc.

#### **utils/constants.js** - Factory Defaults Configuration
Material rates (used in global config):
- `FINISH_RATES` - Door finish pricing lookup table
- `CARCASS_RATES` - Supplier pricing
- `DEFAULT_RATES` - Factory defaults for shipping, install, drawer, accessory, exchange, markup, discount

Dimension mappings:
- `CEILING_TO_MM` - Ceiling height to millimeter conversions
- `CEILING_TO_UPPER_HT` - Ceiling height to upper cabinet height mappings

Storage keys:
- `STORAGE_KEYS` - localStorage/sessionStorage key names

### State Management

**Data Flow:**
1. User interacts with UI (inputs, buttons)
2. Event listeners call `QuoteApp` methods
3. `QuoteApp` updates `lineItems` array and `quoteOverrides` object
4. Components re-render affected parts
5. `debouncedSave()` triggers after 500ms of inactivity
6. `saveCurrentQuote()` writes to localStorage (v2 schema with overrides)

**Auto-save**: Debounced (500ms) to prevent excessive localStorage writes
**Manual save**: User clicks "Save Quote" → prompts for name → adds to `bosco_saved_quotes` array
**Quote loading**: Restores all form fields, line items, and overrides from saved data
**Global config**: Persists separately in `bosco_global_config` and auto-initializes with factory defaults

### 3-Tier Configuration System (v3.0)

The application uses a cascading resolution system with three tiers:

#### TIER 1: Global Defaults
**Storage**: `localStorage: bosco_global_config`
**Location**: Global Settings modal (header button)
**Purpose**: Company-wide defaults for all new quotes
**Schema**:
```javascript
{
  version: 1,
  rates: {
    shippingRate,
    installRate,
    drawerRate,
    accessoryRate,
    exchangeRate,
    markupRateFull,      // NEW: 80% for full house (default)
    markupRateSingle,    // NEW: 90% for single project (default)
    discountRate
  },
  dimensions: { defaultUpperHt, defaultBaseHt, defaultUpperDp, defaultBaseDp, defaultPantryDp },
  materials: { finishRates, carcassRates }
}
```
**Functions**: `loadGlobalConfig()`, `saveGlobalConfig()`, `ensureGlobalConfig()`
**Auto-Selection**: Markup rate automatically chosen based on project type (full/single)

#### TIER 2: Quote-Level Overrides
**Storage**: Part of quote object in `bosco_current_quote` under `overrides` property
**Location**: Project Settings card → "Custom Rates for This Quote" dropdown
**Purpose**: Override global defaults for a specific quote (e.g., special client pricing)
**Schema**:
```javascript
{
  overrides: {
    shippingRate: 75,        // Override (custom)
    installRate: null,       // Not set (uses global)
    drawerRate: 250,         // Override (custom)
    // ... other rates/dimensions
  }
}
```
**Functions**: `getQuoteOverrides()`, `loadQuoteOverrides()`, `resetQuoteOverrides()`

#### TIER 3: Line-Item Overrides
**Storage**: Part of line item object in `lineItems` array
**Location**: Line item → Advanced Settings → Pricing Overrides / Dimensions
**Purpose**: Override settings for a specific room (e.g., bathroom has 9ft ceiling while rest is 8ft)
**Schema**:
```javascript
{
  overrideShippingRate: null,  // Not set (uses quote or global)
  overrideMarkupRate: 90,      // Override (custom for this room)
  ceilingFt: "9",             // Override (custom ceiling)
  upperHt: 0,                  // Not set (auto-calculated from ceiling)
  // ... other overrides
}
```

#### Resolution Logic
The calculator uses **nullish coalescing** to cascade through tiers:
```javascript
// Example: Resolve shipping rate for a line item
const shippingRate =
    item.overrideShippingRate ??      // TIER 3: Line item override
    quote.overrides?.shippingRate ??  // TIER 2: Quote override
    globalConfig.rates.shippingRate;  // TIER 1: Global default
```

**Key functions**:
- `getProjectSettings()` - Resolves TIER 1 & 2 (global + quote)
- `getEffectiveRates(item)` - Resolves all 3 tiers for rates
- `getEffectiveDimensions(item)` - Resolves all 3 tiers for dimensions

**Visual Indicators**:
- Quote level: Badge shows "Global" or "X Custom"
- Line item level: Status text shows "Using quote defaults" or "Custom settings"

#### Dimension Auto-Calculation
When ceiling height changes, upper cabinet height auto-updates via `CEILING_TO_UPPER_HT` lookup:
- 8ft ceiling → 760mm upper height
- 9ft ceiling → 920mm upper height
- etc.

This cascades through the same 3-tier system.

### localStorage Schema

**Keys** (defined in `utils/constants.js`):
- `bosco_global_config`: Global defaults for all quotes (NEW in v3.0)
- `bosco_current_quote`: Current working quote (auto-saved, v2 schema with overrides)
- `bosco_saved_quotes`: Array of manually saved quotes

**sessionStorage:**
- `bosco_auth`: Authentication flag ('true' when logged in)

**Data Schema Evolution**:
- v1: Flat structure, no global config, no quote overrides
- v2 (v3.0): Global config separate, quotes have `overrides` object, line items have individual override fields
- Auto-migration: v1 quotes automatically upgrade to v2 on load

## Development Workflow

### Running Locally

```bash
npm run dev
# Opens browser to http://localhost:8080 (serves src/ folder)
```

**Default password**: `bosco2024` (in `src/js/components/auth.js` line 10)

### Making Changes

#### **To modify default rates/pricing:**
**v3.0 NOTE**: Rates are now stored in global config, not hardcoded!
- Factory defaults: Edit `src/js/utils/constants.js` → `DEFAULT_RATES`, `FINISH_RATES`, `CARCASS_RATES`
- User's global defaults: Use Global Settings modal in UI (persists to localStorage)
- Ceiling/height mappings: Edit `src/js/utils/constants.js` → `CEILING_TO_MM`, `CEILING_TO_UPPER_HT`

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
