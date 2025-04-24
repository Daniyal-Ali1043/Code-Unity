# CodeUnity Architecture Diagram

```mermaid
flowchart LR
    %% Define the main sections
    subgraph "Client Apps"
        Web["Web\n(React/Vite)"]
        Mobile["Mobile\n(React Native)"]
    end

    subgraph "API Gateway"
        Gateway["API Gateway\n(Express)"]
    end

    subgraph "Microservices"
        UI["App UI\n(React Components)"]
        Profiles["Profile System\n(Users/Devs/Students)"]
        Projects["Project Management"]
        Chat["Chat System"]
        Orders["Order Tracking"]
        Payments["Payment Processing"]
    end

    subgraph "Message Broker"
        Broker["Message Broker\n(Pusher)"]
    end

    %% Connect components
    Web --> Gateway
    Mobile --> Gateway
    
    Gateway --> UI
    Gateway --> Profiles
    Gateway --> Projects
    Gateway --> Chat
    Gateway --> Orders
    Gateway --> Payments
    
    UI --> Broker
    Profiles --> Broker
    Projects --> Broker
    Chat --> Broker
    Orders --> Broker
    Payments --> Broker
    
    %% Define databases for each service
    UIDB[(MongoDB)]
    ProfilesDB[(MongoDB)]
    ProjectsDB[(MongoDB)]
    ChatDB[(MongoDB)]
    OrdersDB[(MongoDB)]
    PaymentsDB[(MongoDB)]
    
    UI --- UIDB
    Profiles --- ProfilesDB
    Projects --- ProjectsDB
    Chat --- ChatDB
    Orders --- OrdersDB
    Payments --- PaymentsDB
    
    %% Style definitions
    classDef clients fill:#D1FFEC,stroke:#5CD6B1,stroke-width:2px
    classDef gateway fill:#E8FAFF,stroke:#81D4FA,stroke-width:2px
    classDef services fill:#81D4FA,stroke:#29B6F6,stroke-width:2px,color:#333
    classDef broker fill:#E8FAFF,stroke:#81D4FA,stroke-width:2px
    classDef database fill:#E8FAFF,stroke:#81D4FA,stroke-width:1px,color:#333
    
    class Web,Mobile clients
    class Gateway gateway
    class UI,Profiles,Projects,Chat,Orders,Payments services
    class Broker broker
    class UIDB,ProfilesDB,ProjectsDB,ChatDB,OrdersDB,PaymentsDB database
```

## CodeUnity Microservices Architecture

The CodeUnity platform uses a modern microservices architecture to provide a scalable and maintainable system for connecting students with developers.

### Client Applications
- **Web Application**: React.js with Vite for optimized performance
- **Mobile App**: Future React Native implementation

### API Gateway
- **Express API Gateway**: Central entry point for routing all client requests
- **Authentication/Authorization**: JWT validation and role-based access control

### Microservices

1. **App UI Service**
   - Manages UI components and presentation logic
   - Handles theme customization and user preferences
   - Provides responsive interface elements

2. **Profile System**
   - User authentication with email and OAuth providers
   - Developer profiles with skills, portfolio, and availability
   - Student profiles with academic information and project needs

3. **Project Management**
   - Project creation and requirements specification
   - Collaboration tools and document sharing
   - Progress tracking and milestone management

4. **Chat System**
   - Real-time messaging between students and developers
   - Group discussions and thread management
   - Video conferencing integration via ZegoCloud

5. **Order Tracking**
   - Order creation and lifecycle management
   - Status updates and notifications
   - Delivery and acceptance workflow

6. **Payment Processing**
   - Secure payment handling via Stripe
   - Subscription management for premium features
   - Transaction history and invoicing

### Message Broker
- **Pusher**: Real-time event distribution between services
- Event-driven architecture for responsive updates
- Ensures scalability for high-traffic scenarios

### Data Storage
- **MongoDB**: NoSQL database for flexible schema development
- Separate database instances for each microservice
- Mongoose ODM for data validation and modeling

### External Services Integration
- **Stripe**: Payment processing
- **ZegoCloud**: Video and audio communication
- **OAuth Providers**: Google, GitHub, LinkedIn authentication

This architecture provides:
- **Scalability**: Independent scaling of services based on demand
- **Maintainability**: Services can be developed and deployed independently
- **Resilience**: Failure in one service doesn't bring down the entire system
- **Technology Flexibility**: Different services can use specialized tools 