# Agent Usage Guide - PPM (PrestaShop Product Manager)

## 🤖 Dostępni Agenci PPM

### 🎯 Agenci Bazowi (Koordynacja i Zarządzanie)

#### **project-steering-agent** (Orchestrator)
**Kiedy używać**: Dla złożonych, wieloetapowych zadań wymagających koordynacji
```
Użyj gdy:
- Zadanie ma 3+ kroki wymagające różnych specjalistów
- Potrzebujesz breakdown dużego task na subtasks
- Zarządzasz workflow między różnymi domenami (backend/frontend/integration)
- Koordynujesz pracę między zespołami specjalistów
```

#### **architect** 
**Kiedy używać**: Do planowania i projektowania przed implementacją
```
Użyj gdy:
- Planujesz nowe features lub komponenty
- Potrzebujesz technical specification
- Projektujesz architekturę systemu
- Tworzysz breakdown plan implementacji
- Analizujesz requirements przed kodowaniem
```

#### **context-plan-keeper**
**Kiedy używać**: Do pilnowania zgodności z planem i dokumentacją
```
Użyj gdy:
- Rozpoczynasz nowy etap projektu
- Potrzebujesz weryfikacji zgodności z Plan_Projektu.md
- Implementacja odbiega od requirements z init.md
- Aktualizujesz dokumentację po milestone
- Podejmujesz decyzje architektoniczne
```

### 🛠️ Agenci Specjalistyczni (Implementacja)

#### **backend-api-developer**
**Kiedy używać**: Do pracy z backend API Node.js + Express + Prisma
```
Użyj gdy:
- Tworzysz/modyfikujesz API endpoints
- Pracujesz z bazą danych i Prisma ORM
- Implementujesz authentication/authorization
- Integrujesz z queue system (Bull/BullMQ)
- Optimizujesz performance backendu
- Debugujesz problemy serwerowe

Przykład:
"use backend-api-developer: Stwórz endpoint POST /api/v1/products do tworzenia produktów z walidacją i Prisma"
```

#### **react-frontend-developer** 
**Kiedy używać**: Do rozwoju interfejsu React + TypeScript
```
Użyj gdy:
- Tworzysz/modyfikujesz komponenty React
- Implementujesz formularze z walidacją
- Pracujesz z state management (Redux/Zustand)
- Tworzysz responsive design
- Implementujesz themes (dark/light mode)
- Optimizujesz performance frontendu

Przykład:
"use react-frontend-developer: Stwórz komponent ProductForm z multi-step wizard i auto-save"
```

#### **prestashop-integration-specialist**
**Kiedy używać**: Do integracji z PrestaShop API
```
Użyj gdy:
- Integrujesz z PrestaShop API v8/v9
- Synchronizujesz dane produktów
- Implementujesz eksport/import do PS
- Zarządzasz zdjęciami produktów (PS compatible)
- Rozwiązujesz problemy sync conflicts
- Optimizujesz API calls do PrestaShop

Przykład:
"use prestashop-integration-specialist: Zaimplementuj sync produktów z conflict resolution między aplikacją a PS"
```

### 🔍 Agenci Pomocniczzy (Wsparcie i Jakość)

#### **debugger-agent** (Model: Opus)
**Kiedy używać**: Do debugowania problemów
```
Użyj gdy:
- Masz błędy w aplikacji (backend/frontend)
- Performance issues wymagające deep analysis
- Integration problems z PrestaShop/ERP
- Database issues lub slow queries
- Authentication/authorization problems
- Mysterious bugs wymagające investigation

Przykład:
"use debugger-agent: Aplikacja powoli ładuje listę produktów, memory usage rośnie - przeanalizuj i zdiagnozuj"
```

#### **coding-style-agent**
**Kiedy używać**: Do pilnowania jakości kodu
```
Użyj gdy:
- Kod nie używa MCP Context7 (KRYTYCZNE!)
- Code review - sprawdzenie standards
- TypeScript typing issues
- Performance anti-patterns w kodzie
- Before merge do main branch
- Gdy kod nie jest consistent z projektem

Przykład:
"use coding-style-agent: Przejrzyj ten kod API endpoint - czy używa proper TypeScript typing i Context7?"
```

