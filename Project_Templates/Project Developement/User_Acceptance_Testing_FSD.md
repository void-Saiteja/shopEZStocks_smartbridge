# User Acceptance Testing (UAT) Functional Specification Document

| Field | Detail |
| :--- | :--- |
| **Date** | 18th June 2026 |
| **Team ID** |  |
| **Project Name** | ShopEZ Stocks - MERN Stock Trading Simulator |
| **Developed by** | Gunturu Sai Teja |
| **Role** | Lead Developer and Systems Architect |

---

## Project Overview

| Field | Detail |
| :--- | :--- |
| **Project Name** | ShopEZ Stocks - MERN Stock Trading Simulator |
| **Description** | A full-stack MERN stock trading simulator with JWT authentication, live stock tickers, interactive line charts, portfolio tracking, and admin tools. |
| **Version** | 1.0.0 |
| **Testing Period** | 18th June 2026 |
| **Testing Scope** | Authentication, Stock Explorer, Trading Orders (Buy/Sell), Portfolio Valuation, Admin Dashboard Controls |

## Testing Environment

| Field | Detail |
| :--- | :--- |
| **URL / Location** | http://localhost:5173 (Vite Local Dev) |
| **Test Credentials (Trader)** | Email: trader@shopez.com | Password: traderpassword |
| **Test Credentials (Admin)** | Email: admin@shopez.com | Password: adminpassword |

## Test Cases

| TC ID | Test Scenario | Test Steps | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-001 | User Registration | 1. Open site. 2. Click Register. 3. Fill username, email, password. 4. Submit. | Account created, redirect to dashboard with virtual cash balance. | Account created successfully. | Pass |
| TC-002 | User Login | 1. Open Login page. 2. Enter valid trader credentials. 3. Click Login. | User authenticated, JWT token returned, redirect to dashboard. | Login successful. | Pass |
| TC-003 | Browse Stock Catalog | 1. Open Explore page. 2. Scroll through listed stocks. | Stocks load with symbol, name, price, and daily change percentage. | All stock tickers rendered correctly. | Pass |
| TC-004 | Search Stock Ticker | 1. Type search query in search box. 2. Observe results. | Only stocks matching the typed ticker symbol or name are shown. | Search filters correctly. | Pass |
| TC-005 | Execute Buy Order | 1. Open a stock page. 2. Enter positive integer quantity. 3. Click Buy. | Holding created/updated, cash balance deducted, trade recorded in history. | Buy order executed in real-time. | Pass |
| TC-006 | View Investments | 1. Navigate to Investments page. | Holdings page shows average buy price, current price, shares owned, and PnL. | Investments table renders correctly. | Pass |
| TC-007 | Execute Sell Order | 1. Open holding page. 2. Enter quantity <= owned. 3. Click Sell. | Holding updated/deleted, cash balance increased, trade recorded in history. | Sell order executed successfully. | Pass |
| TC-008 | Admin Add Product | 1. Login as Admin. 2. Go to Admin Panel. 3. Add new stock ticker with details. | Stock ticker added and immediately visible in Explore stock list. | Stock listing created successfully. | Pass |
| TC-009 | Invalid Order Attempt | 1. Enter buy quantity costing > cash. 2. Click Buy. | Order rejected. Error message: Insufficient balance displayed. | Error displayed correctly. | Pass |
| TC-010 | Access Protected Route | 1. Logout. 2. Navigate to /portfolio directly. | Redirected to Login page. | Redirected correctly. | Pass |

## Bug Tracking

| Bug ID | Bug Description | Steps to Reproduce | Severity | Status | Additional Feedback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| BG-001 | MongoDB connection failure crashes backend app on startup | 1. Turn off local MongoDB daemon. 2. Start backend server. | High | Fixed | Resolved by implementing an automatic In-Memory database fallback layer. |
| BG-002 | Stock list renders with delay during frequent simulation updates | 1. Open Explore page. 2. Let simulator run for multiple cycles. | Medium | Fixed | Optimized React component rendering by using React.memo and key properties. |
| BG-003 | Portfolio value calculation mismatches on fractions | 1. Place multiple buy/sell orders. 2. Verify total valuation sum. | Low | Fixed | Formatted average buy prices and total cash balance to 2 decimal places via .toFixed(2). |

## Signatures

* **Tester Name**: Gunturu Sai Teja
* **Date**: 18th June 2026
* **Signature**: Sai Teja
