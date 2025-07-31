# Plan Projektu – Prestashop Product Manager (PPM)

## 1. Wizja  
Celem PPM jest uproszczenie i przyspieszenie zarządzania ofertą na wielu sklepach Prestashop poprzez jedno, scentralizowane narzędzie dostępne z przeglądarki. System ma umożliwiać szybkie tworzenie, modyfikowanie i hurtowy eksport produktów oraz ich zasobów (zdjęcia, opisy, kategorie) z pełną kontrolą zgodności danych.

### 1.1 Cele biznesowe  
- Skrócenie czasu wprowadzania i aktualizacji produktów.  
- Eliminacja błędów dzięki walidacji i wizualnemu porównaniu danych.  
- Obsługa dużej bazy produktów (>100 k) przy zachowaniu responsywności interfejsu.  
- Ujednolicenie procesów pomiędzy sklepami bez utraty możliwości różnicowania treści.

### 1.2 Kluczowe wymagania (wyciąg z `init.md`)  
1. Webowa aplikacja SPA z OAuth (Google Workspace, Microsoft).  
2. Role użytkowników: **Admin**, **Menadżer**, **Użytkownik**.  
3. Walidacja produktów przed eksportem.  
4. Wysoka wydajność i skalowalność.  
5. Intuicyjny UI z motywem jasnym/ciemnym i nowoczesnymi animacjami.  
6. Hurtowy eksport produktów/zdjęć na wiele sklepów oraz wizualna kontrola rozbieżności.

## 2. Architektura wysokopoziomowa

```text
+-------------+        HTTPS REST/GraphQL        +----------------+
| Frontend SPA| <------------------------------> |  Backend API   |
| (React)     |                                  | (NestJS)       |
+------^------+                                  +----^-----------+
       | WebSockets (żywe powiadomienia)              |
       |                                              |
       |                  +---------------------------+--------------+
       |                  |  Kolejka zadań (Redis)   |  Worker Jobs |
       |                  +-----------^--------------+--------------+
       |                              |                             |
       |                              | gRPC                       |
       |                              v                             |
+------v------+               +-------+--------+            +-------+------+
|  Przegląd. |               |  PostgreSQL   |            |   Plikowy     |
|  Użytkownik|               |  + Timescale  |            |   Storage     |
+------------+               +--------------+             +--------------+
                                    |
                                    | Prestashop REST API
                                    v
                              +-----------+
                              |  Sklepy   |
                              | Prestashop|
                              +-----------+
```

### 2.1 Opis komponentów  
- **Frontend SPA** – React + Vite, biblioteka UI (MUI), React Query, i18n.  
- **Backend API** – NestJS (Node.js) z GraphQL oraz REST, moduł OAuth (Passport).  
- **Baza danych** – PostgreSQL (Timescale rozszerzenie do logów wydajnościowych).  
- **Kolejka & Worker Jobs** – Redis (BullMQ) do asynchronicznych eksportów i sync.  
- **Integracje** – konektory do Prestashop REST API oraz opcjonalnie ERP (Subiekt GT, Dynamics).  
- **Storage** – lokalny lub S3-zgodny na zdjęcia produktów.  

## 3. Moduły funkcjonalne  
| Moduł | Odpowiedzialność | Kluczowe funkcje |
|-------|------------------|------------------|
| Auth & RBAC | Logowanie OAuth, przypisanie ról | Google, Microsoft, panel admina |
| Katalog Produktów | CRUD produktów, wariantów, kategorii | Walidacja wymagana, WYSIWYG HTML |
| Media Manager | Masowy upload, konwersje, miniatury | Foldery, tagi, struktura zgodna z Prestashop |
| Mapowanie Sklepów | Przypisanie produktów/kategorii do sklepów | Sugestie kategorii |
| Eksport & Synchro | Kolejkowanie wysyłki, raport rozbieżności | Hurtowy eksport, diff wizualny |
| Integracje ERP | Import z ERP, mapowanie pól | Subiekt GT CSV/API, Dynamics |
| Monitoring & Audyt | Logi, metryki, powiadomienia | Prometheus + Grafana, web-hooks |

## 4. Proponowane technologie  
- **Frontend**: React 18, Vite, TypeScript, Tailwind/MUI, Zustand, React Query.  
- **Backend**: Node.js 20, NestJS, TypeScript, GraphQL + REST, BullMQ, Zod.  
- **DB**: PostgreSQL 15, TimescaleDB, Prisma ORM.  
- **Cache/Kolejka**: Redis 7.  
- **Auth**: Auth0 lub własny OIDC (Keycloak) z Passport strategies.  
- **CI/CD**: GitHub Actions, Docker, Kubernetes (opcjonalnie).  
- **Monitoring**: Prometheus, Grafana, Loki.  

## 5. Wymagania niefunkcjonalne  
- **Wydajność**:  UI < 100 ms interakcji, eksport 1000 prod/min.  
- **Skalowalność**:  horyzontalna dzięki Docker + K8s.  
- **Bezpieczeństwo**:  OAuth2, OIDC, szyfrowanie w spoczynku i tranzycie, OWASP Top 10.  
- **UX**:  motyw ciemny/jasny, klawiaturowe skróty, dostępność WCAG 2.1.  
- **Backup & DR**:  kopie migawkowe bazy, S3 Versioning.  
- **Testy**:  unit (Jest), e2e (Playwright), load (Artillery).

## 6. Struktura repozytorium

Projekt składa się z następujących katalogów:

- `backend/` – zawiera API oraz zadania w tle (worker jobs) aplikacji PPM.
- `frontend/` – zawiera aplikację SPA (Single Page Application) dla systemu PPM.
- `docs/` – zawiera dodatkową dokumentację projektu PPM, uzupełniającą informacje z katalogu `.kiro/`.
- `.gitignore` – plik zawierający listę ścieżek i plików ignorowanych przez system kontroli wersji Git.

## 7. Roadmapa (wysoki poziom)

| Milestone | Zakres | Numer zadań (tasks.md) | ETA |
|-----------|--------|------------------------|-----|
| **M0** – Kick-off | Specyfikacja, repo, CI | \<1.0> | T+1 tydz. ✅ |
| **M1** – MVP Auth & RBAC | OAuth, panel Admin | \<2.x> | T+4 tyg. |
| **M2** – Katalog & Media | CRUD produktów, upload zdjęć | \<3.x> | T+9 tyg. |
| **M3** – Eksport Prestashop | Kolejka, walidacja, diff UI | \<4.x> | T+14 tyg. |
| **M4** – Integracje ERP | Import CSV/API, mapowanie | \<5.x> | T+18 tyg. |
| **M5** – Hardening & Scale | Testy obciąż., monitoring | \<6.x> | T+22 tyg. |
| **M6** – GA Release | Dokumentacja, szkolenia | \<7.x> | T+26 tyg. |