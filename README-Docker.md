# Docker Setup Guide - PPM Project

## Przegląd

Ten projekt używa Docker i Docker Compose do uruchomienia kompletnego środowiska deweloperskiego z następującymi serwisami:

- **PostgreSQL** - Główna baza danych
- **MySQL** - Baza danych kompatybilności z PrestaShop
- **Redis** - Cache i sesje
- **Backend** - Node.js/Express API
- **Frontend** - React/Vite aplikacja
- **Nginx** - Reverse proxy i load balancer
- **phpMyAdmin** - Zarządzanie MySQL
- **pgAdmin** - Zarządzanie PostgreSQL

## Wymagania

- Docker Desktop lub Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM
- Minimum 10GB miejsca na dysku

## Instalacja i pierwszе uruchomienie

### 1. Klonowanie i przygotowanie

```bash
cd "D:\OneDrive - MPP TRADE\Skrypty\PPM"

# Skopiuj plik konfiguracyjny środowiska
copy .env.example .env

# Edytuj .env z własnymi wartościami OAuth
notepad .env
```

### 2. Budowanie i uruchomienie

```bash
# Uruchom wszystkie serwisy w tle
docker-compose up -d

# Lub uruchom z logami w trybie interaktywnym
docker-compose up
```

### 3. Sprawdzenie statusu

```bash
# Sprawdź status wszystkich kontenerów
docker-compose ps

# Sprawdź logi konkretnego serwisu
docker-compose logs backend
docker-compose logs frontend
```

## Dostęp do aplikacji

| Serwis | URL | Opis |
|--------|-----|------|
| **Frontend** | http://localhost:5173 | Aplikacja React |
| **Backend API** | http://localhost:3000 | REST API |
| **Nginx Proxy** | http://localhost:80 | Główny punkt dostępu |
| **phpMyAdmin** | http://localhost:8080 | Zarządzanie MySQL |
| **pgAdmin** | http://localhost:8081 | Zarządzanie PostgreSQL |
| **API Docs** | http://localhost:3000/api-docs | Dokumentacja API |

## Konfiguracja środowiska

### Domyślne dane dostępowe

#### PostgreSQL
- **Host**: localhost:5432
- **Database**: ppm_db
- **User**: ppm_user
- **Password**: ppm_password

#### MySQL
- **Host**: localhost:3306
- **Database**: ppm_prestashop
- **User**: ppm_mysql_user
- **Password**: ppm_mysql_password

#### Redis
- **Host**: localhost:6379
- **Password**: redis_password

#### pgAdmin
- **URL**: http://localhost:8081
- **Email**: admin@ppm.local
- **Password**: pgadmin_password

#### phpMyAdmin
- **URL**: http://localhost:8080
- **User**: ppm_mysql_user
- **Password**: ppm_mysql_password

### OAuth Configuration

Edytuj plik `.env` i ustaw:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=twoj-google-client-id
GOOGLE_CLIENT_SECRET=twoj-google-client-secret
GOOGLE_DOMAIN_RESTRICTION=twoja-domena.com

# Microsoft OAuth
MICROSOFT_CLIENT_ID=twoj-microsoft-client-id
MICROSOFT_CLIENT_SECRET=twoj-microsoft-client-secret
MICROSOFT_TENANT=twoj-tenant-id
```

## Przydatne komendy

### Zarządzanie kontenerami

```bash
# Uruchom konkretny serwis
docker-compose up backend

# Zatrzymaj wszystkie serwisy
docker-compose stop

# Zatrzymaj i usuń kontenery
docker-compose down

# Zatrzymaj, usuń kontenery i wolumeny
docker-compose down -v

# Restart konkretnego serwisu
docker-compose restart backend
```

### Praca z bazą danych

```bash
# Połącz się z PostgreSQL
docker-compose exec postgres psql -U ppm_user -d ppm_db

# Połącz się z MySQL
docker-compose exec mysql mysql -u ppm_mysql_user -p ppm_prestashop

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U ppm_user ppm_db > backup.sql

