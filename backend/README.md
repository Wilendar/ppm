# PPM Backend API

Backend API dla systemu Prestashop Product Manager (PPM) - kompleksowe rozwiązanie do zarządzania produktami na wielu sklepach PrestaShop jednocześnie.

## 🚀 Funkcjonalności

- **Uwierzytelnianie OAuth**: Google Workspace & Microsoft Azure AD
- **Zarządzanie produktami**: Centralny katalog z eksportem na wiele sklepów
- **Integracje ERP**: Subiekt GT, Microsoft Dynamics 365
- **API RESTful**: Pełna dokumentacja OpenAPI/Swagger
- **Cache Redis**: Optymalizacja wydajności
- **Monitoring**: Structured logging z Winston
- **Bezpieczeństwo**: JWT tokens, RBAC, rate limiting

## 🛠️ Stack Technologiczny

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.18+ z TypeScript 5.0+
- **Baza danych**: PostgreSQL 14+ (główna), MySQL 8.0+ (PrestaShop)
- **Cache**: Redis 7.0+
- **ORM**: Prisma / Knex.js
- **Testy**: Jest + Supertest
- **Dokumentacja**: Swagger/OpenAPI 3.0

## 📋 Wymagania systemowe

- Node.js 20.0.0 lub nowszy
- npm 10.0.0 lub nowszy
- PostgreSQL 14+ (główna baza danych)
- Redis 7.0+ (cache i sesje)
- MySQL 8.0+ (opcjonalnie dla PrestaShop)

## 🚀 Szybki start

### 1. Instalacja zależności

