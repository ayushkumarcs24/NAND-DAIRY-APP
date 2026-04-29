# 🥛 Nand Dairy App

Nand Dairy is a comprehensive mobile and backend solution designed for managing daily operations in a dairy cooperative system. It streamlines the complex workflow of milk collection from multiple samitis (co-operatives), quality testing (FAT/SNF), automated rate calculation, comprehensive reporting, and distributor order management.

## 🏗️ Project Structure

The project is structured as a monorepo containing:

- `/NandDairy` - The cross-platform frontend application.
- `/backend` - The REST API backend server.
- `/postman` - Contains Postman collections for testing backend APIs.

## 🛠️ Technology Stack

### Frontend (Mobile & Web App)
- **Framework:** React Native (v0.81) & Expo (v54)
- **Language:** TypeScript
- **Navigation:** Expo Router (v6) for file-based routing
- **UI Library:** React Native Paper (Material Design 3)
- **State/Storage:** AsyncStorage, SecureStore
- **Networking:** Axios

### Backend (REST API)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (using `pg` driver)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs for password hashing

## 👥 User Roles & Modules

The application utilizes Role-Based Access Control (RBAC) to serve distinct interfaces for different users:

1. **Admin (`/admin`)**: 
   - Manage staff users (accountants, testers).
   - Manage Samitis (co-operatives) and link them to collection vehicles.
   - Manage product catalog and pricing.
   - Monitor and manage distributor orders and payment buffers.
   
2. **Milk Entry (`/milk-entry`)**: 
   - Dedicated interface for morning and evening collection shifts.
   - Search assigned vehicles and select associated Samitis.
   - Input daily milk quantities collected (in Liters).

3. **FAT/SNF (`/fat-snf`)**: 
   - Process pending milk entries.
   - Input FAT % and SNF % values to determine milk quality.
   - Automatically calculate live estimated amounts based on dynamic rate charts.

4. **Report (`/report`)**: 
   - View daily summaries of milk collection, average FAT/SNF, and total amounts per Samiti.
   - Generate detailed 10-day billing reports for specific Samitis.

5. **Distributor (`/distributor`)**: 
   - Dedicated shop interface to browse available dairy products.
   - Add products to cart and place orders.
   - View order history, invoices, and manage payment buffers.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI for the mobile app
- PostgreSQL database

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd NandDairy
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run start
   # or
   npx expo start
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your PostgreSQL database and configure environment variables (check `.env.example`).
4. Run database migrations and seed data:
   ```bash
   npm run migrate
   npm run seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 🎨 Design System

The mobile application utilizes a custom **"Apple Obsidian Dark"** premium design system built on top of `react-native-paper` (MD3 Dark Theme). It features borderless cards, tonal layering, and high-contrast typography. Key design tokens and colors are centralized in `NandDairy/constants/Theme.ts`.

## 🔒 Authentication & Security

The app uses a unified login screen. Upon successful authentication via JWT, users are automatically routed to their respective module spaces based on their role. Sensitive data such as authentication tokens are stored securely using Expo SecureStore on the client side, and passwords are comprehensively hashed using `bcrypt` on the backend.

## 🌐 Deployment & Hosting

- **Backend:** Configured for deployment on **Render** as a Node.js web service.
- **Frontend:** Expo web build is configured for hosting on **Vercel**, while native builds can be compiled using EAS (Expo Application Services).

## 📝 API Documentation

API endpoint collections are provided in the `/postman` directory at the root of the project. These can be imported directly into Postman to test authentication, user management, samiti creation, milk entries, and distributor orders.
