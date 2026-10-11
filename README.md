# CartWise — Smart Shopping Budget Planner

CartWise is a browser-based shopping planner that helps you build a grocery list, estimate the bill before you shop, and stay within a spending limit. It is a small, self-contained web app: no account, no server, and no build step. Your budget and list stay in this browser with `localStorage`.

The interface is designed as a friendly shopping utility, with a light background, forest-green accents, rounded cards, and a layout that works on phones and desktops.

---

## What the app does

Before a shopping trip, you set a budget and add products with a unit price and quantity. CartWise calculates each item total (`unit price × quantity`) and the overall estimated spend. The dashboard always shows:

- Shopping budget
- Estimated spending
- Remaining balance
- Number of items
- Budget usage (with a progress bar that turns red when you go over)
- Shopping completion (how many items are marked purchased)

Items are grouped into **Still to buy** and **Purchased**, so you can check things off as you walk the store.

---

## Features

### Budget management

- Enter and update a shopping budget (zero or greater).
- Choose a display currency. The default is **INR (₹)**. Also supported: USD, EUR, GBP, and JPY.
- Amounts are formatted with `Intl.NumberFormat`.
- Remaining balance is highlighted. When the list exceeds the budget, the remaining card turns red and the usage bar reports how far over you are.
- When you have used 85% or more of the budget (but are still under it), the usage bar switches to an amber warning state.

### Shopping list

- Add an item with a product name, unit price, and quantity.
- Each row shows unit price, quantity, and line total.
- Edit an item in place (the add form becomes a save form, with a cancel action).
- Delete an item.
- Mark items as purchased with a checkbox. Purchased items move to a separate group and count toward shopping progress.
- An empty state appears when the list has no items.

### Convenience

- **Load sample list** fills the list with a short demo of everyday groceries. If you have not set a budget yet, it also sets one so the dashboard is meaningful.
- **Clear list** asks for confirmation before removing every item.
- Success and validation messages appear at the top of the page.

### Persistence

- Budget, currency, and the full item list are saved under the `localStorage` key `cartwise-data`.
- Refreshing or reopening the page restores the last saved state.
- Missing or invalid saved data is ignored and replaced with a safe default (budget `0`, currency `INR`, empty list).

---

## Validation and calculations

Inputs are checked in JavaScript (forms use `novalidate` so messages come from the app, not the browser):

| Field | Rule |
| --- | --- |
| Product name | Required; cannot be only spaces |
| Unit price | Number that is `0` or greater (free items are allowed) |
| Quantity | Positive whole number (`1`, `2`, `3`, …) |
| Budget | Number that is `0` or greater |

Money values are rounded to two decimal places so totals stay consistent. User-entered names are inserted with `textContent`, not as HTML, so the list cannot run untrusted markup.

---

## Project structure

```
CartWise/
├── index.html      Page structure, forms, and dashboard regions
├── style.css       Layout, colors, cards, and responsive rules
├── script.js       Rendering, validation, totals, and localStorage
├── .gitignore      Ignores OS, editor, log, and env files
└── README.md       This file
```

There is no package.json, bundler, or backend. `index.html` loads `style.css` and `script.js` directly.

### How the code is organized

`script.js` is wrapped in an immediately-invoked function so it does not leak globals. The main pieces are:

- **State** — `{ budget, currency, items[] }`, where each item has `id`, `name`, `unitPrice`, `quantity`, and `purchased`
- **Persistence** — `loadState()`, `saveState()`, and `sanitizeState()`
- **Calculations** — `roundMoney()`, `getItemTotal()`, `calculateTotals()`
- **Validation** — `validateBudget()`, `validateItem()`
- **Rendering** — `render()` rebuilds the dashboard and lists after every change
- **Events** — form submits, currency change, edit/delete/purchase, sample list, and clear confirmation

---

## How to run

You need a modern web browser. Node.js, npm, and a database are not required.

### Option 1 — Open the file

1. Go to the project folder (`C:\Users\pc\CartWise` on this machine).
2. Double-click `index.html`, or right-click it and choose **Open with** your browser.

From PowerShell:

```powershell
cd C:\Users\pc\CartWise
start index.html
```

### Option 2 — Local web server

Some browsers restrict `localStorage` slightly on `file://` URLs. A local server is a reliable alternative:

```powershell
cd C:\Users\pc\CartWise
python -m http.server 8765
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

If Python is not installed, any static file server in that folder will work the same way.

---

## How to use it

1. Set a **shopping budget** and click **Update budget**.
2. Optionally change **Currency** so prices match how you think about money.
3. Add products: name, unit price, quantity, then **Add item**.
4. Watch the summary cards and progress bars update immediately.
5. While shopping, tick **Mark … as purchased**.
6. Use **Edit** or **Delete** if a price or quantity changes.
7. Use **Load sample list** to try the app with demo data.
8. Use **Clear list** only when you want a fresh list (you will be asked to confirm).

Data never leaves your machine. Clearing site data for this origin, or using another browser/profile, starts you with an empty list.

---

## Design and accessibility

- Light cream background with forest-green primary actions
- Rounded cards, light shadows, and clear typography
- Budget and remaining balance are the most visible numbers
- Responsive layout: four summary cards on desktop, stacked on small screens
- Visible hover, focus, and disabled button states
- Labels on every form field; keyboard-friendly forms
- Live status messages (`role="status"`) for success and errors
- Progress bars expose `aria-valuenow` for assistive tech

---

## Browser support

CartWise uses HTML5, CSS3, and vanilla JavaScript (`localStorage`, `Intl.NumberFormat`, `Number.isInteger`). It is intended for current versions of Chrome, Edge, Firefox, and Safari. It does not work well in very old browsers that lack those APIs.

---

## License

This project is provided as a local demo application. Use and modify it as you like.
