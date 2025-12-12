# Project Report: Secure Real-Time Chat Application

## 1. Project Overview

This project is a secure, real-time chat application designed to facilitate seamless communication between users. It features **End-to-End Encryption (E2EE)** to ensure complete privacy, real-time messaging using WebSockets, and a modern, responsive user interface. The system supports direct messaging (DM) and group chats, along with file sharing capabilities.

## 2. Methodology

The project follows an **Agile development methodology**, specifically adopting an iterative and incremental approach.

- **Component-Based Architecture**: The frontend is built using reusable React components (e.g., `ChatLayout`, `MessageBubble`) to ensure maintainability and scalability.
- **Separation of Concerns**: Clear separation between the client-side (Next.js) and server-side (Express.js) logic.
- **Real-Time Event Driven**: The core communication logic is event-driven, utilizing Socket.IO for instant data transfer without polling.
- **Security First**: The design incorporates **End-to-End Encryption (E2EE)** using RSA and AES standards to guarantee data privacy.

## 3. System Architecture

The system is built using a **Monorepo-style structure** (logically separated) with a distinct Frontend and Backend.

- **Frontend**: Next.js (React framework) for the UI and Authentication handling.
- **Backend**: Node.js with Express for the REST API and Socket.IO for real-time communication.
- **Database**: PostgreSQL managed via Prisma ORM.

### Architecture Diagram

```mermaid
graph TD
    Client[User Client \n Browser]

    subgraph Frontend [Next.js App]
        UI[User Interface]
        AuthClient[NextAuth Client]
        SocketClient[Socket.IO Client]
    end

    subgraph Backend [Node.js Server]
        API[Express REST API]
        SocketServer[Socket.IO Server]
        AuthAPI[Auth Endpoints]
    end

    subgraph Database
        DB[(PostgreSQL)]
    end

    Client <--> UI
    UI --> AuthClient
    UI <--> SocketClient

    AuthClient -- HTTP POST /login --> AuthAPI
    UI -- HTTP GET/POST --> API
    SocketClient -- WebSocket --> SocketServer


    API --> DB
    SocketServer --> DB
    AuthAPI --> DB
```

## 4. Security Architecture (E2EE)

The application implements **End-to-End Encryption (E2EE)** using a Hybrid Encryption scheme (RSA + AES) to ensure that only the intended recipients can read messages. The server only stores encrypted data and never has access to the private keys or plaintext messages.

### Encryption Mechanism

1.  **Key Pair Generation**: Upon registration, every user generates an **RSA 2048-bit Key Pair** (Public/Private) in their browser.
    - **Public Key**: Sent to the server and stored for other users to use.
    - **Private Key**: Stored securely in the user's browser (IndexedDB/Local Storage) and **never leaves the client**.
2.  **Message Encryption (Hybrid)**:
    - **AES Key**: For every message, a random **AES-256 key** is generated.
    - **Payload Encryption**: The message content is encrypted using this AES key.
    - **Key Encryption**: The AES key itself is encrypted using the _Recipient's Public Key_.
3.  **Decryption**:
    - The Recipient downloads the encrypted message and the encrypted AES key.
    - They use their **Private Key** to decrypt the AES key.
    - They use the decrypted AES key to decrypt the message content.

### E2EE Workflow Diagram

```mermaid
sequenceDiagram
    participant Sender
    participant Server
    participant Recipient

    note over Sender, Recipient: 1. Setup Phase
    Recipient->>Recipient: Generate RSA Keys
    Recipient->>Server: Upload Public Key

    note over Sender, Recipient: 2. Sending Phase
    Sender->>Server: Fetch Recipient's Public Key
    Server-->>Sender: Return Public Key

    Sender->>Sender: Generate Random AES Key
    Sender->>Sender: Encrypt Message with AES Key
    Sender->>Sender: Encrypt AES Key with Recipient's Public Key

    Sender->>Server: Send (Encrypted Msg + Encrypted Key)

    note over Sender, Recipient: 3. Receiving Phase
    Server->>Recipient: Push (Encrypted Msg + Encrypted Key)
    Recipient->>Recipient: Decrypt AES Key with Private Key
    Recipient->>Recipient: Decrypt Message with AES Key
    Recipient->>Recipient: Display Plaintext
```

## 5. Backend Implementation

The backend is a robust Node.js application using TypeScript.

### Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Real-time Engine**: Socket.IO
- **ORM**: Prisma
- **Database**: PostgreSQL

### Key Components

