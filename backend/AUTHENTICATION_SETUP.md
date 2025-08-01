# Authentication System Setup Guide

## Przegląd systemu uwierzytelniania

System uwierzytelniania PPM Backend implementuje:

- ✅ **OAuth 2.0**: Google Workspace + Microsoft Office 365
- ✅ **JWT Tokens**: Access tokens (15min) + Refresh tokens (7 dni)
- ✅ **Role-Based Access Control**: Admin/Manager/User
- ✅ **Security Features**: Rate limiting, CSRF protection, secure cookies
- ✅ **Session Management**: Multi-device support z Redis cache
- ✅ **Domain/Tenant Restrictions**: Kontrola dostępu per domena/tenant

## Struktura plików

```
backend/src/
├── config/
│   └── oauth.config.ts          # Konfiguracja OAuth providers
├── services/
│   ├── auth/
│   │   ├── oauth.service.ts     # OAuth service (Google + Microsoft)
│   │   └── jwt.service.ts       # JWT token management
│   ├── cache/
│   │   └── redis.service.ts     # Redis cache service
│   └── user/
│       └── user.service.ts      # User management service
├── middleware/
│   ├── auth.middleware.ts       # Authentication middleware
│   └── security.middleware.ts   # Security middleware
├── controllers/
│   └── auth.controller.ts       # Authentication controller
├── routes/api/v1/
│   └── auth.routes.ts           # Authentication routes
├── models/
│   └── user.model.ts            # User model types
└── prisma/
    └── schema.prisma            # Prisma database schema
```

## Konfiguracja OAuth

### 1. Google Workspace OAuth

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz Google+ API lub Google Identity API
4. Utwórz OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/v1/auth/google/callback`
5. Skopiuj Client ID i Client Secret do `.env`

### 2. Microsoft Office 365 OAuth

1. Przejdź do [Azure AD Portal](https://portal.azure.com/)
2. Przejdź do Azure Active Directory > App registrations
3. Utwórz nową rejestrację aplikacji:
   - Name: PPM Backend
   - Supported account types: Accounts in this organizational directory only
   - Redirect URI: `http://localhost:3001/api/v1/auth/microsoft/callback`
4. Skopiuj Application (client) ID i Directory (tenant) ID
5. Utwórz client secret w Certificates & secrets
6. Dodaj API permissions: Microsoft Graph > User.Read

### 3. Konfiguracja zmiennych środowiskowych

Skopiuj `.env.example` do `.env` i uzupełnij:

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_ALLOWED_DOMAINS=yourcompany.com,anotherdomain.com

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_ALLOWED_TENANTS=tenant-id-1,tenant-id-2

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-super-secure-access-token-secret-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-token-secret-at-least-32-characters-long

# User Roles
ADMIN_EMAILS=admin@yourcompany.com,superadmin@yourcompany.com
MANAGER_EMAILS=manager@yourcompany.com
```

## Endpoints uwierzytelniania

### OAuth Endpoints

```http
GET  /api/v1/auth/urls           # Pobranie OAuth URLs
GET  /api/v1/auth/google         # Inicjacja Google OAuth
GET  /api/v1/auth/google/callback # Google OAuth callback
GET  /api/v1/auth/microsoft      # Inicjacja Microsoft OAuth
GET  /api/v1/auth/microsoft/callback # Microsoft OAuth callback
```

### Token Management

```http
POST /api/v1/auth/refresh        # Odświeżenie access token
POST /api/v1/auth/validate       # Walidacja token
GET  /api/v1/auth/csrf-token     # CSRF token dla formularzy
```

### User Management

```http
GET  /api/v1/auth/me            # Informacje o zalogowanym użytkowniku
POST /api/v1/auth/logout        # Wylogowanie z bieżącego urządzenia
POST /api/v1/auth/logout-all    # Wylogowanie ze wszystkich urządzeń
GET  /api/v1/auth/sessions      # Lista aktywnych sesji
```

## Przykład użycia

### Frontend - Inicjacja OAuth

```javascript
// Pobranie OAuth URLs
const response = await fetch('/api/v1/auth/urls');
const { data } = await response.json();

// Przekierowanie na Google OAuth
window.location.href = data.google;

// Lub Microsoft OAuth
window.location.href = data.microsoft;
```

### Frontend - Obsługa callback

```javascript
// Po powrocie z OAuth callback
const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get('status');