\`\`\`bash
npm install
\`\`\`

### 2. Konfiguracja środowiska

\`\`\`bash
cp .env.example .env
\`\`\`

Edytuj plik \`.env\` zgodnie z Twoją konfiguracją:

\`\`\`env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ppm_db
REDIS_URL=redis://localhost:6379

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# JWT Secrets
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
\`\`\`

### 3. Uruchomienie w trybie development

\`\`\`bash
npm run dev
\`\`\`

API będzie dostępne pod adresem: \`http://localhost:3001\`

## 📚 Skrypty NPM

| Skrypt | Opis |
|--------|------|
| \`npm run dev\` | Uruchamia serwer w trybie development z hot-reload |
| \`npm run build\` | Kompiluje TypeScript do JavaScript |
| \`npm start\` | Uruchamia skompilowaną aplikację |
| \`npm test\` | Uruchamia testy jednostkowe i integracyjne |
| \`npm run test:watch\` | Uruchamia testy w trybie watch |
| \`npm run test:coverage\` | Generuje raport pokrycia testów |
| \`npm run lint\` | Sprawdza kod ESLint |
| \`npm run lint:fix\` | Naprawia problemy ESLint automatycznie |
| \`npm run type-check\` | Sprawdza typy TypeScript |

## 🗄️ Struktura bazy danych

### Tabele główne:
- \`users\` - Użytkownicy systemu
- \`shops\` - Konfiguracje sklepów PrestaShop  
- \`products\` - Centralny katalog produktów
- \`product_shop_data\` - Dane produktów per sklep
- \`categories\` - Kategorie per sklep
- \`images\` - Zarządzanie zdjęciami
- \`sync_history\` - Historia synchronizacji

### Migracje bazy danych:

\`\`\`bash
# Prisma migrations
npm run prisma:migrate

# Lub Knex migrations
npm run db:migrate
\`\`\`

## 🔌 Endpointy API

### Uwierzytelnianie
- \`POST /api/v1/auth/login\` - Logowanie OAuth
- \`POST /api/v1/auth/refresh\` - Odświeżanie tokenów
- \`POST /api/v1/auth/logout\` - Wylogowanie
- \`GET /api/v1/auth/me\` - Informacje o użytkowniku

### Produkty
- \`GET /api/v1/products\` - Lista produktów (z filtrami)
- \`POST /api/v1/products\` - Tworzenie produktu
- \`GET /api/v1/products/:id\` - Szczegóły produktu
- \`PUT /api/v1/products/:id\` - Aktualizacja produktu
- \`DELETE /api/v1/products/:id\` - Usuwanie produktu
- \`POST /api/v1/products/bulk\` - Operacje masowe

### Sklepy
- \`GET /api/v1/shops\` - Lista sklepów
- \`POST /api/v1/shops\` - Dodawanie sklepu
- \`PUT /api/v1/shops/:id\` - Aktualizacja sklepu
- \`POST /api/v1/shops/:id/test\` - Test połączenia

### Synchronizacja
- \`POST /api/v1/sync/products/:id\` - Synchronizacja produktu
- \`POST /api/v1/sync/shops/:id\` - Synchronizacja całego sklepu
- \`GET /api/v1/sync/history\` - Historia synchronizacji

### Health Check
- \`GET /health\` - Status aplikacji i połączeń z bazami danych

## 🔒 Autoryzacja i Uprawnienia

System implementuje Role-Based Access Control (RBAC) z trzema poziomami:

### Role użytkowników:

| Rola | Uprawnienia |
|------|-------------|
| **Admin** | Pełny dostęp - zarządzanie użytkownikami, sklepami, produktami, integracjami |
| **Manager** | CRUD produktów, eksport/import, synchronizacja, odczyt sklepów |
| **User** | Tylko odczyt produktów i sklepów (po zapytaniu) |

### Middleware autoryzacji:
\`\`\`typescript
// Wymagana rola
app.get('/admin-only', authenticateToken, requireRole(['admin']), handler);

// Wymagane uprawnienie
app.post('/products', authenticateToken, requirePermission('products:create'), handler);
\`\`\`

## 🐳 Docker

### Budowanie obrazu:
\`\`\`bash
docker build -t ppm-backend .
\`\`\`

### Uruchomienie kontenera:
\`\`\`bash
docker run -p 3001:3001 --env-file .env ppm-backend
\`\`\`

### Docker Compose (wraz z bazami danych):
\`\`\`bash
docker-compose up -d
\`\`\`

## 🧪 Testowanie

### Uruchomienie testów:
\`\`\`bash
# Wszystkie testy
npm test

# Testy w trybie watch
npm run test:watch

# Pokrycie kodu
npm run test:coverage
\`\`\`

### Typy testów:
- **Unit tests**: \`tests/unit/\` - Testy jednostkowe middleware, serwisów
- **Integration tests**: \`tests/integration/\` - Testy API endpoints
- **Fixtures**: \`tests/fixtures/\` - Dane testowe

## 📊 Monitoring i Logi

### Structured Logging:
- **Produkcja**: Logi JSON do plików (\`logs/\`)
- **Development**: Kolorowe logi w konsoli
- **Poziomy**: error, warn, info, http, debug

### Przykład logowania:
\`\`\`typescript
import { logger } from '@/utils/logger.util';

logger.info('Product created', {
  requestId: req.requestId,
  userId: req.user.id,
  productId: product.id,
  operation: 'CREATE_PRODUCT'
});
\`\`\`

### Health Checks:
- \`GET /health\` - Status aplikacji
- Sprawdzanie połączeń: PostgreSQL, Redis, MySQL
- Metryki: pamięć, CPU, uptime

## 🔧 Integracje

### PrestaShop API:
- Obsługa wersji 8 i 9
- Rate limiting i retry logic
- Bulk operations
- Webhook support

### ERP Systems:
- **Subiekt GT**: Bezpośrednie połączenie z bazą MS SQL
- **Microsoft Dynamics 365**: REST API z OAuth

### OAuth Providers:
- **Google Workspace**: Ograniczenia domenowe
- **Microsoft Azure AD**: Multi-tenant support

## 🛡️ Bezpieczeństwo

### Implementowane zabezpieczenia:
- **Helmet.js**: Security headers
- **CORS**: Konfigurowane origins
- **Rate Limiting**: IP-based throttling  
- **JWT Tokens**: Access/Refresh token pattern
- **Input Validation**: express-validator + Joi
- **SQL Injection**: Parametryzowane zapytania
- **XSS Protection**: Sanityzacja HTML

### Szyfrowanie:
- Klucze API sklepów (AES-256-GCM)
- Hasła użytkowników (bcrypt)
- JWT secrets w zmiennych środowiskowych

## 📈 Wydajność

### Optymalizacje:
- **Connection Pooling**: PostgreSQL, MySQL, Redis
- **Caching**: Multi-level (memory, Redis)
- **Compression**: Gzip dla responses
- **Pagination**: Wszystkie listy
- **Indexing**: Strategiczne indeksy bazodanowe

### Monitoring wydajności:
- Request/response timing
- Database query performance
- Memory usage tracking
- API response times

## 🚀 Deployment

### Środowiska:
- **Development**: Local z hot-reload
- **Staging**: Docker containers
- **Production**: Kubernetes/Docker Swarm

### Zmienne środowiskowe:
Wszystkie konfiguracje przez environment variables - sprawdź \`.env.example\`

### Process Manager:
\`\`\`bash
# PM2 dla produkcji
pm2 start ecosystem.config.js
\`\`\`

## 🤝 Contributing

### Standardy kodu:
- **ESLint + Prettier**: Automatyczne formatowanie
- **TypeScript**: Strict mode enabled
- **Tests**: Wymagane dla nowych funkcji
- **Documentation**: JSDoc dla public APIs

### Git Workflow:
1. Feature branch z \`main\`
2. Pull Request z review
3. CI/CD pipeline (testy, build, deploy)
4. Merge po akceptacji

## 📞 Wsparcie

W przypadku problemów:
1. Sprawdź logi: \`logs/combined.log\`
2. Health check: \`GET /health\`
3. Database connectivity: Connection pools
4. Kontakt: Backend Team

---

**PPM Backend** - Solidny fundament dla zarządzania produktami PrestaShop! 🚀