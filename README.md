# Bosco Cabinetry Quote Calculator

A professional, secure quote calculator for custom cabinetry projects. Built with a modular ES6 architecture for maintainability and future extensibility.

## ⚡ Quick Start

```bash
npm run dev
# Opens browser to http://localhost:8080
# Default password: bosco2024
```

## Features

### 🔐 Security
- **Password Protection**: Client-side password authentication prevents unauthorized access
- **Session Management**: Users stay logged in during their session
- **Default Password**: `bosco2024` (change in `src/js/components/auth.js` line 10)
- **XSS Protection**: All user input is escaped to prevent security vulnerabilities

### 🎯 3-Tier Configuration System (NEW in v3.0)
- **Global Defaults**: Set default rates and dimensions once for all new quotes
- **Quote-Level Overrides**: Customize specific rates for individual quotes
- **Line-Item Overrides**: Fine-tune pricing for specific rooms/sections
- **Clear Visual Hierarchy**: See at a glance which settings are custom vs. defaults
- **Easy Reset**: Revert overrides back to defaults with one click

### 💾 Data Persistence
- **Auto-Save**: Current quote automatically saves to localStorage on every change
- **Quote History**: Save multiple quotes with custom names
- **Resume Work**: Automatically loads last working quote on page load
- **No Data Loss**: All data stored locally in browser
- **Global Config**: Your default settings persist across all quotes

### 📋 Quote Management
- **Client Information**: Track client name, project name, and date
- **Multiple Line Items**: Add unlimited rooms/sections per quote
- **Custom Naming**: Name each line item (Kitchen, Bathroom, etc.)
- **Save & Load**: Save quotes to history and reload them anytime
- **New Quote**: Start fresh while auto-saving previous work

### 🧮 Calculation Features
- **Linear Footage Pricing**: Upper cabinets, base cabinets, pantry cabinets
- **Multiple Finishes**: PVC, Melamine, Skin, Paint/Lacquer, Powder, Veneer, PET
- **Shaped Doors**: Different pricing for shaped vs. unshaped doors
- **Open Shelf Option**: Zero door cost for open shelving
- **Add-ons**: Drawer and accessory pricing
- **Carcass Suppliers**: Holike ($65/sqm) or Allure ($200/sqm)
- **Ceiling Heights**: 8ft to 13ft with auto-adjusting upper cabinet heights (per room)
- **3-Tier Dimension Overrides**: Global → Quote → Line Item cascading resolution
- **3-Tier Rate Overrides**: Customize shipping, install, drawer, accessory, markup, discount at any level
- **Project Types**: Full house vs. single project (affects install rates AND markup rates)
  - Full House: 100/LF install, 80% markup (default)
  - Single Project: 120/LF install, 90% markup (default)
- **Real-time Updates**: All calculations update instantly
- **Additional Items**: Add custom line items with CAD pricing per room

### 🎨 User Interface
- **Dark Theme**: Professional dark UI with gold accents
- **Responsive Design**: Works on desktop and mobile
- **Progressive Disclosure**: Basic fields always visible, advanced options collapsed
- **Collapsible Sections**: Organize settings and line items
- **Sticky Header**: Total always visible while scrolling
- **Visual Feedback**: Smooth animations and hover effects
- **Status Indicators**: Clear badges showing custom vs. global settings
- **Keyboard Friendly**: Tab navigation support
- **Help Modal**: Built-in user guide accessible from header
- **Clean Hierarchy**: Visual spacing makes sections easy to scan

---

## How to Use

### Getting Started

1. **Login**: Enter password `bosco2024` to access the calculator
2. **Set Global Defaults** (One-Time Setup):
   - Click "Global Settings" in header
   - Set your default rates (shipping, install, drawer, accessory, markup, discount)
   - Set default dimensions (upper height, base height, depths)
   - Click "Close" - these apply to all new quotes