# Restore PostgreSQL
docker-compose exec -T postgres psql -U ppm_user ppm_db < backup.sql
```

### Debugging i logi

```bash
# Zobacz logi wszystkich serwisów
docker-compose logs -f

# Zobacz logi konkretnego serwisu
docker-compose logs -f backend

# Wejdź do kontenera backend
docker-compose exec backend bash

# Wejdź do kontenera frontend
docker-compose exec frontend sh
```

### Development hot reload

```bash
# Backend - nodemon z hot reload
docker-compose exec backend npm run dev

# Frontend - Vite z HMR
docker-compose exec frontend npm run dev
```

## Profile i środowiska

### Development Profile (domyślny)

```bash
# Uruchom z narzędziami deweloperskimi
docker-compose --profile dev up -d

# To uruchomi także phpMyAdmin i pgAdmin
```

### Production Profile

```bash
# Skopiuj konfigurację produkcyjną
copy docker-compose.prod.yml docker-compose.override.yml

# Uruchom w trybie produkcyjnym
docker-compose up -d
```

## Rozwiązywanie problemów

### Problem: Porty już używane

```bash
# Sprawdź które porty są zajęte
netstat -an | findstr :5432
netstat -an | findstr :3306
netstat -an | findstr :6379

# Zmień porty w docker-compose.yml lub zatrzymaj usługi
```

### Problem: Kontenery nie startują

```bash
# Sprawdź logi
docker-compose logs

# Sprawdź status kontenerów
docker-compose ps

# Zrestartuj wszystko
docker-compose down && docker-compose up -d
```

### Problem: Brak połączenia z bazą

```bash
# Sprawdź czy baza jest gotowa
docker-compose exec postgres pg_isready -U ppm_user

# Sprawdź czy MySQL działa
docker-compose exec mysql mysqladmin ping -h localhost
```

### Problem: Frontend nie ładuje się

```bash
# Sprawdź logi frontend
docker-compose logs frontend

# Sprawdź czy Vite dev server działa
curl http://localhost:5173

# Zrestartuj frontend
docker-compose restart frontend
```

### Problem: API nie odpowiada

```bash
# Sprawdź health check
curl http://localhost:3000/health

# Sprawdź logi backend
docker-compose logs backend

# Sprawdź czy wszystkie zmienne środowiskowe są ustawione
docker-compose exec backend env | grep DB_
```

## Optymalizacja wydajności

### Pamięć i CPU

```bash
# Ogranicz zasoby w docker-compose.yml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Wolumeny i cache

```bash
# Wyczyść niepotrzebne dane
docker system prune -af

# Wyczyść wolumeny
docker volume prune

# Sprawdź używane miejsce
docker system df
```

## Backup i przywracanie

### Automatyczny backup

```bash
# Utwórz skrypt backup
./scripts/backup.sh

# Dodaj do cron (Linux) lub Task Scheduler (Windows)
```

### Backup manualny

```bash
# Backup całego środowiska
docker-compose exec postgres pg_dumpall -U ppm_user > full_backup.sql
docker-compose exec mysql mysqldump -u root -p --all-databases > mysql_backup.sql

# Backup wolumenów
docker run --rm -v ppm-postgres-data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
```

## Monitoring i health checks

```bash
# Sprawdź health wszystkich serwisów
docker-compose ps

# Endpoint health check
curl http://localhost:3000/health

# Monitoring zasobów
docker stats
```

---

## Następne kroki

Po uruchomieniu Docker environment:

1. **Sprawdź czy wszystkie serwisy działają** - `docker-compose ps`
2. **Przetestuj API** - http://localhost:3000/health
3. **Otwórz frontend** - http://localhost:5173
4. **Skonfiguruj OAuth** - edytuj `.env`
5. **Rozpocznij development** - backend i frontend z hot reload

Więcej informacji w dokumentacji projektu: `Plan_Projektu.md` i `CLAUDE.md`