if (status === 'success') {
  // Użytkownik zalogowany - token w cookies
  const userResponse = await fetch('/api/v1/auth/me', {
    credentials: 'include'
  });
  const userData = await userResponse.json();
} else {
  // Błąd logowania
  const error = urlParams.get('message');
  console.error('Authentication failed:', error);
}
```

### API Requests z autoryzacją

```javascript
// Żądanie z automatycznym tokenem z cookies
const response = await fetch('/api/v1/products', {
  credentials: 'include',  // Ważne dla cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Lub z Bearer token
const response = await fetch('/api/v1/products', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Odświeżanie tokenów

```javascript
// Automatyczne odświeżanie przy 401
async function apiRequest(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    credentials: 'include'
  });
  
  if (response.status === 401) {
    // Spróbuj odświeżyć token
    const refreshResponse = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (refreshResponse.ok) {
      // Powtórz oryginalne żądanie
      response = await fetch(url, {
        ...options,
        credentials: 'include'
      });
    } else {
      // Przekieruj na logowanie
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

## Role i uprawnienia

### Poziomy dostępu

1. **Admin** - Pełny dostęp:
   - Zarządzanie użytkownikami
   - Zarządzanie sklepami
   - Zarządzanie integracjami ERP
   - Wszystkie operacje produktowe

2. **Manager** - Operacje biznesowe:
   - CRUD produktów
   - Export/Import
   - Zarządzanie kategoriami i zdjęciami
   - Operacje synchronizacji

3. **User** - Tylko odczyt:
   - Przeglądanie produktów
   - Wyszukiwanie
   - Odczyt raportów

### Sprawdzanie uprawnień w middleware

```typescript
import { requireRoles, requirePermissions } from './middleware/auth.middleware';

// Wymagaj określonej roli
router.get('/admin-only', requireRoles(['admin']), controller.adminAction);

// Wymagaj określonych uprawnień
router.post('/products', requirePermissions(['products:create']), controller.createProduct);

// Wymagaj Manager lub Admin
router.put('/products/:id', requireManagerOrAdmin, controller.updateProduct);
```

## Security Features

### Rate Limiting

- **Auth endpoints**: 5 prób / 15 minut
- **API endpoints**: 1000 żądań / 15 minut
- **Public endpoints**: 100 żądań / 15 minut

### CSRF Protection

```javascript
// Pobranie CSRF token
const csrfResponse = await fetch('/api/v1/auth/csrf-token');
const { data } = await csrfResponse.json();

// Użycie w formularzu
const formData = {
  ...data,
  _csrf: data.csrfToken
};
```

### Secure Cookies

- **HttpOnly**: Prevent XSS attacks
- **Secure**: HTTPS only in production
- **SameSite**: CSRF protection
- **Domain**: Configured per environment

## Testing

### Uruchomienie serwera

```bash
cd backend
npm install
npm run dev
```

### Test endpoints

```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api

# OAuth URLs
curl http://localhost:3001/api/v1/auth/urls

# Test authentication (po OAuth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/auth/me
```

## Rozwiązywanie problemów

### Błędy OAuth

1. **"Invalid redirect URI"**
   - Sprawdź czy callback URL w OAuth console jest identyczny z `.env`
   - Upewnij się że używasz http://localhost w dev (nie 127.0.0.1)

2. **"Domain not allowed"**
   - Sprawdź `GOOGLE_ALLOWED_DOMAINS` w `.env`
   - Upewnij się że domena w emailu jest na liście

3. **"CORS error"**
   - Sprawdź `CORS_ORIGINS` w `.env`
   - Upewnij się że frontend URL jest na liście

### Problemy z tokenami

1. **"Invalid token"**
   - Sprawdź czy JWT secrets są ustawione
   - Upewnij się że token nie wygasł

2. **"Session expired"**
   - Użytkownik wylogowany z innego urządzenia
   - Użyj refresh token endpoint

### Logi debug

```bash
# Włącz debug logs
DEBUG=ppm:* npm run dev

# Lub tylko auth logs
DEBUG=ppm:auth npm run dev
```

## Produkcja

### Checklist bezpieczeństwa

- [ ] Zmień wszystkie secrets na bezpieczne (32+ znaków)
- [ ] Ustaw `NODE_ENV=production`
- [ ] Skonfiguruj HTTPS
- [ ] Ustaw właściwe CORS origins
- [ ] Skonfiguruj secure cookies
- [ ] Włącz wszystkie security headers
- [ ] Skonfiguruj proper rate limiting
- [ ] Setup monitoring i alerting

### Environment variables

```bash
# Produkcja - przykład
NODE_ENV=production
HTTPS_ONLY=true
SECURE_COOKIES=true
HELMET_ENABLED=true
CORS_ENABLED=true
```

## Dalszy rozwój

### Planowane funkcjonalności

- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth dla więcej providerów (GitHub, LinkedIn)
- [ ] API Keys dla service-to-service auth
- [ ] Advanced session management
- [ ] Audit logging
- [ ] Password reset dla local accounts
- [ ] Email verification workflow

### Integracja z bazą danych

- [ ] Prisma migration setup
- [ ] User table creation
- [ ] Redis session store
- [ ] Database indexes optimization