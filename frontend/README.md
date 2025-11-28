# Secure E2EE Chat Application

A modern, real-time chat application with End-to-End Encryption (E2EE) built with Next.js, Socket.IO, and PostgreSQL.

## Features
- **Real-time Messaging**: Powered by Socket.IO.
- **End-to-End Encryption**: Messages are encrypted on the client using Web Crypto API (RSA-OAEP + AES-GCM) and only decrypted by the recipient. Server never sees plain text.
- **Authentication**: Secure login via Google and GitHub (NextAuth.js).
- **User Profiles**: Random avatars and user search.
- **Persistent History**: Encrypted messages stored in PostgreSQL.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Lucide React.
- **Backend**: Custom Next.js Server (Node.js + Socket.IO), Prisma ORM.
- **Database**: PostgreSQL.
- **Security**: Web Crypto API, NextAuth.js.

## Setup & Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL Database

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Environment Variables in `.env`:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/chat_db"
    NEXTAUTH_SECRET="your-secret-key"
    NEXTAUTH_URL="http://localhost:3000"
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"
    GITHUB_ID="your-github-id"
    GITHUB_SECRET="your-github-secret"
    ```
4.  Initialize Database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Running Locally
To run the custom server (which handles both Next.js and Socket.IO):
```bash
npm run dev
```
Visit `http://localhost:3000`.

### Deployment
1.  Build the application:
    ```bash
    npm run build
    ```
2.  Start the production server:
    ```bash
    npm start
    ```
    *Note: Ensure your hosting provider supports long-running Node.js processes (e.g., VPS, Railway, Render) for Socket.IO. Vercel Serverless Functions do not support persistent Socket.IO connections easily.*

## Security Note
Private keys are stored in `localStorage` for this MVP. For production, use `IndexedDB` or a more secure storage mechanism.
