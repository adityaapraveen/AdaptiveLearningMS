# Adaptive Learning Management System

The Adaptive Learning Management System is a comprehensive educational platform that connects teachers and students through a secure and efficient interface. Built using a microservices architecture, it provides a scalable and maintainable solution for educational institutions.

## Core Features

- **Teacher-Student Mapping**: Unique 6-digit codes for teachers, allowing students to join classes
- **Multi-role System**: Admin, Teacher, and Student roles with role-specific features
- **Content Management**: Create and manage educational content with automatic filtering
- **Quiz System**: Create and manage quizzes with real-time feedback and results tracking

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Flask
- **Database**: MongoDB, Redis
- **Containerization**: Docker, Docker Compose
- **Authentication**: JWT

## Services

- **API Gateway** (Port 8000): Single entry point, handles authentication and routing
- **User Service** (Port 5000): User management and teacher-student mapping
- **Content Service** (Port 5001): Educational content management
- **Quiz Service** (Port 5004): Quiz management and submissions
- **MongoDB**: Primary database for storing user data, content, and relationships
- **Redis**: Caching and message broker for improved performance

## Requirements

- Python 3.9 or higher
- Node.js and npm (for React and Vite)
- MongoDB
- Redis
- Docker and Docker Compose
- Flask

## Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/adityaapraveen/AdaptiveLearningMS
    cd AdaptiveLearningMS
    ```

2. Create and activate a virtual environment:

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3. Install backend dependencies:

    ```bash
    cd backend
    pip install -r requirements.txt
    ```

### MongoDB Setup

1. Ensure MongoDB is running locally or use the Docker Compose configuration:
    ```bash
    docker compose up mongodb
    ```

### Redis Setup

1. Ensure Redis is running locally or use the Docker Compose configuration:
    ```bash
    docker compose up redis
    ```

### Backend Setup (Flask Microservices)

1. Start all backend services using Docker Compose:

    ```bash
    cd backend
    docker compose up
    ```

   The services will be running on:
   - API Gateway: `http://localhost:8000`
   - User Service: `http://localhost:5000`
   - Content Service: `http://localhost:5001`
   - Quiz Service: `http://localhost:5004`

### Frontend Setup (React + Vite)

1. Install frontend dependencies:

    ```bash
    cd frontend
    npm install
    ```

2. Run the frontend development server:

    ```bash
    npm run dev
    ```

   The frontend will be available at `http://localhost:5173`.

## Contributing

If you'd like to contribute to the development of the Adaptive Learning Management System, feel free to fork the repository and submit a pull request with your changes. Please ensure that your code follows the project's coding standards and is well-documented.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 