3. **Fill Client Info**: Add client name, project name, and date in sidebar
4. **Configure Project**: Set project type, ceiling height, carcass supplier
5. **Customize Quote (Optional)**: Expand "Custom Rates for This Quote" in Project Settings to override global defaults for this specific quote
6. **Add Line Items**: Click "Add Item" to create rooms/sections
7. **Save Quote**: Click "Save Quote" in sidebar to preserve your work

### Adding Line Items

Each line item represents a room or cabinet section with Basic and Advanced settings:

#### Basic Section (Always Visible - 3 Columns)
**Column 1: Linear Footage**
1. **Upper LF**: Linear feet of upper cabinets
2. **Base LF**: Linear feet of base cabinets
3. **Pantry LF**: Linear feet of pantry cabinets

**Column 2: Finish & Options**
1. **Finish**: Select door finish type (PVC, Melamine, etc.)
2. **Shaped Doors**: Choose if doors are shaped/profiled
3. **Open Shelf**: Enable for zero door cost
4. **Drawers**: Number of drawers
5. **Accessories**: Number of accessories

**Column 3: Room Settings**
1. **Ceiling Height**: Override project default (8ft-13ft)
2. **Carcass Supplier**: Holike or Allure

#### Advanced Section (Collapsed by Default)
Click "Advanced Settings" to access:
- **Dimension Overrides**: Override cabinet heights and depths for this specific room (height/depth in mm)
- **Pricing Overrides**: Override shipping, install, drawer, accessory, markup, discount rates for this specific room
- **Additional Items**: Add custom line items (e.g., "Crown Molding - $500 CAD")

**Tip**: Most users only need the Basic section (90% of use cases). Advanced options provide room-level customization when needed.

### Saving & Loading Quotes

**To Save:**
- Click "Save Quote" button in Saved Quotes section
- Enter a descriptive name
- Quote appears in history list

**To Load:**
- Click any quote in the Saved Quotes list
- All data loads instantly
- Continue editing or start new

**To Start New:**
- Click "New Quote" button
- Current work auto-saves first
- Fresh quote ready

---

## How Calculations Work

### Overview

The calculator uses a comprehensive formula to price custom cabinetry based on:
1. Cabinet dimensions and linear footage
2. Door finish types and styling
3. Carcass material and supplier
4. Shipping and installation costs
5. Business markup and customer discounts

### Step-by-Step Calculation Process

#### 1. Dimension Resolution

**Input**: Linear footage for each cabinet type
- Upper Cabinets (LF)
- Base Cabinets (LF)
- Pantry Cabinets (LF)

**Conversion**: Linear feet → meters
```
meters = linear_feet × 0.3048
```

**Heights** (automatically calculated from ceiling height):
| Ceiling | Upper Height | Conversion |
|---------|-------------|-----------|
| 8 ft    | 760mm       | ~30"      |
| 9 ft    | 920mm       | ~36"      |
| 10 ft   | 1070mm      | ~42"      |
| 11 ft   | 1220mm      | ~48"      |
| 12 ft   | 1320mm      | ~52"      |
| 13 ft   | 1473mm      | ~58"      |

