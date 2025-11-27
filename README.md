# Classroom Management System — Backend

## Description
The **Classroom Management System** backend provides a complete REST API to manage classrooms, users (teachers, administrators), and bookings/schedules.  
It handles business logic, data persistence with MongoDB, authentication, and especially the secure generation and validation of temporary 6-digit access codes used to physically unlock classrooms via IoT devices or the web frontend.

## Main Features
- User management (registration, login, roles: admin/teacher)
- Full CRUD operations for classrooms and schedules/bookings
- Secure generation and validation of 6-digit access codes (valid for 5 minutes)
- Detailed access attempt logging (AccessLog)
- Protection of sensitive routes with JWT authentication

## Technologies & Dependencies
- **Node.js** (v22.x recommended)
- **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** (authentication)
- **crypto** (secure random code generation)
- **dotenv** (environment variables)
- **zod** or **Joi** (input validation)
- **cors**, **helmet**, **morgan** (security & logging)

## Code Generation & Access Workflow

### 1. Access Code Generation (by the teacher)
When a teacher clicks **"Generate Code"** in the interface:

**Request** → `POST /api/access-logs/generate-code`

**Backend behavior:**
- Generates a secure 6-digit code using `crypto.randomInt(0, 999999)`
- Stores the code temporarily in memory (Map) for 5 minutes:
  ```js
  temporaryCodes.set(scheduleId, { 
    code, 
    profId, 
    roomId, 
    expiresAt: Date.now() + 5 * 60 * 1000 
  })

### stpes  
```bash
git clone https://github.com/khadijazar/Gestion-des-salles.git
cd Gestion-des-salles
git checkout backend
npm install            # installs dependencies
# Configure the environment variables (MongoDB URI, port, etc.)
npm start              # the command to start the server
**
```
