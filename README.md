# 🥛 Nand Dairy App

Nand Dairy is a comprehensive mobile and backend solution designed for managing daily operations in a dairy cooperative system. It streamlines the process of milk collection, FAT/SNF testing, reporting, and distributor management.

## 🏗️ Project Structure

The project is divided into two main parts:

- `/NandDairy` - The mobile frontend application built with **React Native** and **Expo Router**.
- `/backend` - The backend server that powers the mobile app's APIs.

## 👥 User Roles & Modules

The application supports multiple distinct roles, each with its own dedicated interface and functionality:

1. **Admin (`/admin`)**: 
   - Manage accountants (staff users).
   - Manage Samitis (co-operatives).
   - Manage vehicles assigned for milk collection.
   - Manage product catalog.
   - Monitor and manage distributor orders.
   
2. **Milk Entry (`/milk-entry`)**: 
   - Dedicated interface for morning/evening shifts.
   - Search vehicles and select associated Samitis.
   - Input daily milk quantities collected (in Liters).

3. **FAT/SNF (`/fat-snf`)**: 
   - Process pending milk entries.
   - Input FAT % and SNF % values.
   - Calculate live estimated amounts based on current rates.

4. **Report (`/report`)**: 
   - View daily summaries of milk collection, average FAT/SNF, and total amounts per Samiti.
   - Generate detailed 10-day billing reports for specific Samitis.

5. **Distributor (`/distributor`)**: 
   - Dedicated shop interface to browse available dairy products.
   - Add products to cart and place orders.
   - View order history and payment status.

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Expo CLI for the mobile app
- PostgreSQL/MySQL/MongoDB (depending on the backend setup)

### Frontend (Mobile App)
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

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (check for a `.env.example` file).
4. Start the server:
   ```bash
   npm run dev
   # or
   npm start
   ```

## 🎨 Design System

The mobile application currently utilizes a custom **"Apple Obsidian Dark"** design system built on top of `react-native-paper` (MD3 Dark Theme). Key design tokens and colors are centralized in `NandDairy/constants/Theme.ts`.

## 🔒 Authentication

The app uses a unified login screen for all roles. Upon successful login, users are automatically routed to their respective modules based on their assigned role in the system.
