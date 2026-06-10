# ShopEZ Stocks - MERN Stock Trading Simulator

ShopEZ Stocks is a premium, full-stack MERN (MongoDB, Express.js, React.js, Node.js) stock trading simulator. It combines the sleek and user-friendly "ShopEZ" philosophy of effortless transactions with a robust real-time trading dashboard. Users can explore stocks, view interactive historical price trends, simulate buy/sell orders with a virtual balance, and manage their investment portfolios. The platform features role-based access control, real-time pricing simulations, and admin moderation capabilities.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite-based), custom Glassmorphism CSS styling, Bootstrap, Chart.js, Lucide Icons, Axios
- **Backend**: Node.js, Express.js, JWT Auth (`jsonwebtoken`), Encryption (`bcryptjs`), CORS, Dotenv
- **Database**: MongoDB & Mongoose (with a transparent **In-Memory fallback database** if a local MongoDB server is not running)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher recommended.
- **MongoDB** (Optional): A local instance running on `mongodb://127.0.0.1:27017` is preferred. If MongoDB is unavailable, the application automatically runs on a pre-seeded In-Memory fallback store.

### 2. Running the Backend Server
Navigate to the `backend/` directory, install packages, and start the development server:
```bash
cd backend
npm install
npm start
```
The server will start running on port `5000`. You should see console confirmations for:
- Database connectivity or memory fallback activation.
- Seeding of default administrator and trader credentials.
- Startup of the stock market simulation engine (updating prices every 6 seconds).

### 3. Running the Frontend Server
Navigate to the `frontend/` directory, install packages, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to the local address outputted by Vite (typically `http://localhost:5173`).

---

## 🔑 Demonstration Accounts

The application is pre-seeded with two accounts for easy testing, which are also available as quick-fill options on the Login page:

| Role | Email | Password | Starting Cash |
| :--- | :--- | :--- | :--- |
| **Trader (Investor)** | `trader@shopez.com` | `traderpassword` | `$50,000.00` |
| **Administrator** | `admin@shopez.com` | `adminpassword` | `$100,000.00` |

---

## 📂 Project Architecture

```
smartbridge_project/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & fast fallback trigger
│   ├── middleware/
│   │   └── auth.js               # JWT security and admin route guards
│   ├── models/
│   │   └── index.js              # Database schemas & In-Memory CRUD methods
│   ├── routes/
│   │   ├── auth.js               # /register, /login, /me endpoints
│   │   ├── stocks.js             # Stock listings retrieval & Admin CRUD commands
│   │   ├── transactions.js       # Trade execution (/buy, /sell) and history
│   │   └── portfolio.js          # Calculated holdings valuations & PnL stats
│   ├── services/
│   │   └── stockSimulator.js     # Background mock stock fluctuations & seeding
│   ├── .env.example              # Template configuration
│   ├── .env                      # Local environment configuration
│   └── server.js                 # Express entry point
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx        # Navigation header with cash balance tracker
    │   │   └── ProtectedRoute.jsx# Client-side routing guards
    │   ├── pages/
    │   │   ├── Login.jsx         # Sign in portal with pre-fill demo triggers
    │   │   ├── Register.jsx      # Investor registration forms
    │   │   ├── Dashboard.jsx     # Live tickers table with flashing price boxes
    │   │   ├── StockDetail.jsx   # Detailed metrics & Chart.js historical line chart
    │   │   ├── PortfolioPage.jsx # Holdings table & Asset distribution Doughnut chart
    │   │   └── AdminDashboard.jsx# Listing management controls & system logs audits
    │   ├── api.js                # Pre-configured Axios instance with JWT headers
    │   ├── index.css             # Premium glassmorphic styling system
    │   ├── App.jsx               # Application routing and user state management
    │   └── main.jsx              # React initialization
    └── index.html                # HTML head template
```

---

## ⚙️ Key Backend Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user with email, username, and password.
- `POST /api/auth/login` - Authenticate credentials and return a session JWT.
- `GET /api/auth/me` - Fetch credentials and remaining virtual balance (Token Required).
- `GET /api/auth/admin/users` - Get directory list of all registered users (Admin Required).
- `PUT /api/auth/admin/users/:id` - Adjust a user's role or virtual balance (Admin Required).
- `DELETE /api/auth/admin/users/:id` - Deactivate/ban a user account (Admin Required).

### Stock Quotes
- `GET /api/stocks` - Get list of active simulated stock quotes.
- `GET /api/stocks/:symbol` - Retrieve detailed price history for a specific stock ticker.
- `POST /api/stocks` - Register a new stock symbol (Admin Required).
- `PUT /api/stocks/:symbol` - Edit details or adjust the valuation of a listing (Admin Required).
- `DELETE /api/stocks/:symbol` - Remove a stock listing from the catalog (Admin Required).

### Portfolio & Transactions
- `GET /api/portfolio` - Fetch current holdings, average costs, current values, and net unrealized returns (Token Required).
- `POST /api/transactions/buy` - Place an order to buy shares of a stock (Token Required).
- `POST /api/transactions/sell` - Place an order to sell shares of a stock (Token Required).
- `GET /api/transactions` - Fetch personal trading logs (Token Required).
- `GET /api/transactions/admin/all` - Inspect system-wide trading logs (Admin Required).
- `POST /api/transactions/admin/rollback/:id` - Rollback/Void a transaction, restoring cash balance and reverting portfolio holdings (Admin Required).

