# Prestashop Product Manager – Task Breakdown

> Numeracja zadań jest zgodna z roadmapą z `Plan_Projektu.md` oraz odwołuje się do identyfikatorów wymagań z `requirements.md` (np. \<F1.1>).  
> Każde zadanie powinno być realizowane jako oddzielny PR z testami i aktualizacją dokumentacji.

---

## <1.0> Kick-off & Fundamenty

| ID        | Opis zadania                                   | Powiązania | Priorytet |
|-----------|------------------------------------------------|------------|-----------|
| 1.0.1     | Utworzenie repozytorium Git + podstawowe README| —          | Wysoki    |
| 1.0.2     | Konfiguracja CI / CD (GitHub Actions)           | N1, N5     | Wysoki    |
| 1.0.3     | Konfiguracja ESLint, Prettier, Husky           | —          | Średni    |
| 1.0.4     | Przygotowanie szablonu Docker + docker-compose | N2         | Średni    |
| 1.0.5     | Integracja OpenTelemetry baseline              | N1         | Niski     |

---

## <2.0> Moduł Auth & RBAC (Milestone M1)

| ID        | Opis zadania                                    | Powiązania | Priorytet |
|-----------|-------------------------------------------------|------------|-----------|
| 2.1       | Implementacja loginu OAuth Google <F1.1>        | N3         | Wysoki    |
| 2.2       | Implementacja loginu OAuth Microsoft <F1.1>     | N3         | Wysoki    |
| 2.3       | Generator i walidacja JWT + refresh <F1.2>      | N1, N3     | Wysoki    |
| 2.4       | Tabela ról i uprawnień RBAC <4.0>               | N3         | Wysoki    |
| 2.5       | Middleware backend + Guardy frontend            | N3         | Średni    |
| 2.6       | Testy e2e Auth (Playwright)                     | N1         | Średni    |

---

## <3.0> Katalog produktów & Media (Milestone M2)

| ID        | Opis zadania                                          | Powiązania            | Priorytet |
|-----------|-------------------------------------------------------|-----------------------|-----------|
| 3.1       | Model Prisma: Product, Category, Media <D4.0>         | F3.1, F4.1            | Wysoki    |
| 3.2       | CRUD API (GraphQL) dla produktów <F3.1>               | N1                    | Wysoki    |
| 3.3       | Walidacja danych (Zod) <F3.2>                         | F3.2                  | Wysoki    |
| 3.4       | Edytor HTML WYSIWYG w React <F3.3>                    | N4                    | Średni    |
| 3.5       | Upload wielu zdjęć (+Sharp) <F4.1><F4.2>              | N1                    | Wysoki    |
| 3.6       | Powiązanie Media ↔ Product <F4.3>                     | N1                    | Średni    |
| 3.7       | Historia zmian produktów (audit) <F3.4>               | N5                    | Niski     |

---

## <4.0> Eksport & Synchronizacja (Milestone M3)

| ID        | Opis zadania                                                 | Powiązania       | Priorytet |
|-----------|--------------------------------------------------------------|------------------|-----------|
| 4.1       | Integracja z Prestashop REST: auth test <F2.1>               | N3               | Wysoki    |
| 4.2       | Kolejka BullMQ „export:product” <F6.1>                       | N2               | Wysoki    |
| 4.3       | Worker: wysyłka produktu + zdjęć <F6.2>                      | N1               | Wysoki    |
| 4.4       | Algorytm diff danych vs sklep <F6.3>                         | N1, N4           | Średni    |
| 4.5       | WebSocket progres eksportu <F6.1>                            | N1               | Średni    |
| 4.6       | Zapisywanie statusu ProductShop <F6.4>                       | N1               | Średni    |

---

## <5.0> Integracje ERP (Milestone M4)

| ID        | Opis zadania                                   | Powiązania | Priorytet |
|-----------|------------------------------------------------|------------|-----------|
| 5.1       | Import CSV streaming >1 M wierszy <F5.1>       | N1         | Wysoki    |
| 5.2       | Mapowanie pól + opcjonalne kolumny <F5.2>      | N1         | Średni    |
| 5.3       | Plugin Subiekt GT REST <F5.3>                   | N2         | Średni    |
| 5.4       | Plugin Dynamics REST <F5.3>                     | N2         | Średni    |

---

## <6.0> Hardening & Monitoring (Milestone M5)

| ID        | Opis zadania                              | Powiązania | Priorytet |
|-----------|-------------------------------------------|------------|-----------|
| 6.1       | Load-tests Artillery (export 1000 prod/min) N1 | Wysoki    |
| 6.2       | Prometheus metrics + Grafana dashboard <F8.1> | N5         | Średni    |
| 6.3       | Powiadomienia Webhook/email <F8.2>        | N5         | Średni    |
| 6.4       | Backup strategia S3 <N7>                  | N7         | Średni    |

---

## <7.0> GA Release (Milestone M6)

| ID        | Opis zadania                             | Powiązania | Priorytet |
|-----------|------------------------------------------|------------|-----------|
| 7.1       | Dokumentacja użytkownika + FAQ           | —          | Wysoki    |
| 7.2       | Szkolenie Admin/Manager (video)          | —          | Średni    |
| 7.3       | Publikacja changelog v1.0                | —          | Średni    |

---

##  Śledzenie postępów

Każdy task posiada:  

- etykietę **milestone** w GitHub Issues,  
- status (Todo / In Progress / Done),  
- automatyczne wiązanie z PR przez słowa kluczowe „Closes #ID”.