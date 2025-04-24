# CodeUnity Web Application Architecture

```mermaid
flowchart LR
    subgraph "Client Apps"
        Web["Web Application\n(React/Vite)"]
        Mobile["Mobile\n(React Native)"]
    end

    subgraph "API Gateway"
        Express["Express API Router\n(JWT Middleware)"]
    end

    subgraph "Microservices"
        Auth["User Authentication\nService"]
        DevAPI["Developers API"]
        StudAPI["Students API"]
        DiscAPI["Discussions API"]
        PayAPI["Payments API"]
        NotifyAPI["Notifications API"]
        OrderAPI["Order Tracking\nService"]
        BadgeAPI["Badge System\nService"]
    end

    subgraph "Databases"
        AuthDB[(Authentication DB)]
        DevDB[(Developers DB)]
        StudDB[(Students DB)]
        DiscDB[(Discussions DB)]
        PayDB[(Payments DB)]
        NotifyDB[(Notifications DB)]
        OrderDB[(Orders DB)]
        BadgeDB[(Badges DB)]
    end

    subgraph "External Services"
        Pusher["Pusher\n(Real-time Broker)"]
        Stripe["Stripe\n(Payments)"]
        ZegoCloud["ZegoCloud\n(Video/Chat)"]
        Nodemailer["Nodemailer\n(Email Service)"]
    end

    Web --> Express
    Mobile --> Express
    
    Express --> Auth
    Express --> DevAPI
    Express --> StudAPI
    Express --> DiscAPI
    Express --> PayAPI
    Express --> NotifyAPI
    Express --> OrderAPI
    Express --> BadgeAPI
    
    Auth --> AuthDB
    DevAPI --> DevDB
    StudAPI --> StudDB
    DiscAPI --> DiscDB
    PayAPI --> PayDB
    NotifyAPI --> NotifyDB
    OrderAPI --> OrderDB
    BadgeAPI --> BadgeDB
    
    PayAPI --> Stripe
    NotifyAPI --> Nodemailer
    NotifyAPI --> Pusher
    DiscAPI --> Pusher
    Auth --> ZegoCloud
    
    classDef clientApps fill:#d4f8e8,stroke:#1EB386,stroke-width:2px
    classDef apiGateway fill:#b8f1fc,stroke:#0284c7,stroke-width:2px
    classDef microservices fill:#a5f3fc,stroke:#0284c7,stroke-width:2px
    classDef databases fill:#93c5fd,stroke:#2563eb,stroke-width:2px
    classDef extServices fill:#e9d5ff,stroke:#9333ea,stroke-width:2px
    
    class Web,Mobile clientApps
    class Express apiGateway
    class Auth,DevAPI,StudAPI,DiscAPI,PayAPI,NotifyAPI,OrderAPI,BadgeAPI microservices
    class AuthDB,DevDB,StudDB,DiscDB,PayDB,NotifyDB,OrderDB,BadgeDB databases
    class Pusher,Stripe,ZegoCloud,Nodemailer extServices
```

## CodeUnity Architecture Overview

This architecture is designed for the CodeUnity platform, which connects students with developers for collaboration, learning, and project development.

### Client Applications
- **Web Application**: Built with React.js and Vite for fast rendering and optimal performance
- **Mobile Interface**: Potential React Native implementation for cross-platform mobile access

### API Gateway
- **Express Router**: Centralized entry point that routes client requests to appropriate microservices
- **Authentication Middleware**: Validates JWT tokens and manages user sessions
- **Request Validation**: Ensures all incoming requests are properly formatted and validated

### Microservices

1. **User Authentication Service**
   - Manages user registration, login, and profile management
   - Handles OAuth integration with Google, GitHub, and LinkedIn
   - Implements JWT-based authentication and authorization

2. **Developers API**
   - Manages developer profiles, skills, and availability
   - Handles developer search with advanced filtering
   - Processes ratings and reviews for developers

3. **Students API**
   - Manages student profiles and project requirements
   - Tracks student progress and interactions
   - Handles student feedback and support requests

4. **Discussions API**
   - Powers forum functionality with threads and replies
   - Implements real-time comment updates
   - Handles content moderation and reporting

5. **Payments API**
   - Processes payments through Stripe integration
   - Manages subscription plans and billing cycles
   - Handles payment disputes and refunds

6. **Notifications API**
   - Delivers in-app notifications
   - Sends email notifications through Nodemailer
   - Manages real-time alerts with Pusher

7. **Order Tracking Service**
   - Manages project orders and their lifecycle
   - Tracks development milestones and deliverables
   - Handles order modifications and cancellations

8. **Badge System Service**
   - Implements gamification with achievement badges
   - Tracks user progress and awards accomplishments
   - Displays user achievements and recognition

### Databases
- **MongoDB**: NoSQL database storing data for all services
- **Mongoose**: Object Data Modeling library for schema validation

### External Services
- **Pusher**: Real-time messaging and notifications
- **Stripe**: Payment processing and subscription management
- **ZegoCloud**: Video communication and streaming
- **Nodemailer**: Email delivery service

### Communication Patterns
- RESTful API communication between client and services
- WebSocket connections for real-time features
- Service-to-service communication through internal APIs

### Security Features
- JWT-based authentication for secure API access
- Password encryption with Bcrypt
- CORS configuration for API protection
- Input validation and sanitization to prevent injection attacks 