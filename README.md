# No Dues Management System - Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white)

---

## Project Overview

This is the frontend for the No Dues Management System, a modern web application designed to streamline and automate the process of managing student dues within an educational institution. The system provides a centralized platform for administrators to track outstanding payments, for department heads to approve clearances, and for students to view their due status and request a "No Dues" certificate.

This project aims to replace the cumbersome and error-prone manual process of obtaining a No Dues certificate, saving time and effort for both students and staff. It provides a transparent, role-based system ensuring that all financial and departmental obligations are met before a student graduates or leaves the institution.

---

## Key Features ✨

* **Secure Authentication:** JWT-based authentication with flows for login, forgot password, and reset password.
* **Role-Based Dashboards:** Customized user interfaces and functionalities tailored for different roles (e.g., Super Admin, Department Admin, Student).
* **Student & User Management:** Admins can perform full CRUD (Create, Read, Update, Delete) operations on student and user accounts.
* **Due Tracking:** Ability to add, update, and manage dues for individual students across various departments.
* **Certificate Approval Workflow:** A multi-step process for requesting and approving No Dues certificates, with each relevant department having the ability to approve or reject a request.
* **Profile Management:** Users can view and update their personal profile information.

---

## Tech Stack 🛠️

This project is built with a modern and robust technology stack to ensure a high-quality user experience and developer efficiency.

* **Core Frontend:**
    * **React 19:** A JavaScript library for building user interfaces.
    * **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
    * **Vite:** A next-generation frontend tooling that provides an extremely fast development environment.

* **UI & Styling:**
    * **Material-UI (MUI):** A comprehensive suite of UI tools to help you ship new features faster.
    * **Emotion:** A library designed for writing CSS styles with JavaScript.

* **Routing:**
    * **React Router DOM:** Declarative routing for React applications.

* **State Management & API Communication:**
    * **TanStack Query (React Query):** For fetching, caching, and updating asynchronous data in React.
    * **Axios:** A promise-based HTTP client for the browser and Node.js.
    * **React Context:** For managing global state like authentication.

* **Forms & Validation:**
    * **React Hook Form:** Performant, flexible, and extensible forms with easy-to-use validation.
    * **Zod:** A TypeScript-first schema declaration and validation library.

* **Utilities:**
    * **jwt-decode:** For decoding JWTs.
    * **date-fns:** A modern JavaScript date utility library.

---

## Project Structure 📁

The `src/` directory is organized to maintain a clean and scalable codebase:

```
Directory structure:
└── frontend/
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── src/
    │   ├── App.css
    │   ├── App.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   ├── vite-env.d.ts
    │   ├── components/
    │   │   ├── NoDueCertificateRequest.tsx
    │   │   ├── StudentDuesStatus.tsx
    │   │   └── Layout/
    │   │       └── Layout.tsx
    │   ├── constants/
    │   │   └── departments.ts
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── Certificates.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Departments.tsx
    │   │   ├── Dues.tsx
    │   │   ├── ForgetPassword.tsx
    │   │   ├── Login.tsx
    │   │   ├── NoDuesCertificate.tsx
    │   │   ├── Profile.tsx
    │   │   ├── ResetPassword.tsx
    │   │   ├── Students.tsx
    │   │   └── Users.tsx
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   ├── certificateService.ts
    │   │   ├── departmentService.ts
    │   │   ├── dueService.ts
    │   │   └── userService.ts
    │   ├── theme/
    │   │   └── index.ts
    │   ├── types/
    │   │   └── index.ts
    │   └── utils/
    │       └── auth.ts
    └── .vite/
        └── deps/
            ├── _metadata.json
            ├── package.json
            ├── react.js
            └── react_jsx-dev-runtime.js

```

## Getting Started 🚀

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

* **Node.js** (version 18 or higher)
* **npm** or **yarn**

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/grvmehto-18-no-dues-frontend.git](https://github.com/your-username/grvmehto-18-no-dues-frontend.git)
    ```

2.  **Navigate to the frontend directory:**
    ```bash
    cd grvmehto-18-no-dues-frontend/frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the `frontend` directory and add the URL for the backend API.
    ```
    VITE_API_BASE_URL=http://localhost:5000/api
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

---

## Available Scripts

In the `frontend` directory, you can run the following scripts:

* `npm run dev`: Starts the development server with Hot Module Replacement (HMR).
* `npm run build`: Bundles the app for production.
* `npm run lint`: Runs the ESLint checker to find and fix problems in the code.
* `npm run preview`: Starts a local server to preview the production build.

---

## Core Concepts Explained

### Authentication Flow

Authentication is managed globally using React Context via `src/context/AuthContext.tsx`. This context provides the user's authentication state, user data, and login/logout functions to the entire application.

Routing is protected using the `ProtectedRoute` component in `App.tsx`. It checks for a valid JWT in local storage and verifies its expiration. If the user is not authenticated or the token is expired, they are redirected to the `/login` page.

### Centralized API Service

All API requests are handled through a centralized Axios instance configured in `src/services/api.ts`. This file includes an Axios **request interceptor** that automatically attaches the user's JWT to the `Authorization` header of every outgoing request. This eliminates the need to add the token manually for each API call, simplifying data fetching throughout the application.

```tsx
// src/services/api.ts (simplified)
import axios from 'axios';
import { getToken } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;


Contributing
Contributions are welcome! If you have suggestions for improvement or want to report a bug, please feel free to open an issue or submit a pull request.
Fork the Project
Create your Feature Branch (git checkout -b feature/AmazingFeature)
Commit your Changes (git commit -m 'Add some AmazingFeature')
Push to the Branch (git push origin feature/AmazingFeature)
Open a Pull Request
License
This project is licensed under the MIT License. See the LICENSE file for more details.

