# Nexus Retail

> A fast, modern, and fully-featured **Billing & Inventory Management** Single Page Application. Built with pure vanilla JavaScript — no frameworks, no build tools required.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/nexus-retail)

## ✨ Key Features

- **Point of Sale Terminal** — Advanced cart with discounts, taxes, service fees, cash tender/change calculator, and multiple payment methods (Cash, Card, UPI, Bank Transfer)
- **Real-time Dashboard** — SVG-powered sales trend charts and low-stock monitoring
- **Inventory Management** — Full CRUD, bulk stock loading, bulk adjustments, CSV Import/Export, advanced filtering & sorting
- **Reports & Analytics** — Detailed transaction history, payment breakdowns, top products, category-wise sales
- **Professional Invoicing** — Clean printable invoices + thermal-receipt style prints optimized for 80mm printers
- **Settings & Persistence** — Customizable shop details, invoice numbering, footer notes, dark/light theme
- **Offline First** — Everything runs in the browser using localStorage (no backend required)
- **Mobile Responsive** — Works great on tablets and phones

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Native SVG (no external libraries)
- **Storage**: Browser localStorage
- **Optional Server**: Node.js (for local development)

## 🚀 Getting Started Locally

### Option 1: Open directly
Just open `index.html` in any modern browser.

### Option 2: Using the included static server
```bash
node server.js
```
Then visit `http://localhost:3000`

## ☁️ Deploy to Vercel (One-Click)

This project is a **pure static site** — perfect for Vercel.

1. Push this repository to GitHub
2. Go to [Vercel](https://vercel.com) → **Import Project**
3. Select your repository
4. Vercel will auto-detect it as a static site
5. Click **Deploy**

No build step, no configuration needed.

**Alternative**: Click the "Deploy with Vercel" button at the top of this README.

## 📦 Project Structure

```
nexus-retail/
├── index.html          # Main application
├── styles.css          # All styling + print media queries
├── app.js              # Complete business logic (POS, Inventory, Reports, etc.)
├── server.js           # Optional lightweight Node static server
└── README.md
```

## 🧾 CSV Import / Export

The inventory supports full CSV round-tripping:
- Export current inventory
- Edit in Excel / Google Sheets
- Re-import (upsert by SKU)

## 🖨️ Receipt Printing

Optimized receipt styles for both screen preview and physical printing (including thermal printers via `@page` rules and clean popup print window).

## 📋 License

MIT License — free to use and modify.

## 🤝 Contributing

Pull requests are welcome! Feel free to improve the UI, add new features, or optimize the receipt printing logic.

---

**Built with ❤️ using only vanilla web technologies.**
