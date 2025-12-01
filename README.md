# 🔐 E2EE Chat Application


A secure, real-time chat application featuring **End-to-End Encryption (E2EE)**, built with Next.js, Socket.IO, and PostgreSQL. This application ensures that your conversations remain private and secure, with a modern and responsive user interface.

## 🚀 Features

-   **🔒 End-to-End Encryption**: 
    -   Messages are encrypted on the client-side using **RSA-OAEP** for secure key exchange and **AES-GCM** for message encryption.
    -   **Self-Decryption**: Messages are encrypted for both the recipient and the sender, allowing you to read your own sent messages across different sessions and devices.
    -   **Secure Key Management**: Private keys are stored locally (using `localStorage` for the MVP), while public keys are exchanged securely via the server.
-   **⚡ Real-time Messaging**: Powered by a dedicated **Socket.IO** server for instant message delivery and updates.
-   **🛡️ Authentication**: Secure Email/Password login using **NextAuth.js** (Credentials Provider).
-   **🎨 Modern UI**: A sleek, dark-mode interface built with **Tailwind CSS** and **Lucide Icons**.
-   **💬 Room Management**: Create and manage 1:1 chats with other users seamlessly.

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide React |
| **Backend** | Node.js, Socket.IO Server, Express |
| **Database** | PostgreSQL, Prisma ORM |
| **Security** | Web Crypto API (Native browser standard), NextAuth.js |
| **Language** | TypeScript |

## 🏗 Architecture

The project is organized as a monorepo with two main services:

1.  **`frontend/`**: The Next.js application that handles the User Interface, Authentication, and API routes.
2.  **`backend/`**: A standalone Node.js server running Socket.IO to handle real-time communication events.

Both services connect to the same **PostgreSQL** database using **Prisma ORM** for data persistence.

## 📂 Project Structure

```
chat-app/
├── backend/                # Node.js + Socket.IO Server
│   ├── prisma/             # Database schema and migrations
│   ├── server.ts           # Entry point for the backend
│   └── ...
├── frontend/               # Next.js Application
│   ├── app/                # App Router pages and layouts
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions (crypto, api, etc.)
│   └── ...
├── README.md               # Project documentation
└── ...
```

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   **Node.js** (v18 or higher)
-   **npm** or **yarn**
-   **PostgreSQL** (running locally or via a cloud provider like Supabase/Neon)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chat-app
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chat_db?schema=public"
PORT=4000
```

Generate the Prisma client and push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

Start the backend server:

```bash
npm run dev
```
> The backend will run on `http://localhost:4000`

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-at-least-32-chars"
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

Start the frontend development server:

```bash
npm run dev
```
> The frontend will run on `http://localhost:3000`

### 4. Usage

1.  Open `http://localhost:3000` in your browser.
2.  Register a new account.
3.  Open the app in a second browser window (or Incognito mode) and register a second account.
4.  Start a chat between the two users and test the real-time encrypted messaging!

## 🔧 Troubleshooting

### JWEDecryptionFailed Error
This error usually happens when `NEXTAUTH_SECRET` is missing or has changed.
1.  Verify `.env.local` has a valid `NEXTAUTH_SECRET`.
2.  Restart the frontend server.
3.  Clear your browser cookies and try logging in again.

### Cannot Connect to Backend
1.  Ensure the backend server is running on port `4000`.
2.  Check that `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local` matches the backend URL.
3.  Check the browser console for CORS errors.

## 🔒 Security Note

**Key Storage**: In this MVP, private keys are stored in `localStorage` for simplicity. This is vulnerable to XSS attacks. For a production-grade application, consider using `IndexedDB` with proper safeguards or a dedicated key management solution.



## 📄 License

This project is licensed under the MIT License.