**Depths** (default, can be overridden):
- Upper Cabinets: 300mm (12")
- Base Cabinets: 600mm (24")
- Pantry Cabinets: 600mm (24")

**Base Height** (fixed):
- Base Cabinets: 920mm (36")

**Pantry Height**:
- Uses full ceiling height (e.g., 8ft ceiling = 2450mm)

#### 2. Area Calculations

**Door Area** (square meters):
```
Door Area = (Upper LF × Upper Height) +
            (Base LF × Base Height) +
            (Pantry LF × Ceiling Height)

Example for 10 LF upper, 15 LF base, 5 LF pantry @ 8ft ceiling:
Upper:  10 × 0.3048m × 0.760m = 2.316 sqm
Base:   15 × 0.3048m × 0.920m = 4.206 sqm
Pantry: 5 × 0.3048m × 2.450m = 3.734 sqm
Total Door Area = 10.256 sqm
```

**Carcass Area** (box surface area):
```
For each cabinet type:
Carcass Area = (2 × Height × Depth) +    // Two sides
               (2 × Length × Depth) +     // Back and bottom
               (Length × Height)          // Face frame area

Example for 10 LF upper @ 8ft ceiling:
Length = 10 × 0.3048 = 3.048m
Height = 0.760m
Depth = 0.300m

Sides:  2 × 0.760 × 0.300 = 0.456 sqm
Back:   2 × 3.048 × 0.300 = 1.829 sqm
Frame:  3.048 × 0.760 = 2.316 sqm
Total = 4.601 sqm (for upper cabinets only)
```

#### 3. Cost Components

**A. Door Costs**
```
Door Cost = Door Area × Finish Rate

Finish Rates ($/sqm):
┌──────────────┬──────────┬─────────┐
│ Finish Type  │ Unshaped │ Shaped  │
├──────────────┼──────────┼─────────┤
│ PVC          │ $100     │ $200    │
│ Melamine     │ $70      │ $70     │
│ Skin         │ $150     │ $150    │
│ Paint/Lacquer│ $170     │ $200    │
│ Powder       │ $100     │ $200    │
│ Veneer       │ $440     │ $440    │
│ PET          │ $110     │ $110    │
└──────────────┴──────────┴─────────┘

Example:
10.256 sqm × $100/sqm (PVC unshaped) = $1,025.60
```

**B. Carcass Costs**
```
Carcass Cost = Carcass Area × Supplier Rate

Supplier Rates:
- Holike: $65/sqm
- Allure: $200/sqm

Example:
14.5 sqm × $65/sqm (Holike) = $942.50
```

**C. Drawer Costs**
```
Drawer Cost = Number of Drawers × Drawer Rate

Default: $200/drawer

Example:
8 drawers × $200 = $1,600
```

**D. Accessory Costs**
```
Accessory Cost = Number of Accessories × Accessory Rate

Default: $300/accessory

Example:
3 accessories × $300 = $900
```

#### 4. Discount Application

**Gross Cabinetry Cost**:
```
Gross = Door Cost + Carcass Cost + Drawer Cost + Accessory Cost

Example:
$1,025.60 + $942.50 + $1,600 + $900 = $4,468.10
```

**After Discount**:
```
Cabinetry Cost = Gross × (1 - Discount Rate)

Default discount: 50% (0.50)

Example:
$4,468.10 × (1 - 0.50) = $2,234.05
```

#### 5. Shipping & Installation

**Shipping**:
```
Shipping = Total LF × Shipping Rate

Default: $60/LF

Example:
30 LF × $60 = $1,800
```

**Installation**:
```
Installation = Total LF × Install Rate

Default rates:
- Full House: $100/LF
- Single Project: $120/LF

Example:
30 LF × $100 = $3,000
```

#### 6. Final Price with Markup

**Subtotal**:
```
Subtotal = Cabinetry + Shipping + Installation

Example:
$2,234.05 + $1,800 + $3,000 = $7,034.05
```

**Final Price**:
```
Final Price = Subtotal × (1 + Markup Rate)

Default markup: 80% (0.80)

Example:
$7,034.05 × (1 + 0.80) = $12,661.29
```

### Complete Calculation Example

**Project Setup**:
- Project Type: Full House
- Ceiling: 8 ft
- Carcass: Holike ($65/sqm)
- Finish: PVC Unshaped ($100/sqm)
- Shipping: $60/LF
- Install: $100/LF
- Markup: 80%
- Discount: 50%

**Line Item** (Kitchen):
- Upper: 10 LF
- Base: 15 LF
- Pantry: 5 LF
- Drawers: 8
- Accessories: 3

**Step 1**: Convert to meters
- Upper: 10 × 0.3048 = 3.048m
- Base: 15 × 0.3048 = 4.572m
- Pantry: 5 × 0.3048 = 1.524m
- Total LF: 30

**Step 2**: Calculate door area
- Upper: 3.048m × 0.760m = 2.316 sqm
- Base: 4.572m × 0.920m = 4.206 sqm
- Pantry: 1.524m × 2.450m = 3.734 sqm
- **Total Door Area: 10.256 sqm**

**Step 3**: Calculate carcass area (simplified)
- Upper: ~4.601 sqm
- Base: ~9.827 sqm
- Pantry: ~9.756 sqm
- **Total Carcass Area: ~24.184 sqm**

**Step 4**: Calculate costs
- Door: 10.256 × $100 = $1,025.60
- Carcass: 24.184 × $65 = $1,571.96
- Drawers: 8 × $200 = $1,600.00
- Accessories: 3 × $300 = $900.00
- **Gross Cabinetry: $5,097.56**

**Step 5**: Apply discount
- Cabinetry: $5,097.56 × 0.50 = **$2,548.78**

**Step 6**: Add shipping & install
- Shipping: 30 × $60 = **$1,800.00**
- Install: 30 × $100 = **$3,000.00**
- **Subtotal: $7,348.78**

**Step 7**: Apply markup
- **Final Price: $7,348.78 × 1.80 = $13,227.80**

### 3-Tier Configuration System

The application uses a cascading resolution system with three levels of configuration:

```
┌─ TIER 1: GLOBAL DEFAULTS ────────────────┐
│ Set once, applies to all new quotes      │
│ Location: Global Settings modal (header) │
└───────────────────────────────────────────┘
            ↓ (inherited unless overridden)
┌─ TIER 2: QUOTE-LEVEL OVERRIDES ──────────┐
│ Custom settings for this specific quote  │
│ Location: Project Settings dropdown      │
└───────────────────────────────────────────┘
            ↓ (inherited unless overridden)
┌─ TIER 3: LINE-ITEM OVERRIDES ────────────┐
│ Custom settings for specific rooms       │
│ Location: Line Item Advanced section     │
└───────────────────────────────────────────┘
```

**Priority Chain** (for rates and dimensions):
```
Line Item Override → Quote Override → Global Default
```

**Examples**:

#### Example 1: Shipping Rate Resolution
```
Global Default:     $60/LF
Quote Override:     $75/LF  (special client pricing)
Line Item Override: Not set

Result: All line items use $75/LF
```

#### Example 2: Mixed Overrides
```
Global Default:  Install $100/LF, Markup 80%
Quote Override:  Install $120/LF  (no markup override)
Line Item (Bath): Install not set, Markup 90%

Result for Bath:
  - Install: $120/LF  (from quote)
  - Markup:  90%      (from line item)
```

#### Example 3: Dimension Resolution
```
Global Default Upper Height: 760mm
Quote Override: Not set
Line Item Ceiling Override: 10ft → Auto-calculates 1070mm

Result: This line item uses 1070mm, others use 760mm
```

**Visual Indicators**:
- Badge shows "Global" when using defaults
- Badge shows "X Custom" when quote has overrides
- Status text shows "Using quote defaults" or "Custom settings" per line item

---

## Project Structure

```
quotingTool/
├── src/                    # Source code
│   ├── css/               # Stylesheets
│   │   ├── main.css       # Main styles
│   │   └── components.css # Component styles
│   ├── js/                # JavaScript modules
│   │   ├── app.js        # Main application
│   │   ├── components/   # UI components
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   └── index.html         # HTML structure
├── package.json            # npm configuration
├── README.md               # This file (user documentation)
├── CLAUDE.md               # Developer/AI assistant guide
├── CODE_REVIEW.md          # Code quality assessment
└── .gitignore              # Git ignore rules
└── assets/
    ├── Logo-Light.svg      # Bosco logo
    └── favicons/           # Favicon files
        ├── favicon.ico
        ├── favicon.svg
        ├── apple-touch-icon.png
        └── ...
```

---

## Installation

### Local Development
```bash
npm run dev
# Server starts on http://localhost:8080
# Opens browser automatically
# Enter password: bosco2024
```

### Static Hosting Deployment

#### Netlify
1. Drag and drop the `quotingTool` folder to Netlify
2. Set publish directory to `src/`
3. Done! Your site is live

#### Vercel
```bash
cd quotingTool
npx vercel
# Set output directory to: src
```

#### GitHub Pages
1. Create a new repository
2. Push the `quotingTool` folder contents
3. Enable GitHub Pages in repository settings
4. Set source to main branch, `/src` directory

#### Azure Static Web Apps
1. Create new Static Web App in Azure Portal
2. Connect to your repository
3. Set app location to `src/`

---

## Configuration

### Change Password
Edit `src/js/components/auth.js` line 10:
```javascript
const PASSWORD = 'your_new_password'; // Change this
```

### Adjust Default Rates
Edit `src/js/utils/constants.js` → `DEFAULT_RATES` object:
```javascript
export const DEFAULT_RATES = {
    SHIPPING_PER_LF: 60,      // CAD per linear foot
    INSTALL_PER_LF_FULL: 100, // CAD per linear foot (full house)
    INSTALL_PER_LF_SINGLE: 120, // CAD per linear foot (single project)
    DRAWER: 200,              // CAD per drawer
    ACCESSORY: 300,           // CAD per accessory
    EXCHANGE_RATE: 1.42,      // USD to CAD
    MARKUP: 0.80,             // 80% markup
    DISCOUNT: 0.50            // 50% discount
};
```

Or edit default values in `src/index.html` form inputs:
- Config modal "Rates" tab has all rate inputs

### Modify Finish Rates
Edit `src/js/utils/constants.js` → `FINISH_RATES` object:
```javascript
export const FINISH_RATES = {
    PVC: { unshaped: 100, shaped: 200 },
    Melamine: { unshaped: 70, shaped: 70 },
    Skin: { unshaped: 150, shaped: 150 },
    'Paint/Lacquer': { unshaped: 170, shaped: 200 },
    Powder: { unshaped: 100, shaped: 200 },
    Veneer: { unshaped: 440, shaped: 440 },
    PET: { unshaped: 110, shaped: 110 }
};
```

### Modify Ceiling Height Mappings
Edit `src/js/utils/constants.js`:
```javascript
export const CEILING_TO_MM = {
    '8': 2450, '9': 2750, '10': 3050,
    '11': 3350, '12': 3660, '13': 3960
};

export const CEILING_TO_UPPER_HT = {
    '8': 760, '9': 920, '10': 1070,
    '11': 1220, '12': 1320, '13': 1473
};
```

---

## Data Storage

### Storage Schema

**Global Configuration** (`localStorage: bosco_global_config`) - NEW in v3.0:
```json
{
  "version": 1,
  "rates": {
    "shippingRate": 60,
    "installRate": 100,
    "drawerRate": 200,
    "accessoryRate": 300,
    "exchangeRate": 1.42,
    "markupRate": 80,
    "discountRate": 50
  },
  "dimensions": {
    "defaultUpperHt": 760,
    "defaultBaseHt": 920,
    "defaultUpperDp": 300,
    "defaultBaseDp": 600,
    "defaultPantryDp": 600
  },
  "materials": {
    "finishRates": {
      "PVC": { "unshaped": 100, "shaped": 200 },
      "Melamine": { "unshaped": 70, "shaped": 70 },
      "Skin": { "unshaped": 150, "shaped": 150 },
      "Paint/Lacquer": { "unshaped": 170, "shaped": 200 },
      "Powder": { "unshaped": 100, "shaped": 200 },
      "Veneer": { "unshaped": 440, "shaped": 440 },
      "PET": { "unshaped": 110, "shaped": 110 }
    },
    "carcassRates": {
      "holike": 65,
      "allure": 200
    }
  }
}
```

**Current Quote** (`localStorage: bosco_current_quote`):
```json
{
  "version": 2,
  "clientName": "John Smith",
  "projectName": "Luxury Home Renovation",
  "quoteDate": "2024-12-22",
  "projectType": "full",
  "carcassSupplier": "holike",
  "defaultCeiling": "8",
  "overrides": {
    "installRate": 120,
    "defaultUpperHt": 850
  },
  "lineItems": [
    {
      "id": 1,
      "name": "Kitchen",
      "upperLF": 10,
      "baseLF": 15,
      "pantryLF": 5,
      "finish": "PVC",
      "shaped": "no",
      "openShelf": "no",
      "drawers": 8,
      "accessories": 3,
      "ceilingFt": "",
      "carcassSupplier": "",
      "upperHt": 0,
      "baseHt": 0,
      "upperDp": 0,
      "baseDp": 0,
      "pantryDp": 0,
      "showOverride": false,
      "showAdvanced": false,
      "showConfigOverride": false,
      "collapsed": false,
      "overrideShippingRate": null,
      "overrideInstallRate": null,
      "overrideDrawerRate": null,
      "overrideAccessoryRate": null,
      "overrideMarkupRate": null,
      "overrideDiscountRate": null,
      "additionalItems": []
    }
  ],
  "nextId": 2
}
```

**Quote History** (`localStorage: bosco_saved_quotes`):
```json
[
  {
    "id": 1702847623456,
    "name": "Smith Residence - Kitchen",
    "savedAt": "2024-12-17T20:13:43.456Z",
    "clientName": "John Smith",
    "projectName": "Luxury Home Renovation",
    // ... all other fields same as current quote
  }
]
```

### Data Persistence

- **Auto-Save**: Triggered on every change
  - Client info changes
  - Settings changes
  - Line item updates
  - Add/remove items

- **Manual Save**: User clicks "Save Quote"
  - Prompts for quote name
  - Saves to history array
  - Stored separately from auto-save

- **Data Retention**: Until browser cache is cleared
  - Not synced across devices
  - Not synced across browsers
  - Tied to browser localStorage

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements**:
- localStorage support (auto-save & quote history)
- sessionStorage support (password authentication)
- ES6 JavaScript support
- CSS Grid support

---

## Limitations

### Current Limitations
- Client-side only (no database)
- Data tied to single browser/device
- No export to PDF
- No print stylesheet
- No user accounts
- No cloud sync
- Password stored in plain text in source

### Future Enhancements Roadmap
- [ ] PDF export functionality
- [ ] Print-optimized layout
- [ ] Email quotes to clients
- [ ] Backend integration with database
- [ ] Multi-user accounts and authentication
- [ ] Quote templates library
- [ ] Material/SKU tracking
- [ ] 3D cabinet visualization
- [ ] CRM integration
- [ ] Mobile app version
- [ ] Quote comparison tool
- [ ] Historical pricing analytics

---

## Security Notes

⚠️ **Important**: This uses client-side password protection only.

**Current Security**:
- Password check on page load
- Session-based authentication
- Local data storage (not transmitted)

**For Production Use**:
1. **Change the default password** immediately
2. Consider implementing server-side authentication
3. Use HTTPS when deploying (required)
4. Understand that client data is NOT encrypted in localStorage
5. Clearing browser data will delete all quotes
6. Anyone with browser access can view source and find password

**Enterprise Deployment Recommendations**:
- Server-side authentication with JWT tokens
- Database storage (PostgreSQL, MongoDB)
- User roles/permissions (admin, sales, viewer)
- Quote encryption at rest
- Audit logs for all changes
- SSL certificate (HTTPS)
- Regular backups
- API rate limiting

---

## Troubleshooting

### Password Not Working
**Symptoms**: Password rejected on login
**Solutions**:
- Clear browser cache and try again
- Check browser console (F12) for JavaScript errors
- Verify password in source code (`src/js/components/auth.js` line 10)
- Try different browser
- Check for typos in password

### Quotes Not Saving
**Symptoms**: Changes don't persist after refresh
**Solutions**:
- Check browser localStorage is enabled
- Verify you're not in private/incognito mode
- Check browser storage isn't full (Settings > Storage)
- Try different browser
- Check console for errors

### Calculations Seem Wrong
**Symptoms**: Prices don't match expectations
**Solutions**:
- Verify all rates are set correctly in settings
- Check dimension overrides aren't conflicting
- Review ceiling height settings and upper cabinet heights
- Confirm finish rates match your pricing structure
- Check markup and discount percentages
- Review the calculation breakdown in the line item footer
- Refer to calculation examples in this README

### Lost Quotes
**Symptoms**: Saved quotes disappeared
**Possible Causes**:
- Browser cache/data was cleared
- Different browser or device being used
- Incognito/private mode was used
- Browser updated and reset storage

**Recovery**:
- Check browser localStorage in DevTools (F12 > Application > Local Storage)
- Look for keys: `bosco_current_quote` and `bosco_saved_quotes`
- Data is tied to specific browser - switching browsers loses data
- **No cloud backup - data cannot be recovered if localStorage is cleared**

### Performance Issues
**Symptoms**: App feels slow or laggy
**Solutions**:
- Check number of saved quotes (too many can slow down)
- Clear old quotes from history
- Reduce number of line items per quote
- Check browser memory usage
- Try different browser

---

## Technical Specifications

- **Framework**: Vanilla JavaScript ES6 modules (no dependencies)
- **Architecture**: Modular component-based design
- **Storage**: localStorage API (current quote + history)
- **Authentication**: sessionStorage for session management
- **Styling**: CSS3 with CSS Custom Properties (variables)
- **Fonts**:
  - DM Sans (body text, UI elements)
  - Space Mono (monospace, numbers, currency)
- **Icons**: Inline SVG (no icon library needed)
- **File Size**: ~80KB (all files combined, uncompressed)
- **Performance**: All calculations client-side (instant updates), debounced auto-save
- **Responsive**: Mobile-first design with breakpoints at 768px and 1200px
- **Security**: XSS protection via input escaping

### Browser APIs Used
- `localStorage`: Persistent data storage
- `sessionStorage`: Session authentication
- `JSON.parse/stringify`: Data serialization
- `Date`: Timestamp generation
- `prompt/alert/confirm`: User dialogs
- `console`: Error logging

---

## Support

For issues, feature requests, or questions:
- Review this README for calculation logic and usage
- Check browser console (F12) for errors
- Verify configuration settings
- Contact Bosco Cabinetry development team

---

## License

Proprietary - Bosco Cabinetry Internal Use Only

---

## Changelog

### Version 3.0.0 (December 2024) - 3-Tier Configuration System
- **NEW**: 3-tier configuration system (Global → Quote → Line Item)
- **NEW**: Global Settings modal for company-wide defaults
- **NEW**: Quote-level overrides in Project Settings dropdown
- **NEW**: Line item restructured with Basic/Advanced progressive disclosure
- **NEW**: Ceiling height moved to Basic section (Room Settings column)
- **NEW**: Project-type-specific markup rates (80% full house, 90% single project)
- **NEW**: Open shelf option (zero door cost)
- **NEW**: Additional items per line item (custom CAD pricing)
- **NEW**: Visual status indicators showing custom vs. default settings
- **NEW**: Reset buttons to clear overrides back to defaults
- **IMPROVED**: 3-column Basic layout (Measurements | Finish & Options | Room Settings)
- **IMPROVED**: Cleaner visual hierarchy with better spacing
- **IMPROVED**: All calculations now use cascading 3-tier resolution
- **IMPROVED**: Markup rate auto-selects based on project type
- **FIXED**: Calculation bug where 0 LF resulted in non-zero cost (carcass side panels)
- **FIXED**: Separator visual issues in Advanced sections
- **REMOVED**: All emojis from UI for professional appearance
- **MIGRATION**: Auto-migrates v1/v2 quotes to v3 schema
- **DOCS**: Updated README and CLAUDE.md with 3-tier system documentation

### Version 2.0.0 (December 2024)
- **Major refactor**: Modular ES6 architecture
- Fixed button event listeners (proper IDs instead of onclick)
- Added XSS protection (input escaping)
- Added input validation
- Improved performance (debounced saves)
- Better error handling
- Separated concerns (components, services, utilities)
- Comprehensive developer documentation (CLAUDE.md)

### Version 1.0.0 (December 2024)
- Initial release
- Password protection
- Auto-save functionality
- Quote history management
- Client information tracking
- Complete calculation engine
- Responsive UI
- Help modal
- Comprehensive documentation

---

**Version**: 3.0.0
**Last Updated**: December 22, 2024
**Author**: Bosco Cabinetry Development Team
