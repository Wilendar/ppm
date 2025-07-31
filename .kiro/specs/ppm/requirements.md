# Prestashop Product Manager – Requirements v0.1

> Dokument opisuje wymagania funkcjonalne i niefunkcjonalne systemu PPM. Numeracja sekcji (np. **<F1.2>**) jest źródłem odniesień w `tasks.md`.

---

## 1. Zakres <1.0>
PPM umożliwia centralne zarządzanie katalogiem produktów, mediami oraz eksportem danych na wiele sklepów Prestashop z poziomu przeglądarki. Obejmuje:  
- CRUD produktów, atrybutów, kategorii, zdjęć  
- Import z plików CSV/ERP  
- Walidację i hurtowy eksport na sklepy Prestashop  
- Porównywanie i raportowanie rozbieżności  

## 2. Interesariusze <2.0>
| Rola              | Cel                                                                    |
|-------------------|------------------------------------------------------------------------|
| Właściciel sklepów| Zwiększyć efektywność publikacji produktów                            |
| Administrator IT  | Łatwe utrzymanie, bezpieczeństwo                                       |
| Menadżer e-commerce| Kontrola jakości danych, szybki eksport                               |
| Użytkownik        | Wyszukiwanie i pobieranie danych produktów                             |

## 3. Definicje & skróty <3.0>
- **PPM** – Prestashop Product Manager  
- **PS API** – oficjalny Prestashop WebService  
- **ERP** – Subiekt GT, Microsoft Dynamics itp.  
- **SKU** – unikalny indeks produktu  

## 4. Role i uprawnienia <4.0>
| Akcja                               | Admin | Menadżer | Użytkownik |
|-------------------------------------|:----:|:--------:|:----------:|
| Zarządzanie kontami Użytkowników    | ✔️   |          |            |
| Dodawanie/edycja sklepów Prestashop | ✔️   |          |            |
| CRUD produktów / kategorii / mediów | ✔️   | ✔️       |            |
| Import z ERP / CSV                  | ✔️   | ✔️       |            |
| Eksport produktów                   | ✔️   | ✔️       |            |
| Odczyt & wyszukiwanie katalogu      | ✔️   | ✔️       | ✔️         |
| Przegląd rozbieżności               | ✔️   | ✔️       |            |

---

## 5. Wymagania funkcjonalne

### 5.1 Uwierzytelnianie i autoryzacja
- <F1.1> OAuth2 login via Google Workspace & Microsoft.  
- <F1.2> Sesje JWT + odświeżanie, logout.  
- <F1.3> Mapowanie kont do ról opisanych w <4.0>.

### 5.2 Zarządzanie sklepami Prestashop
- <F2.1> Dodanie sklepu przez podanie URL, klucza WebService i wersji PS.  
- <F2.2> Test połączenia i zapis szyfrowanych kluczy.  
- <F2.3> Obsługa wielu sklepów, przypisanie aliasu i strefy walutowej.

### 5.3 Katalog produktów
- <F3.1> Tworzenie / edycja / usuwanie produktów, wariantów, atrybutów.  
- <F3.2> Wymuszona walidacja pól: SKU, nazwa, kategoria.  
- <F3.3> Edytor HTML z podglądem (zgodny z Prestashop).  
- <F3.4> Historia zmian (audit trail).

### 5.4 Media Manager
- <F4.1> Masowy upload (drag-and-drop) min. 100 plików jednocześnie.  
- <F4.2> Automatyczne tworzenie miniatur i konwersja do WebP.  
- <F4.3> Mapowanie zdjęć do produktów wg SKU lub ręcznie.

### 5.5 Import z ERP / CSV
- <F5.1> Import plików CSV > 1 M wierszy (streaming).  
- <F5.2> Możliwość pomijania kolumn opcjonalnych (np. opis, zdjęcia).  
- <F5.3> Pluginy integracyjne do Subiekt GT, Dynamics (REST/ODBC).

### 5.6 Eksport i synchronizacja
- <F6.1> Kolejkowanie eksportu, progres w UI.  
- <F6.2> Hurtowy eksport > 1000 produktów / operacja.  
- <F6.3> Wizualne porównanie danych (diff) vs sklep.  
- <F6.4> Zapamiętywanie statusu (wysłany/zmodyfikowany/usunięty) per sklep.

### 5.7 Wyszukiwanie i filtrowanie
- <F7.1> Elastic-like search po SKU, nazwie, kategorii.  
- <F7.2> API zwraca wyniki < 300 ms dla 100 k rekordów.

### 5.8 Monitoring i raporty
- <F8.1> Dashboard metryk: czas eksportu, błędy walidacji.  
- <F8.2> Powiadomienia e-mail/webhook przy niepowodzeniu zadania.

---

## 6. Wymagania niefunkcjonalne

| ID | Kategoria      | Wymaganie |
|----|----------------|-----------|
| N1 | Wydajność      | UI reaguje <100 ms; eksport 1000 prod/min <F6.2> |
| N2 | Skalowalność   | Horyzontalne skalingi backend & workers |
| N3 | Bezpieczeństwo | OWASP Top 10, TLS 1.3, szyfrowanie kluczy sklepów |
| N4 | UX             | Motyw jasny/ciemny, WCAG 2.1 AA |
| N5 | Dostępność     | 99.5 % uptime miesięcznie |
| N6 | I18n           | PL/EN interfejs, mechanizm tłumaczeń JSON |
| N7 | Backup         | Migawki bazy 4×/dzień, storage S3 versioning |

---

## 7. Zakres poza projektem (Out-of-scope) <7.0>
- Obsługa marketplace (Allegro, Amazon).  
- Pełna obsługa magazynów (WMS).  
- Generowanie faktur i płatności.

## 8. Założenia <8.0>
- Prestashop 1.7+ wspiera pełne REST API.  
- ERP udostępnia dane przez CSV lub REST nieodpłatnie.  
- Użytkownicy korzystają z nowoczesnych przeglądarek (ES2020).

## 9. Otwarte kwestie <9.0>
- Model licencjonowania (SaaS vs on-premise).  
- Limit rozmiaru zdjęć w Media Managerze.  
- Integracja SSO z innymi IdP (Azure AD B2C).