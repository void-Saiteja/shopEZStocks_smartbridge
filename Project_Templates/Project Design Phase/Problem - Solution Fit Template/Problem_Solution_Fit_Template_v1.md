# Problem - Solution Fit Template

| Field | Detail |
| :--- | :--- |
| **Date** | 18th June 2026 |
| **Team ID** |  |
| **Project Name** | ShopEZ Stocks - MERN Stock Trading Simulator |
| **Developed by** | Gunturu Sai Teja |
| **Role** | Lead Developer and Systems Architect |

---

## Concept Overview

The Problem-Solution Fit framework ensures that the solution we are building directly and meaningfully addresses the real problem identified during the ideation phase. It prevents us from building features that users do not actually need.

## Five Strategic Purposes of Problem-Solution Fit

* **Solve Complex Problems**: ShopEZ Stocks addresses the multi-layered problem of simulating real-time stock and option transactions with database caching and a seamless MERN interface.
* **Succeed Faster**: By focusing on core virtual trading flows first (login, stock explorer, buy/sell, portfolio tracking) before advanced features, we delivered a working MVP within the first two sprints.
* **Sharpen Communication Strategy**: Our decoupled frontend and backend architecture allows both teams to communicate via clearly defined REST API contracts, reducing integration errors.
* **Increase Touchpoints**: ShopEZ Stocks increases trader touchpoints through detailed stock visual metrics, interactive Chart.js line graphs, and real-time flashing price changes.
* **Understand Existing Situation**: Analysis of virtual trading platforms revealed that many suffer from database reset lags or overly complex setups. ShopEZ Stocks provides an easy-to-use interface with an automated in-memory database fallback.

## Problem-Solution Fit Canvas

| Problem | Our Solution |
| :--- | :--- |
| Buyers/traders cannot practice stock/options trading without risking real money. | ShopEZ Stocks provides a risk-free virtual simulator pre-seeded with $50,000 cash for traders and $100,000 for admins. |
| Existing mock trading platforms suffer from slow price updates and static data. | ShopEZ Stocks runs a background simulation engine that updates stock prices every 6 seconds with custom random-walk mathematical models. |
| Local database setups are tedious and crash if MongoDB isn't running. | ShopEZ Stocks implements an in-memory database fallback to run out-of-the-box with pre-seeded traders and admins. |
| Lack of administrative control to correct errors or test extreme market scenarios. | ShopEZ Stocks provides admin tools to adjust user balances, add custom stocks, and rollback/void transactions in real-time. |
