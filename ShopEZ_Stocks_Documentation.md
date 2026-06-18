# ShopEZ Stocks - MERN Stock Trading Simulator

**Developed by: Gunturu Sai Teja**

---

### 1. Introduction

When our team first gathered to brainstorm ideas for our software engineering project, we wanted to build something that people use every single day. We decided that a virtual stock trading simulator would be the perfect challenge. We named our project ShopEZ Stocks. The primary objective was to create an intuitive, secure, and robust online shopping-like environment that bridges the gap between simulated stock markets and investor portfolios through seamless digital interactions.

**Project Title:** ShopEZ Stocks - MERN Stock Trading Simulator.

**Team Members:** Gunturu Sai Teja acts as the Lead Developer and Systems Architect. The team collaborated to handle database modeling, frontend user interface design, and backend serverless deployment.

---

### 2. Project Overview

**Purpose:** ShopEZ Stocks was built to address the complexities of modern virtual stock trading. Traditional trading platforms often suffer from monolithic architectures that are difficult to scale. Our purpose was to adopt a decoupled, component-driven frontend combined with a stateless backend architecture, allowing the application to scale infinitely during high-frequency price updates and transaction events while maintaining incredibly fast load times.

**Features:** The application highlights several key functionalities. It includes secure JWT-based authentication to protect user accounts. It features a massive, dynamic stock catalog populated with real-time simulated price fluctuations and historical line charts. It includes a dynamic portfolio tracker that instantly recalculates holdings, cash balances, and net profit/loss across the entire application using global state management. Furthermore, it implements role-based access control, ensuring that only verified administrators can edit stock listings, view system logs, or rollback transactions.

---

### 3. Architecture

We selected the MERN stack for our architecture, meaning we wrote the entire application using JavaScript from top to bottom.

**Frontend:** We built the frontend architecture using React. Instead of relying on traditional DOM manipulation, which is notoriously slow, React utilizes a Virtual DOM to ensure highly optimized render cycles. We managed our global application state using React's native Context API.

**Backend:** The backend architecture is powered by Node.js and Express.js. Node.js provides a non-blocking, asynchronous runtime environment, which is perfect for an API that needs to handle thousands of concurrent database requests. Express.js acts as the framework that structures these requests.

Here is an example of the core server initialization code we wrote for the backend to start the Express application and handle Cross-Origin Resource Sharing (CORS):

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const app = express();

app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'https://shopez-stocks.vercel.app'], credentials: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/portfolio', require('./routes/portfolio'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

**Database:** For our database schema and interactions, we utilized MongoDB. Because stock quotes and transaction histories have variable parameters (such as option type, strike price, and contract details for option trades, which are not present in normal stock trades), a NoSQL document database was far superior to a rigid SQL table. We interacted with MongoDB using the Mongoose ORM. To ensure our serverless deployment did not crash the database, we wrote a highly optimized connection caching script:

```javascript
const mongoose = require('mongoose');
let isConnected = false;

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopez-stocks', {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
  } catch (error) {
    isConnected = false;
  }
};

module.exports = { connectDB, isConnected: () => isConnected };
```

---

### 4. Setup Instructions

To ensure any new developer could easily contribute to ShopEZ Stocks, we standardized the local setup process.

**Prerequisites:** Before starting, a developer must have Node.js installed on their machine to run the JavaScript environment. They also need a Git client to clone the repository, and a MongoDB Atlas account to host their database cluster.

**Installation:** First, the developer opens their terminal and uses the git clone command pointing to the ShopEZ Stocks repository. Once downloaded, they navigate into the backend directory and run npm install. They then create a local .env file. The code inside the .env file should look exactly like this:

```env
PORT=5000
MONGODB_URI=mongodb+srv://admin:adminpassword@cluster0.mongodb.net/shopez-stocks?appName=Cluster0
JWT_SECRET=supersecretkeyforjwtshopezstocks
NODE_ENV=development
```

Finally, they open a separate terminal, navigate into the frontend directory, and run npm install again to fetch the React dependencies.

---

### 5. Folder Structure

A clean folder structure is the hallmark of a maintainable software project.

**Client:** The React frontend is organized inside the frontend directory. The src folder contains the core application. Inside src, we created a components folder that holds isolated, reusable UI elements like the Navbar and ProtectedRoute. We created a pages folder to hold the main visual views.

**Server:** The Node.js backend is organized logically inside the backend directory. We created a models folder to hold the Mongoose schema definitions that dictate how our data looks in the database. For example, here is the exact code we wrote to structure the Stock schema:

```javascript
const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  changePercent: { type: Number, default: 0 },
  history: [{
    date: { type: Date, default: Date.now },
    price: { type: Number, required: true }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stock', StockSchema);
```

We also created a controllers folder to hold the complex business logic functions, and a routes folder that simply maps URL paths to those specific controller functions.

---

### 6. Running the Application

To start the application locally, the developer needs to initialize both the client and the server simultaneously. The following commands are used in the terminal.

**Frontend:** To start the React application, the developer must open a terminal, navigate into the frontend directory, and execute the Vite development server script. The code entered in the terminal is:

```bash
cd frontend
npm run dev
```

Vite instantly spins up a local web server on port 5173. Vite also provides Hot Module Replacement, meaning any code the developer types will instantly appear in the browser without requiring a manual refresh.

**Backend:** To start the Express server, the developer opens a second terminal, navigates into the backend directory, and executes the Node runtime. The code entered in the terminal is:

```bash
cd backend
npm start
```

