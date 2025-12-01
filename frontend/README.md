# Chat Application - Frontend

A modern, real-time chat application built with Next.js, Socket.IO, and NextAuth.js for authentication.

## Features
- **Real-time Messaging**: Powered by Socket.IO for instant communication
- **Secure Authentication**: Email/password authentication using NextAuth.js
- **User Profiles**: Customizable user profiles with avatars
- **Modern UI**: Clean and responsive interface built with TailwindCSS
- **Type-safe**: Built with TypeScript for better developer experience

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Authentication**: NextAuth.js (Credentials Provider)
- **Real-time**: Socket.IO Client
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## Prerequisites
- Node.js 18+
- Running backend server (see backend README)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   
   Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and configure the following variables:
   ```env
   # NextAuth Secret - Generate with: openssl rand -base64 32
   NEXTAUTH_SECRET=your-generated-secret-here
   
   # NextAuth URL - Base URL of the application
   NEXTAUTH_URL=http://localhost:3000
   
   # Backend API URL
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   ```

3. **Generate a secure NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and use it as your `NEXTAUTH_SECRET` in `.env.local`

## Running the Application

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

All environment variables should be defined in `.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret key for encrypting JWT tokens | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API server URL | `http://localhost:4000` |

> **Important**: Never commit `.env.local` to version control. Use `env.example` as a template.

## Project Structure
```
frontend/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (NextAuth)
│   ├── chat/              # Chat interface
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
│   └── auth.ts           # NextAuth configuration
├── public/               # Static assets
└── env.example          # Environment variables template
```

## Common Issues

### JWEDecryptionFailed Error
This error occurs when `NEXTAUTH_SECRET` is missing or has changed:
1. Ensure `.env.local` exists with a valid `NEXTAUTH_SECRET`
2. Restart the development server after creating/updating `.env.local`
3. Clear browser cookies and try logging in again

### Cannot Connect to Backend
1. Verify the backend server is running on the correct port
2. Check `NEXT_PUBLIC_BACKEND_URL` matches your backend URL
3. Ensure CORS is properly configured on the backend

## Deployment

When deploying to production:
1. Set all environment variables in your hosting platform
2. Ensure `NEXTAUTH_URL` matches your production domain
3. Use a strong, randomly generated `NEXTAUTH_SECRET`
4. Configure your backend URL appropriately

## License
MIT
