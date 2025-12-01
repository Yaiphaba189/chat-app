# E2EE Chat Application

A secure, real-time chat application featuring **End-to-End Encryption (E2EE)**, built with Next.js, Socket.IO, and PostgreSQL.

## 🚀 Features

-   **End-to-End Encryption**: Messages are encrypted on the client-side using **RSA-OAEP** (for key exchange) and **AES-GCM** (for message encryption).
    -   **Self-Decryption**: Messages are encrypted for both the recipient and the sender, allowing you to read your own sent messages across sessions.
    -   **Secure Key Management**: Private keys are stored locally (localStorage for MVP), public keys are exchanged via the server.
-   **Real-time Messaging**: Powered by a standalone **Socket.IO** server.
-   **Authentication**: Secure Email/Password login using **NextAuth.js** (Credentials Provider).
-   **Modern UI**: Built with **Tailwind CSS** and **Lucide Icons** for a sleek, dark-mode interface.
-   **Room Management**: Create 1:1 chats with other users.

## 🛠 Tech Stack

-   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
-   **Backend**: Node.js, Socket.IO Server
-   **Database**: PostgreSQL, Prisma ORM
-   **Security**: Web Crypto API (Native browser standard)

## 🏗 Architecture

The project is split into two parts:

1.  **`frontend/`**: The Next.js application handling the UI, Authentication, and API routes.
2.  **`backend/`**: A dedicated Node.js server running Socket.IO for real-time communication.

Both services connect to the same PostgreSQL database via Prisma.

## 🏁 Getting Started

### Prerequisites
   ```bash
   # Backend
   cd backend
   npm install
   npx prisma generate
   
   # Frontend
   cd ../frontend
   npm install
   ```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
(Runs on `http://localhost:4000`)

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
(Runs on `http://localhost:3000`)

Visit `http://localhost:3000` to use the app.


## Security Note
Private keys are stored in `localStorage` for this MVP. For production, use `IndexedDB` or a more secure storage mechanism.
