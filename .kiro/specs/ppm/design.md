# Prestashop Product Manager – Design v0.1

## 1. Przegląd architektury <D1.0>
System oparty jest na mikro-podziale funkcjonalnym z jednym serwisem API (BFF) i osobnymi workerami do zadań asynchronicznych. Całość konteneryzowana w Dockerze i uruchamiana w klastrze Kubernetes.

### 1.1 Diagram kontekstowy
```text
+-------------+          +---------+            +--------------------+
|  Użytkownik | <-HTTP-> | Frontend| <-gRPC->    |   Backend API      |
|  (Browser)  |          |   SPA   |             |   (NestJS BFF)     |
+-------------+          +----^----+             +----^-------^------+
                              |                       |       |
                              | WebSocket             | REST  | gRPC
                              |                       |       |
                              |                       |       v
                              |                   +---+---------------+
                              |                   | Worker pool       |
                              |                   | (Node/BullMQ)     |
                              |                   +---^-------^-------+
                              |                       |       |
                    CDN/S3 <--+                       |       |
                                                      | Redis | Pub/Sub
                                                      v       |
                         +------------------+   +-------------+-----+
                         |   PostgreSQL     |   |   Storage (S3)   |
                         +------------------+   +------------------+
```

## 2. Składniki systemu <D2.0>

| Komponent          | Framework             | Kluczowe biblioteki |
|--------------------|-----------------------|---------------------|
| Frontend SPA       | React + Vite + TS     | MUI, React Query, i18n, Zustand |
| Backend API        | NestJS (Node 20)      | GraphQL, Passport, Prisma |
| Kolejka            | Redis 7 + BullMQ      |                     |
| Worker Jobs        | Node 20               | Prestashop SDK, Sharp (imgs) |
| Baza danych        | PostgreSQL 15         | TimescaleDB ext.     |
| Storage mediów     | MinIO (S3-compatible) |                     |
| Monitoring         | Prometheus, Grafana   | Loki (logs)          |

## 3. Przepływ danych <D3.0>
1. Użytkownik uwierzytelnia się przez OAuth (Google/MS).  
2. Frontend pobiera token JWT i używa go w nagłówku `Authorization`.  
3. API zapisuje/odczytuje dane w PostgreSQL przez Prisma.  
4. Operacje eksportu publikują zadanie do BullMQ (`export:product`).  
5. Worker odbiera zadanie, pobiera dane oraz media ze storage, wywołuje Prestashop API, a progres publikuje z powrotem via Redis pub/sub → WebSocket.  
6. Po zakończeniu worker zapisuje status i diff w DB; frontend aktualizuje UI w czasie rzeczywistym.

## 4. Model danych (schema skrócona) <D4.0>
```text
Product (
  id UUID PK,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name JSONB,           -- i18n {pl,en}
  description JSONB,
  category_id UUID FK,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

Shop (
  id UUID PK,
  name VARCHAR,
  url TEXT,
  api_key TEXT ENCRYPTED
)

ProductShop (
  product_id UUID FK,
  shop_id UUID FK,
  status ENUM('NEW','SYNCED','UPDATED','DELETED'),
  last_export TIMESTAMPTZ,
  PRIMARY KEY (product_id, shop_id)
)

Media (
  id UUID PK,
  file_path TEXT,
  mime TEXT,
  width INT,
  height INT,
  sha256 CHAR(64)
)

ProductMedia (
  product_id UUID FK,
  media_id UUID FK,
  sort_order INT,
  PRIMARY KEY (product_id, media_id)
)
```

## 5. Diagram sekwencji – eksport produktu <D5.0>
```text
User -> Frontend : Klik "Eksportuj"
Frontend -> API   : POST /export {productIds, shopIds}
API -> DB         : INSERT Task
API -> Queue      : publish(export:product, taskId)
Queue -> Worker   : pop job
Worker -> PrestashopAPI : POST products
PrestashopAPI -> Worker : 201 Created
Worker -> DB      : UPDATE Task status=SUCCESS
Worker -> Redis   : publish(ws, progress 100%)
Redis -> Frontend : WS progress
```

## 6. Wzorce i dobre praktyki <D6.0>
- **CQRS**: oddzielenie zapytań (GraphQL) od komend (REST).  
- **Idempotentność**: klucz idempotencyjny w eksporcie, by uniknąć duplikatów.  
- **Retry with backoff**: w workerach dla timeoutów PS API.  
- **OpenTelemetry**: tracing end-to-end.

## 7. Skalowanie <D7.0>
- **Frontend**: hostowany na CDN, bezstanowy.  
- **API**: autoscaling horyzontalny (HPA) na CPU+RPS.  
- **Workers**: liczba instancji wg długości kolejki.  
- **DB**: read-replica dla raportów.  
- **Storage**: MinIO w trybie distributed.

## 8. Zależności zewnętrzne <D8.0>
| System          | Protokół | Kierunek | Cel |
|-----------------|----------|----------|-----|
| Prestashop API  | HTTPS    | Outbound | CRUD produktów |
| Google OAuth    | HTTPS    | Outbound | Logowanie |
| Microsoft OAuth | HTTPS    | Outbound | Logowanie |
| ERP Subiekt GT  | REST/CSV | Inbound  | Import |