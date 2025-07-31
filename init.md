Tworzymy narzędzie do zarządzania produktami na wielu sklepach Prestashop jednocześnie o nazwie Prestashop Product Manager.

* Aplikacja musi działać online w przeglądarce.
* Aplikacja musi mieć uwierzytelnianie OAuth Google Workspace na własną domenę oraz Microsoft
* Aplikacja musi mieć następujące poziomy użytkowników:
  - Admin - dostęp do wszystkich funkcji niższych poziomów a także możliwość dodawania, usuwania, edycji kont użytkowników, edycji ustawień aplikacji, dodawania, usuwania, edycji nowych sklepów prestashop, łączenia z bazami danych ERP takich jak Subiekt GT, czy Microsoft Dynamics
  - Menadżer - może dodawać, usuwać, edytować produkty, kategorie, zdjęcia, opisy, warianty, cechy w bazie aplikacji, a także je eksportować na sklepy prestashop, może wgrywać masowo dane do bazy z pliku CSV, lub z ERP, baza może pozwolić na pominięcie importu niektórych wartości jak zdjęcia, opis itp. Ale musi wymagać podczas importu wymagane wartości jak Indeks (SKU) produktu, Nazwa czy Kategoria, oraz funkcje użytkownika
  - Użytkownik - może odczytywać dane produktów, pojedynczo lub masowo, ma dostęp również do wyszukiwarki. Aplikacja nie pokazuje produktów dopóki nie zostanie wysłane zapytanie szukania przez użytkownika, typu wyszukaj po nazwie indeksie, kategorii, na sklepie itp.
* Aplikacja musi weryfikować poprawność produktów przed eksportem na prestashop
* Aplikacja powinna mieć czytelny i przejrzysty interface zgodny ze współczesnymi trendami, a także oferować tryb ciemny i jasny oraz posiadać elementy interaktywne z nowoczesnymi animacjami.
* Jako punkt wyjścia do poprawnego dodawania produktów na sklep prestashop możesz się sugerować inną aplikacją "D:\\OneDrive - MPP TRADE\\Skrypty\\Presta\_Sync" do synchronizacji danych między dwoma prestami, tam dodawanie produktów ze starej na nową prestę odbywało się w sposób prawidłowy.
* Aplikacja musi działać szybko i operować na dużej liczbie danych
* Aplikacja musi Tworzyć własną lokalną bazę zdjęć gotową do eksportu na prestashop, zgodnie z zasadami dodawania zdjęć na prestashop do produktów
* Aplikacja musi mieć możliwość wybrania sklepu prestashop przez użytkownika na który ma być eksportowany produkt
* Aplikacja musi weryfikować dane między aplikacją, a docelowym sklepem prestashop i przekazywać w sposób czytelny i wizualny użytkownikowi różnice i rozbieżności danych czy też zdjęć
* Aplikacja musi wiedzieć na jaki sklep jaki produkt został wysłany, edytowany, czy też usunięty i pokazywać to wizualnie użytkownikowi
* Każdy sklep prestashop może mieć inne produkty, ale też mogą być takie które występują na kilku sklepach, aplikacja musi mieć możliwość tworzenia oddzielnych tytułów, opisów i zdjęć produktów na różne sklepy prestashop i przechowywać te informacje, które potem może wykorzystać przy werfikacji pobrania danych ze sklepu w celu znalezienia rozbiżności
* Aplikacja musi mieć możliwość wpisywania opisów produktów w html zgodnym z prestashop, oraz musi dawać użytkownikowi zstaw narzędzi do formatowania tekstu
* Każdy sklep prestashop może mieć inne kategorie, aplikacja musi w sposób czytelny pozwalać użytkownikowi wybierać kategorie dostępne na sklepie prestashop, a także podawać sugestię kategorii na podstawie innych podobnych produktów
* Aplikacja powinna oferować możliwość upload wielu zdjęć jednocześnie
* Aplikacja powinna mieć możliwość eksportu wielu produktów jednocześnie
* Aplikacja powinna mieć możliwość oznaczenia na jakie sklepy jakie produkty mają być eksportowane i wyeksportować je jednocześnie na różne sklepy zgodnie z oznaczeniem
