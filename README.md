# Banking System — Deposit & Withdrawal Platform

Full-stack banking application for processing deposits and withdrawals, viewing transaction history, and managing transactions (edit / cancel). Built as a home assignment demonstrating clean architecture, production-grade patterns, and comprehensive testing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Redux Toolkit, Axios, Vite |
| **Backend** | ASP.NET Core 8 Web API, Entity Framework Core 8 |
| **Database** | SQL Server |
| **Testing** | xUnit + Moq + SQLite (backend), Vitest (frontend) |

## Project Structure

```
BankingSystem/
├── Backend/
│   ├── BankingSystem.Api/
│   │   ├── Controllers/        # Thin API controllers
│   │   ├── DTOs/               # Request/response data transfer objects
│   │   ├── Enums/              # TransactionType, TransactionStatus
│   │   ├── Models/             # EF Core domain entities (User, Transaction)
│   │   ├── Data/               # AppDbContext + Fluent API configuration
│   │   ├── Services/           # Business logic (TransactionService)
│   │   │   └── Interfaces/     # Service contracts
│   │   ├── Middleware/         # Request logging, exception handling
│   │   └── Migrations/        # EF Core migrations
│   └── BankingSystem.Tests/   # Unit tests (xUnit + SQLite in-memory)
│
└── Frontend/
    └── banking-frontend/
        └── src/
            ├── api/                # Axios instance + API service functions
            ├── app/                # Redux store + typed hooks
            ├── components/         # Shared components (NumericInput, Toast)
            └── features/
                └── transactions/
                    ├── TransactionForm/     # Deposit/withdrawal form
                    ├── TransactionHistory/  # Transaction table with edit/cancel
                    ├── hooks/               # useTransactionForm custom hook
                    └── __tests__/           # Redux slice tests
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/en-us/sql-server) (local or Docker)

## Getting Started

### 1. Database Setup

Update the connection string in `Backend/BankingSystem.Api/appsettings.json` to match your SQL Server instance, then apply migrations:

```bash
cd Backend/BankingSystem.Api
dotnet ef database update
```

### 2. Backend

```bash
cd Backend/BankingSystem.Api
dotnet run
```

The API starts at `http://localhost:5288`. Swagger UI is available at `/swagger` in development mode.

### 3. Frontend

```bash
cd Frontend/banking-frontend
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/transactions` | Create a new deposit or withdrawal |
| `GET` | `/api/transactions/{userId}` | Get transaction history by personal ID |
| `PUT` | `/api/transactions/{transactionId}` | Update amount and bank account |
| `DELETE` | `/api/transactions/{transactionId}` | Cancel a transaction (soft delete) |

### Request/Response Examples

**Create Transaction**
```json
POST /api/transactions
{
  "personalUserIdNumber": "123456789",
  "fullNameHebrew": "ישראל ישראלי",
  "fullNameEnglish": "Israel Israeli",
  "birthDate": "1990-01-15",
  "bankAccount": "1234567890",
  "amount": 5000,
  "type": "Deposit"
}
```

**Update Transaction**
```json
PUT /api/transactions/{guid}
{
  "amount": 7500,
  "bankAccount": "9876543210"
}
```

## Running Tests

### Backend (12 tests)

```bash
cd Backend/BankingSystem.Tests
dotnet test
```

Tests use **SQLite in-memory** to enforce real relational constraints (foreign keys, unique indexes) while staying fast and dependency-free.

Covers:
- Transaction creation (new user, existing user, deposit, withdrawal)
- External provider failure handling (token failure, exception resilience)
- Transaction retrieval, update, and cancellation
- Edge cases (non-existent IDs, duplicate users)

### Frontend (11 tests)

```bash
cd Frontend/banking-frontend
npm test
```

Covers:
- Redux slice reducers (`clearError`, `resetHistory`)
- All async thunks (pending, fulfilled, rejected states)
- State transitions for create, update, cancel, and fetch operations

## Architecture Decisions

- **Thin controllers** — Controllers only delegate to `ITransactionService`; all business logic lives in the service layer.
- **External provider abstraction** — `IExternalBankingService` is injected via `HttpClientFactory`, making it testable and replaceable.
- **Resilient external calls** — `SafeCreateTokenAsync` and `SafeExecuteTransactionAsync` wrap external provider calls with try/catch to prevent unhandled failures.
- **Separated error ownership** — Form submission errors are managed locally in `useTransactionForm` (not in Redux), preventing form errors from leaking into the history section.
- **Row-level error tracking** — Transaction history tracks errors per row (`RowError` model) so both edit failures and cancel failures display inline.
- **Model validation** — Backend uses Data Annotations with `IValidatableObject` for cross-field validation (birth date range). Frontend mirrors all validations client-side.
- **Request logging middleware** — Logs every request/response with trace ID, method, path, body, status code, and elapsed time.
- **Exception handling middleware** — Catches unhandled exceptions and returns a standardized JSON error response.
