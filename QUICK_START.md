# Quick Reference Guide

## Starting the Application

### Backend (Spring Boot)
```powershell
cd C:\Users\HP\local-farmer-marketplace\backend\backend
java -jar target/backend-0.0.1-SNAPSHOT.jar
```
**URL:** http://localhost:8080
**Database:** farmer_marketplace (MySQL)

### Frontend (Vite)
```powershell
cd C:\Users\HP\local-farmer-marketplace\frontend
npm run dev
```
**URL:** http://localhost:5173

### Start Both Servers (recommended)
- Open Terminal 1:
  ```powershell
  cd C:\Users\HP\local-farmer-marketplace\backend\backend
  java -jar target/backend-0.0.1-SNAPSHOT.jar
  ```

- Open Terminal 2:
  ```powershell
  cd C:\Users\HP\local-farmer-marketplace\frontend
  npm run dev
  ```

## Building Backend

### Full Build
```powershell
cd C:\Users\HP\local-farmer-marketplace\backend\backend
mvn clean install -DskipTests
```

### Quick Compile
```powershell
mvn clean compile -DskipTests
```

### Package Only
```powershell
mvn package -DskipTests
```

## Testing API Endpoints

### Register a User (PowerShell)
```powershell
$body = @{
    name = "John Farmer"
    phone = "9876543210"
    password = "password123"
    role = "FARMER"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$response | ConvertTo-Json
```

### Login (PowerShell)
```powershell
$body = @{
    phone = "9876543210"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$response | ConvertTo-Json
```

## Important Files

### Backend
- Controller: `backend/backend/src/main/java/com/farmermarketplace/backend/controller/AuthController.java`
- Entity: `backend/backend/src/main/java/com/farmermarketplace/backend/entity/User.java`
- Repository: `backend/backend/src/main/java/com/farmermarketplace/backend/repository/UserRepository.java`
- Config: `backend/backend/src/main/java/com/farmermarketplace/backend/config/SecurityConfig.java`
- Properties: `backend/backend/src/main/resources/application.properties`

### Frontend
- Register: `frontend/src/components/auth/Register.jsx`
- Login: `frontend/src/pages/LoginPage.jsx`
- API Service: `frontend/src/components/services/api.js`

## Current Status

| Component | Status | Port |
|-----------|--------|------|
| Backend API | ✅ Running | 8080 |
| Frontend | ✅ Running | 5173 |
| MySQL DB | ✅ Connected | 3306 |
| Registration | ✅ Working | - |
| Login | ✅ Working | - |

## Key Configurations

### Database (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/farmer_marketplace
spring.datasource.username=root
spring.datasource.password=root
```

### CORS (AuthController)
```java
@CrossOrigin(origins = "http://localhost:5173")
```

### API Base URL (Frontend)
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

## Troubleshooting

### Backend won't start
1. Check if MySQL is running
2. Verify database exists: `farmer_marketplace`
3. Check port 8080 is not in use
4. Check Java version: `java -version` (should be 17+)

### Frontend build fails
1. Clear node_modules: `rm -r node_modules`
2. Reinstall: `npm install`
3. Clear npm cache: `npm cache clean --force`

### API calls failing (403 error)
- Make sure registration endpoint is included in SecurityConfig permitAll()
- Check CORS configuration matches frontend URL

### Password issues
- Passwords are encrypted with BCrypt
- Never stored or returned in plain text
- Minimum 6 characters required

## API Endpoints Summary

```
POST /api/auth/register
  - Public endpoint
  - Body: { name, phone, password, role }
  - Response: { id, name, phone, role }
  - Status: 201 CREATED

POST /api/auth/login
  - Public endpoint
  - Body: { phone, password }
  - Response: { id, name, phone, role }
  - Status: 200 OK

GET /api/products/all
  - Returns list of **all active products from every farmer**
  - Required for buyer marketplace; frontend calls this under "Browse Products"
  - Important: the path includes `/api` and `/all`; `/products` alone will 404
  - Status: 200 OK
```

## Next Development Steps

1. Create product management endpoints
2. Implement order system
3. Add JWT token authentication
4. Create dashboard components
5. Add product listing
6. Implement search/filter
7. Add payment integration

---

**Note:** Both servers need to be running simultaneously for the application to work properly.
