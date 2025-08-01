# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt: Prestashop Product Manager (PPM)

Aplikacja webowa do zarządzania produktami na wielu sklepach PrestaShop jednocześnie. System pozwala na centralne zarządzanie produktami z możliwością eksportu do różnych sklepów PrestaShop z personalizowanymi danymi.

## Architektura wysokiego poziomu

### Struktura projektu
- `backend/` - API backend (planowany)  
- `frontend/` - Interfejs webowy (planowany)
- `init.md` - Szczegółowa specyfikacja wymagań

### Kluczowe funkcjonalności
1. **System uwierzytelniania**: OAuth Google Workspace + Microsoft  
2. **Zarządzanie użytkownikami**: 3 poziomy (Admin/Menadżer/Użytkownik)
3. **Zarządzanie produktami**: Centralna baza z możliwością eksportu na wiele sklepów
4. **Weryfikacja danych**: Porównywanie stanu między aplikacją a sklepami PrestaShop
5. **Zarządzanie zdjęciami**: Lokalna baza zgodna ze strukturą PrestaShop
6. **Import/Export**: Masowe operacje z/do CSV i systemów ERP

### Integracje
- **PrestaShop API**: v8 i v9 (dokumentacja: https://devdocs.prestashop-project.org/)
- **Systemy ERP**: Subiekt GT, Microsoft Dynamics
- **Aplikacja referencyjna**: `D:\OneDrive - MPP TRADE\Skrypty\Presta_Sync` (prawidłowa implementacja dodawania produktów)

### Kluczowe wymagania techniczne
- Aplikacja webowa (działająca w przeglądarce)
- Szybka obsługa dużych zbiorów danych
- Moderne UI z trybem ciemnym/jasnym i animacjami
- Struktura katalogów zdjęć zgodna z PrestaShop
- HTML editor zgodny z PrestaShop
- System kategorii per sklep z sugestiami

### Poziomy dostępu
- **Admin**: Pełny dostęp + zarządzanie użytkownikami/sklepami/integracjami ERP
- **Menadżer**: CRUD produktów + eksport + import CSV/ERP  
- **Użytkownik**: Tylko odczyt + wyszukiwanie (produkty widoczne po zapytaniu)

### Stan rozwoju
Projekt w fazie inicjalnej - istnieje tylko specyfikacja wymagań. Backend i frontend wymagają implementacji od podstaw.

## Ważne uwagi deweloperskie

### Bezpieczeństwo
- Weryfikacja uprawnień na każdym poziomie API
- Walidacja danych przed eksportem do PrestaShop  
- Bezpieczne przechowywanie danych uwierzytelniania

### Wydajność
- Optymalizacja dla dużych zbiorów danych
- Asynchroniczne operacje eksportu/importu
- Cache dla często używanych danych (kategorie, sklepy)

### Zgodność z PrestaShop
- Ścisłe przestrzeganie dokumentacji API PrestaShop 8/9
- Testowanie na różnych wersjach PrestaShop
- Implementacja zgodna z best practices z aplikacji referencyjnej