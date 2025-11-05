# Live Chat Backend

Real-time chat application backend built with TypeScript, Express, Socket.IO, and MongoDB.

## Features

- **Real-time messaging** with Socket.IO
- **JWT authentication** with secure token handling
- **Group and single chats** with admin controls
- **Message pagination** for performance
- **TypeScript** for type safety
- **Production-ready** with security middleware

## Tech Stack

- **Node.js** + **Express.js**
- **TypeScript** for type safety
- **Socket.IO** for real-time communication
- **MongoDB** + **Mongoose** for data storage
- **JWT** for authentication
- **bcryptjs** for password hashing

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB running locally or connection string
- npm >= 8.0.0

### Installation

```bash
# Clone repository
git clone <repository-url>
cd live-chat-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

### Environment Variables

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/live-chat
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Development

```bash
# Start development server
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/user/signup` - User registration
- `POST /api/user/signin` - User login
- `GET /api/user/profile` - Get user profile (protected)

### Users
- `GET /api/user/all?search=query` - Get all users with search

### Chats
- `POST /api/chat/chats` - Create new chat
- `GET /api/chat/chats` - Get user's chats with last message
- `GET /api/chat/chats/:id/messages?page=1&limit=20` - Get chat messages (paginated)

### Group Management
- `PUT /api/chat/chats/:id/group-name` - Update group name (admin only)
- `POST /api/chat/chats/:id/members` - Add group member (admin only)
- `DELETE /api/chat/chats/:id/members` - Remove group member (admin only)

## Socket.IO Events

### Client → Server
- `join-chats` - Join user's chat rooms
- `send-message` - Send message to chat
- `typing` - Send typing indicator

### Server → Client
- `new-message` - Receive new message
- `user-typing` - Receive typing indicator
- `error` - Error notifications

## Usage Examples

### Authentication
```javascript
// Signup
POST /api/user/signup
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}

// Signin
POST /api/user/signin
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Socket.IO Client
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Join chats
socket.emit('join-chats');

// Send message
socket.emit('send-message', {
  chatId: 'CHAT_ID',
  content: 'Hello World!'
});

// Listen for messages
socket.on('new-message', (data) => {
  console.log('New message:', data.message);
});
```

## Production Deployment

```bash
# Install production dependencies
npm ci --omit=dev

# Build application
npm run build

# Start production server
npm run start:prod
```

### Production Environment
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
CLIENT_URL=https://yourdomain.com
```

## Project Structure

```
src/
├── controller/          # Route controllers
│   ├── chat.ts         # Chat operations
│   ├── group.ts        # Group management
│   └── user.ts         # User authentication
├── middleware/         # Custom middleware
│   ├── auth.ts         # JWT authentication
│   └── socketAuth.ts   # Socket authentication
├── model/              # MongoDB models
│   ├── chat.ts         # Chat schema
│   └── user.ts         # User schema
├── routes/             # API routes
│   ├── chat.ts         # Chat routes
│   └── user.ts         # User routes
├── types/              # TypeScript interfaces
│   ├── index.ts        # Main types
│   └── socket.ts       # Socket event types
├── utils/              # Utility functions
│   ├── jwt.ts          # JWT helpers
│   └── socketHandlers.ts # Socket event handlers
├── app.ts              # Express app setup
└── connection.ts       # MongoDB connection
```

## Security Features

- **Helmet** for security headers
- **CORS** configuration
- **Rate limiting** (100 requests/15min)
- **Input validation** with express-validator
- **JWT token** authentication
- **Password hashing** with bcryptjs

## License

MIT License