1.  **Server Entry (`server.ts`)**:
    - Initializes the Express app and HTTP server.
    - Sets up Socket.IO with CORS configurations.
    - Manages online user states using a `Map<UserId, SocketId>`.
2.  **API Routes (`routes.ts`)**:
    - `POST /api/auth/register`: Creates new users with hashed passwords (bcrypt).
    - `POST /api/auth/login`: Validates credentials.
    - `GET /api/user`: Fetches user details.
    - `POST /api/rooms`: Creates or retrieves chat rooms.
    - `POST /api/upload`: Handles file uploads using `Multer`.
3.  **Socket Events**:
    - `join-room`: Subscribes a socket to a specific room channel.
    - `send-message`: Receives a message, saves it to the DB via Prisma, and broadcasts it to the room.
    - `user-online`/`disconnect`: Tracks user presence.

## 6. Frontend Implementation

The frontend is a modern web application built with Next.js 16.

### Technologies

- **Framework**: Next.js (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: NextAuth.js (Custom Credentials Provider)

### Key Components

1.  **Authentication (`lib/auth.ts`)**:
    - Uses `CredentialsProvider` to authenticate against the backend API.
    - Manages user sessions using JWT strategies.
2.  **Layouts (`ChatLayout`)**:
    - Main wrapper that handles the responsive sidebar and chat window structure.
3.  **Real-time Integration**:
    - initializes a Socket.IO client connection on mount.
    - Listens for incoming messages and updates the UI state in real-time.

## 7. Data Flow Diagrams

### DFD Level 0 (Context Diagram)

```mermaid
graph LR
    User((User))
    System[Chat System]

    User -- Send Message --> System
    User -- Login Credentials --> System
    User -- File Upload --> System

    System -- Real-time Updates --> User
    System -- Auth Token --> User
```

### DFD Level 1

```mermaid
graph LR
    User((User))

    subgraph "Chat Application System"
        Auth[Authentication Module]
        Chat[Chat Engine<br>Socket.IO]
        MsgHandler[Message Handler]
        FileHandler[File Upload Service]
        DB[(Database)]
    end

    User -- 1. Login/Register --> Auth
    Auth -- 2. Verify/Create --> DB
    Auth -- 3. Return Session --> User

    User -- 4. Connect --> Chat
    Chat -- 5. Update Status --> DB

    User -- 6. Send Message --> Chat
    Chat -- 7. Process Message --> MsgHandler
    MsgHandler -- 8. Store Message --> DB
    MsgHandler -- 9. Broadcast --> Chat
    Chat -- 10. Deliver Message --> User

    User -- 11. Upload File --> FileHandler
    FileHandler -- 12. Save File --> DB
```

## 8. Entity Relationship (ER) Diagram

Based on the Prisma Schema, the database structure is as follows. (Represented horizontally)

```mermaid
classDiagram
    direction LR

    class User {
        String id PK
        String name
        String email UK
        String image
        String password
        String publicKey
        DateTime createdAt
    }

    class Room {
        String id PK
        String name
        Boolean isGroup
        DateTime createdAt
    }

    class RoomMember {
        String id PK
        String userId FK
        String roomId FK
        DateTime joinedAt
    }

    class Message {
        String id PK
        String content
        String encryptedKey
        String iv
        String senderId FK
        String roomId FK
        MessageType type
        String fileName
        DateTime createdAt
    }

    User "1" --> "*" RoomMember : is member of
    User "1" --> "*" Message : sends

    Room "1" --> "*" RoomMember : has members
    Room "1" --> "*" Message : contains

    RoomMember "*" --> "1" User : linked to
    RoomMember "*" --> "1" Room : linked to
```

## 9. System Workflow (Detailed)

This diagram illustrates the flow of a user logging in and sending a message.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BA as Backend API
    participant S as Socket Server
    participant DB as Database

    %% Authentication
    U->>FE: Enter Credentials
    FE->>BA: POST /api/auth/login
    BA->>DB: Find User & Verify Hash
    DB-->>BA: User Data
    BA-->>FE: Auth Success (User Info)

    %% Connection
    FE->>S: Connect (Socket.IO)
    S-->>FE: Connected
    FE->>S: Emit "user-online"

    %% Messaging
    U->>FE: Type & Send Message
    FE->>S: Emit "send-message"
    S->>DB: Save Message
    DB-->>S: Message Saved
    S-->>FE: Emit "receive-message" (To Room)
    FE-->>U: Display Message
```