#### **documentation-reader**
**Kiedy używać**: Do weryfikacji zgodności z dokumentacją
```
Użyj gdy:
- Implementujesz nowy feature - sprawdź requirements
- Niepewność co do correct approach
- Before making architectural decisions
- Potrzebujesz guidance z external APIs (PrestaShop)
- Code review - sprawdz compliance z standards

Przykład:
"use documentation-reader: Sprawdź czy moja implementacja OAuth jest zgodna z CLAUDE.md i Plan_Projektu.md"
```

#### **ask** (Knowledge Expert)
**Kiedy używać**: Do pytań i wyjaśnień technicznych
```
Użyj gdy:
- Potrzebujesz wyjaśnienia konceptów
- Analizujesz istniejący kod
- Szukasz recommendations technicznych
- Uczysz się o nowych technologiach
- Potrzebujesz examples/patterns

Przykład:
"use ask: Wyjaśnij mi jak działa Prisma connection pooling i jak to zoptymalizować dla PPM"
```

## 🔄 Workflow Patterns (Kiedy używać jakich agentów)

### Pattern 1: Nowy Feature Development
```
1. architect -> plan feature architecture
2. context-plan-keeper -> verify zgodność z planem
3. backend-api-developer -> implement backend logic  
4. prestashop-integration-specialist -> add PS integration (jeśli potrzebne)
5. react-frontend-developer -> create UI components
6. coding-style-agent -> code review
7. debugger-agent -> troubleshoot issues (jeśli potrzebne)
```

### Pattern 2: Bug Investigation
```
1. debugger-agent -> diagnose problem (5-7 possibilities → 1-2 likely causes)
2. backend-api-developer / react-frontend-developer -> implement fix
3. coding-style-agent -> ensure fix quality
4. context-plan-keeper -> update docs if needed
```

### Pattern 3: PrestaShop Integration
```
1. documentation-reader -> check PS API requirements
2. prestashop-integration-specialist -> implement integration
3. backend-api-developer -> add API endpoints
4. debugger-agent -> troubleshoot sync issues (jeśli potrzebne)  
5. coding-style-agent -> code review
```

### Pattern 4: Complex Multi-Component Task
```
1. project-steering-agent -> break down into subtasks
2. architect -> create technical specification
3. Specialized agents (backend/frontend/prestashop) -> implement components
4. debugger-agent -> resolve integration issues
5. context-plan-keeper -> update documentation
```

## ⚠️ Krytyczne Zasady

### **ZAWSZE używaj Context7!**
```bash
# Sprawdź status przed każdym coding task
claude mcp list

# Jeśli brak Context7:
claude mcp add context7 npx @upstash/context7-mcp

# W każdym prompt kodowym dodaj:
"use context7"
```

### **Agent Selection Priority**
1. **MCP Context7** - OBOWIĄZKOWY przy każdym kodowaniu
2. **Specialized Agent** - wybierz najbardziej appropriate dla task
3. **Multiple Agents** - dla complex tasks używaj workflow patterns
4. **Documentation Check** - zawsze weryfikuj z documentation-reader/context-plan-keeper

### **Quality Gates**
- Każdy kod przez **coding-style-agent** przed merge
- Problemy przez **debugger-agent** dla systematic diagnosis  
- Nowe features przez **context-plan-keeper** dla compliance check
- Complex tasks przez **project-steering-agent** dla coordination

## 🎯 Przykłady Użycia

### Implementacja Product CRUD
```
"use project-steering-agent: Potrzebuję zaimplementować kompletny CRUD dla produktów - backend API + frontend form + PrestaShop sync"

Orchestrator rozłoży na:
1. backend-api-developer: API endpoints
2. react-frontend-developer: ProductForm component  
3. prestashop-integration-specialist: PS sync logic
4. coding-style-agent: code review
```

### Debug Performance Issue
```
"use debugger-agent: Lista produktów ładuje się 15 sekund, użytkownicy narzekają na performance"

Debugger przeanalizuje:
- Database queries (N+1 problem?)
- Frontend rendering issues
- API response times
- Memory leaks
```

### Code Review
```
"use coding-style-agent: Przejrzyj ten kod ProductController - sprawdź TypeScript typing, error handling i Context7 usage"
```

Pamiętaj: **Agenci to narzędzia do precyzyjnej pracy. Wybieraj właściwego specjalistę dla konkretnego zadania!**