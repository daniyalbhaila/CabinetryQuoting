# Bosco Cabinetry Quote Calculator

A professional, secure quote calculator for custom cabinetry projects. Built as a static web application with client-side storage and password protection.

## Features

### 🔐 Security
- **Password Protection**: Client-side password authentication prevents unauthorized access
- **Session Management**: Users stay logged in during their session
- **Default Password**: `bosco2024` (change in `index.html` line 264)

### 💾 Data Persistence
- **Auto-Save**: Current quote automatically saves to localStorage on every change
- **Quote History**: Save multiple quotes with custom names
- **Resume Work**: Automatically loads last working quote on page load
- **No Data Loss**: All data stored locally in browser

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
- **Add-ons**: Drawer and accessory pricing
- **Carcass Suppliers**: Holike ($65/sqm) or Allure ($200/sqm)
- **Ceiling Heights**: 8ft to 13ft with auto-adjusting upper cabinet heights
- **Dimension Overrides**: Override default dimensions per line item
- **Project Types**: Full house vs. single project (affects install rates)
- **Markup & Discount**: Configurable markup and discount percentages
- **Real-time Updates**: All calculations update instantly

### 🎨 User Interface
- **Dark Theme**: Professional dark UI with gold accents
- **Responsive Design**: Works on desktop and mobile
- **Collapsible Sections**: Organize settings and line items
- **Sticky Header**: Total always visible while scrolling
- **Visual Feedback**: Smooth animations and hover effects
- **Keyboard Friendly**: Tab navigation support
- **Help Modal**: Built-in user guide accessible from header

---

## How to Use

### Getting Started

1. **Login**: Enter password `bosco2024` to access the calculator
2. **Fill Client Info**: Add client name, project name, and date
3. **Configure Settings**: Set project type, ceiling height, and rates
4. **Add Line Items**: Click "Add Item" to create rooms/sections
5. **Save Quote**: Click "Save Quote" in sidebar to preserve your work

### Adding Line Items

Each line item represents a room or cabinet section:

1. **Name**: Click to name the item (e.g., "Kitchen", "Master Bath")
2. **Linear Footage**: Enter LF for upper, base, and pantry cabinets
3. **Finish**: Select door finish type (PVC, Melamine, etc.)
4. **Shaped Doors**: Choose if doors are shaped/profiled
5. **Drawers/Accessories**: Add count for pricing
6. **Dimensions**: Override defaults if needed for specific rooms

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

### Override Behavior

**Per-Line-Item Overrides**:
- Ceiling Height: Uses item value or project default
- Carcass Supplier: Uses item value or project default
- Dimensions: Uses override value if "Override Dimensions" is enabled AND value is entered

**Priority Chain**:
```
Line Item Override → Project Default → Hardcoded Fallback
```

**Example**:
```
Project Default Ceiling: 8ft (Upper: 760mm)
Line Item Ceiling Override: 10ft (Upper: 1070mm)
Result: Uses 1070mm for this line item only

If override removed: Reverts to 760mm
```

---

## Project Structure

```
quotingTool/
├── index.html              # Main application file
├── README.md               # This file
├── .gitignore              # Git ignore rules
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
1. Clone or download this repository
2. Open `index.html` in a web browser
3. Enter password: `bosco2024`

### Static Hosting Deployment

#### Netlify
1. Drag and drop the `quotingTool` folder to Netlify
2. Done! Your site is live

#### Vercel
```bash
cd quotingTool
npx vercel
```

#### GitHub Pages
1. Create a new repository
2. Push the `quotingTool` folder contents
3. Enable GitHub Pages in repository settings
4. Set source to main branch, root directory

#### Azure Static Web Apps
1. Create new Static Web App in Azure Portal
2. Connect to your repository
3. Set build folder to `/quotingTool`

---

## Configuration

### Change Password
Edit `index.html` line 264:
```javascript
const PASSWORD = 'your_new_password'; // Change this
```

### Adjust Default Rates
Edit default values in the HTML form inputs (index.html):
- **Shipping Rate**: Line 173 - `value="60"`
- **Install Rate**: Line 174 - `value="100"`
- **Drawer Rate**: Line 177 - `value="200"`
- **Accessory Rate**: Line 178 - `value="300"`
- **Markup**: Line 181 - `value="80"`
- **Discount**: Line 182 - `value="50"`

### Modify Finish Rates
Edit the `FINISH_RATES` object in JavaScript (index.html line 283):
```javascript
const FINISH_RATES = {
    'PVC': { unshaped: 100, shaped: 200 },
    'Melamine': { unshaped: 70, shaped: 70 },
    'Skin': { unshaped: 150, shaped: 150 },
    'Paint/Lacquer': { unshaped: 170, shaped: 200 },
    'Powder': { unshaped: 100, shaped: 200 },
    'Veneer': { unshaped: 440, shaped: 440 },
    'PET': { unshaped: 110, shaped: 110 }
};
```

### Modify Ceiling Height Mappings
Edit the lookup tables (index.html line 284-285):
```javascript
const CEILING_TO_MM = {
    '8': 2450, '9': 2750, '10': 3050,
    '11': 3350, '12': 3660, '13': 3960
};

const CEILING_TO_UPPER_HT = {
    '8': 760, '9': 920, '10': 1070,
    '11': 1220, '12': 1320, '13': 1473
};
```

---

## Data Storage

### Storage Schema

**Current Quote** (`localStorage: bosco_current_quote`):
```json
{
  "clientName": "John Smith",
  "projectName": "Luxury Home Renovation",
  "quoteDate": "2024-12-17",
  "projectType": "full",
  "carcassSupplier": "holike",
  "defaultCeiling": "8",
  "shippingRate": "60",
  "installRate": "100",
  "drawerRate": "200",
  "accessoryRate": "300",
  "markupRate": "80",
  "discountRate": "50",
  "defaultUpperHt": "760",
  "defaultBaseHt": "920",
  "defaultUpperDp": "300",
  "defaultBaseDp": "600",
  "defaultPantryDp": "600",
  "lineItems": [
    {
      "id": 1,
      "name": "Kitchen",
      "upperLF": 10,
      "baseLF": 15,
      "pantryLF": 5,
      "finish": "PVC",
      "shaped": "no",
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
      "collapsed": false
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
- Verify password in source code (index.html line 264)
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

- **Framework**: Vanilla JavaScript (no dependencies)
- **Storage**: localStorage API (current quote + history)
- **Authentication**: sessionStorage for session management
- **Styling**: CSS3 with CSS Custom Properties (variables)
- **Fonts**:
  - DM Sans (body text, UI elements)
  - Space Mono (monospace, numbers, currency)
- **Icons**: Inline SVG (no icon library needed)
- **File Size**: ~70KB (HTML + CSS + JS combined, uncompressed)
- **Performance**: All calculations client-side (instant updates)
- **Responsive**: Mobile-first design with breakpoints at 768px and 1200px

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

**Version**: 1.0.0
**Last Updated**: December 17, 2024
**Author**: Bosco Cabinetry Development Team