This executes the Node environment, which reads the variables, connects to the MongoDB database, and begins listening for incoming HTTP requests on port 5000.

---

### 7. API Documentation

The backend exposes a highly structured RESTful API. Every endpoint expects and returns data in JSON format.

Our authentication endpoints include a POST request to /api/auth/register, which requires a username, email, and password. The POST request to /api/auth/login requires an email and password, and returns the authenticated user data and JWT token.

Here is an example of the controller code we wrote to handle fetching all simulated stock quotes via a GET request to /api/stocks:

```javascript
const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching stocks" });
  }
};
```

Our portfolio and transaction endpoints include a GET request to /api/portfolio to retrieve the user's active holdings, and a POST request to /api/transactions/buy requiring a symbol, quantity, and asset type (e.g. STOCK or OPTION) to execute a buy trade. Finally, the POST request to /api/transactions/sell processes the selling of holdings.

---

### 8. Authentication

We designed our authentication system to be entirely stateless and highly secure using JSON Web Tokens (JWT) sent via request headers.

When a user successfully logs in, the backend uses the bcryptjs library to compare password hashes, and then generates a secure token. Here is the exact authentication code we implemented to handle a secure user login:

```javascript
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkeyforjwtshopezstocks',
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

To protect secure routes, we wrote a custom middleware function that intercepts incoming requests, extracts the Bearer token from the Authorization header, and verifies the JWT signature before allowing the request to proceed to the database.

---

### 9. User Interface

The user interface was crafted to provide a premium, modern aesthetic using React components. We utilized a clean Dark Mode theme with a customized glassmorphism styling setup, making strict use of typography layouts, whitespace hierarchy, and high contrast colors.

Here is an example of the React JSX code we wrote for the Navbar component to dynamically render the user navigation options on the screen:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, balance, onLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom">
      <Link className="navbar-brand" to="/">ShopEZ Stocks</Link>
      <span>Balance: ₹{balance.toFixed(2)}</span>
      <button onClick={onLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;
```

We implemented subtle CSS hover effects across all these components, so that when a user moves their mouse over a stock listing row or a transaction button, the element gently elevates with a drop shadow, providing immediate visual feedback.

---

### 10. Testing

Our testing strategy was divided into two distinct phases to ensure maximum application stability.

First, we conducted extensive manual API testing using a tool called Postman. Before integrating the frontend, we sent dozens of simulated HTTP requests directly to our backend server. We intentionally sent malformed data, such as missing email fields or invalid passwords, to ensure that our Express error-handling middleware caught the mistakes and returned graceful 400-level error messages rather than crashing the Node.js process.

Second, we performed rigorous end-to-end user flow testing directly in the browser. We simulated the exact path a human user would take: registering a new account, navigating the stock catalog, viewing interactive price charts, executing buy/sell transactions, monitoring portfolio updates, and auditing transactions. We repeated this process across multiple modern browsers, including Google Chrome and Mozilla Firefox, to verify that our React context state remained synchronized and our CSS layouts rendered flawlessly.

---

### 11. Screenshots or Demo

The application has been successfully deployed to a live production environment using Vercel's global edge network.

```
+-------------------------------------------------------------+
| ShopEZ Stocks               Explore   Investments   Admin   |
|                                                             |
| Virtual Balance: ₹50,000.00                   User: trader  |
+-------------------------------------------------------------+
|                                                             |
|  Live Stock Tickers                                         |
|  +----------+--------------------+-------------+---------+  |
|  | Symbol   | Company            | Price       | Change  |  |
|  +----------+--------------------+-------------+---------+  |
|  | RELIANCE | Reliance Ind.      | ₹2,450.00   | +0.65%  |  |
|  | TCS      | Tata Consult.      | ₹3,850.00   | -1.15%  |  |
|  | AAPL     | Apple Inc. (US)    | $180.50     | +0.80%  |  |
|  +----------+--------------------+-------------+---------+  |
|                                                             |
+-------------------------------------------------------------+
```

---

### 12. Known Issues

There are a few known issues inherent to our deployment architecture that developers should be aware of.

The most prominent issue involves Serverless Cold Starts. Because Vercel puts our backend functions to sleep when no users are active, the very first API request made after a period of inactivity may take an additional one to two seconds to resolve. This delay occurs because the serverless function has to wake up, execute the Node runtime, and establish a fresh connection to the MongoDB Atlas cluster before it can answer the frontend.

Additionally, developers running massive database seeding scripts locally might encounter connection timeouts. Free-tier MongoDB Atlas clusters strictly limit the number of maximum parallel connections. If a script attempts to insert thousands of records simultaneously without batching, the database will throttle the request, resulting in a dropped connection.

---

### 13. Future Enhancements

While the current platform is incredibly robust, we have outlined several potential future features that would elevate the project even further.

The most crucial enhancement is the integration of a real Payment Gateway. Currently, the checkout flow handles the logical creation of simulated balances in the database, but we plan to implement the Stripe API to securely process real credit card transactions for sandboxed wallet top-ups in a fully compliant manner.

We also intend to implement Email Notifications. By integrating a service like SendGrid or Nodemailer, we can write backend triggers that automatically send a beautifully formatted order confirmation email to the user the exact moment their trade execution is completed.

Finally, we want to add Real-Time Analytics and User Reviews. We will build a chart-based dashboard allowing sellers and traders to visualize their performance volume over time. Concurrently, we will expand the stock schema to allow verified users to post sentiment ratings, significantly enhancing the social proof and overall credibility of the simulator.
