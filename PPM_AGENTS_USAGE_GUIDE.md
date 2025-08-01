# PPM Agents Usage Guide
## Prestashop Product Manager - Sub-Agenci Claude Code

## 🚀 Przegląd Systemu

Projekt PPM (Prestashop Product Manager) posiada kompletny zespół **9 specjalistycznych AI sub-agentów** zaprojektowanych dla maksymalnej produktywności i jakości kodu w rozwoju aplikacji webowej do zarządzania produktami na wielu sklepach PrestaShop.

### Kluczowe Cechy Systemu
- **9 specialist agents** pokrywających wszystkie aspekty rozwoju
- **Production-ready standardy** dla każdego agenta  
- **Minimal tool permissions** dla bezpieczeństwa
- **Git-centric workflow** zapewniający śledzenie zmian
- **Spec-driven development** bazujący na Amazon-style methodology

---

## 🏗️ AGENCI PODSTAWOWI (Core Agents)

### 1. project-steering-agent
**Rola:** Kluczowy agent do sterowania całym projektem PPM  
**Kiedy używać:** Do orkiestracji całego projektu, koordynacji zespołu agentów, kontroli jakości  
**Specjalizacja:** Amazon-style Specification System, .kiro/specs/, kontrola zgodności z wymaganiami  
**Przykład użycia:**
```
"Użyj project-steering-agent do przeglądu postępów ETAPU 1 i zaplanowania kolejnych kroków"
```

### 2. context-plan-keeper  
**Rola:** Strażnik kontekstu i planu projektu  
**Kiedy używać:** Gdy AI odbiega od tematu, gdy potrzeba przypomnienia o aktualnym zadaniu  
**Specjalizacja:** Pilnowanie realizacji Plan_Projektu.md, kontrola scope, zapobieganie mission drift  
**Przykład użycia:**  
```
"Context-plan-keeper przypomina: aktualny etap to ETAP 1.2 Backend Core - implementacja Express.js setup"
```

### 3. documentation-reader
**Rola:** Ekspert znajomości wszystkich dokumentów projektu  
**Kiedy używać:** Do weryfikacji zgodności z init.md, CLAUDE.md, Plan_Projektu.md  
**Specjalizacja:** Interpretacja wymagań, compliance checking, oficjalna dokumentacja  
**Przykład użycia:**
```
"Użyj documentation-reader do weryfikacji czy ta implementacja jest zgodna z punktem 18 z init.md"
```

### 4. coding-style-agent
**Rola:** Kontrola standardów kodowania i best practices  
**Kiedy używać:** Przed akceptacją każdego kodu, podczas code review  
**Specjalizacja:** Google Style Guides, React/TypeScript/Node.js standards, security  
**Przykład użycia:**
```
"Coding-style-agent sprawdź czy ten kod React spełnia standardy TypeScript i accessibility"
```

### 5. debugger-agent
**Rola:** Specjalista diagnostyki i naprawy błędów  
**Kiedy używać:** Przy wszelkich błędach, problemach, nieoczekiwanym zachowaniu  
**Specjalizacja:** Systematic debug process, PrestaShop integration issues, performance problems  
**Przykład użycia:**
```
"Debugger-agent przeanalizuj dlaczego synchronizacja z PrestaShop API kończy się timeout"
```

---

## 💻 AGENCI SPECJALISTYCZNI (Specialist Agents)

### 6. prestashop-integration-specialist
**Rola:** Ekspert integracji z PrestaShop API v8/v9  
**Kiedy używać:** Do wszystkich operacji związanych z PrestaShop API, eksport/import produktów  
**Specjalizacja:** PS API compatibility, bulk operations, image management, error handling  
**Przykład użycia:**
```
"PrestaShop-integration-specialist zaimplementuj bulk export 100 produktów na 5 sklepów jednocześnie"
```

### 7. react-frontend-developer
**Rola:** Ekspert React.js + TypeScript frontend development  
**Kiedy używać:** Do implementacji UI components, animacji, responsive design  
**Specjalizacja:** Material-UI, dark/light mode, Framer Motion, performance optimization  
**Przykład użycia:**
```
"React-frontend-developer stwórz komponent ProductForm z multi-step wizard i auto-save"
```

### 8. backend-api-developer  
**Rola:** Ekspert Node.js/Express backend i API development  
**Kiedy używać:** Do implementacji REST API, authentykacji OAuth, baz danych  
**Specjalizacja:** Express/TypeScript, PostgreSQL/MySQL, OAuth 2.0, ERP integrations  
**Przykład użycia:**
```
"Backend-api-developer zaimplementuj OAuth Google Workspace z domain restrictions"
```

---

## 🔄 WORKFLOW ORCHESTRATION

### Rozwój Nowej Funkcjonalności
```
User Request 
    ↓
project-steering-agent (orchestration)
    ↓
documentation-reader (verify requirements)
    ↓
context-plan-keeper (check scope)
    ↓
Assign specialists (backend/frontend/prestashop)
    ↓
coding-style-agent (review)
    ↓
debugger-agent (test)
    ↓
project-steering-agent (final approval)
```

### Naprawa Błędów
```
Bug Report 
    ↓
debugger-agent (diagnosis)
    ↓
Root cause identification
    ↓
Assign specialist (fix implementation)
    ↓
coding-style-agent (review)
    ↓
Testing & verification
    ↓
Documentation update
```

---

## 📋 PRZYKŁADOWE SCENARIUSZE UŻYCIA

### Scenariusz 1: Implementacja Nowej Funkcji "Bulk Product Export"
```
User: "Chcę zaimplementować bulk export produktów na wiele sklepów PrestaShop"

→ project-steering-agent: 
  • Analizuje wymagania względem init.md punkt 22-23
  • Deleguje do documentation-reader weryfikację specyfikacji
  • Koordynuje workflow między agentami

→ backend-api-developer:
  • Implementuje POST /api/v1/products/bulk endpoint
  • Dodaje BulkOperationQueue z Bull/Redis
  • Tworzy progress tracking system

→ prestashop-integration-specialist:
  • Implementuje parallel export z rate limiting
  • Dodaje error handling dla różnych wersji PS
  • Testuje compatibility z PS 8/9

→ react-frontend-developer:
  • Tworzy BulkExportModal z progress bar
  • Dodaje shop selection interface
  • Implementuje real-time progress updates

→ coding-style-agent:
  • Weryfikuje kod względem Google Style Guides
  • Sprawdza TypeScript types i error handling
  • Kontroluje security best practices
```

### Scenariusz 2: Naprawa Błędu "OAuth Authentication Fails"
```
User: "OAuth Google nie działa - użytkownicy nie mogą się zalogować"

→ debugger-agent:
  • Systematic diagnosis: analizuje logi, sprawdza network
  • Identyfikuje problem: nieprawidłowy redirect URI
  • Weryfikuje OAuth configuration w Google Console

→ backend-api-developer:
  • Naprawia OAuth callback URL
  • Dodaje better error handling
  • Implementuje domain restrictions

→ documentation-reader:
  • Weryfikuje czy fix jest zgodny z wymaganiami OAuth z init.md
  • Sprawdza compliance z Google Workspace requirements

→ coding-style-agent:
  • Review security implications
  • Weryfikuje error messages i logging
```

### Scenariusz 3: Przygotowanie do Release ETAP 1
```
User: "Przygotuj release dla ETAPU 1 - Fundament"

→ project-steering-agent:
  • Kompletny audyt względem Plan_Projektu.md ETAP 1
  • Weryfikuje wszystkie deliverables (setup, backend, auth, frontend)
  • Koordynuje release preparation workflow

→ debugger-agent:
  • Performance tests - load testing API endpoints
  • Security audit - penetration testing
  • Integration tests - PrestaShop connectivity

→ coding-style-agent:
  • Code quality review całego codebase
  • Standardy compliance check
  • Security best practices verification

→ documentation-reader:
  • Final compliance check względem wszystkich requirements
  • Weryfikacja czy wszystkie funkcje z init.md są zaimplementowane
```

---

## ⚡ EMERGENCY PROTOCOLS

### Build Broken
1. **debugger-agent** - Immediate error diagnosis
2. **coding-style-agent** - Standards violation check  
3. **project-steering-agent** - Coordinate fix across team

### Performance Issues
1. **debugger-agent** - Performance bottleneck identification
2. **backend-api-developer** - Database/API optimization
3. **react-frontend-developer** - Frontend performance tuning

### PrestaShop Integration Problems
1. **prestashop-integration-specialist** - PS API troubleshooting
2. **debugger-agent** - Network/authentication diagnosis
3. **documentation-reader** - Verify against PS documentation

### Security Issues
1. **coding-style-agent** - Security standards enforcement
2. **backend-api-developer** - Fix security vulnerabilities
3. **project-steering-agent** - Security audit coordination

---

## 🎯 BEST PRACTICES

### 1. Zawsze Zaczynaj od Steering Agent
```
"Project-steering-agent przeanalizuj to zadanie i zaplanuj workflow"
```

### 2. Weryfikuj Względem Dokumentacji
```
"Documentation-reader potwierdź czy to jest zgodne z wymaganiami z init.md"
```

### 3. Pilnuj Kontekstu
```
"Context-plan-keeper przypomij jaki jest aktualny etap i priorytet"
```

### 4. Code Review jest Obowiązkowy
```
"Coding-style-agent sprawdź ten kod przed merge"
```

### 5. Testuj Wszystko
```
"Debugger-agent zweryfikuj czy to działa we wszystkich scenariuszach"
```

---

## 📊 SUCCESS METRICS

### Quality Gates
- **Każdy agent** musi produkować weryfikowalny output
- **Code coverage** >80% dla backend, >70% dla frontend  
- **PrestaShop compatibility** - testy na PS 8 i 9
- **Security compliance** - zero hardcoded secrets, proper OAuth
- **Performance targets** - <2s API response, 60 FPS frontend

### Agent Performance  
- **Response time** <5 min dla complex tasks
- **Quality score** >95% successful task completion
- **Integration** - zero conflicts między agentami
- **Documentation** - 100% compliance z specifications

---

## 📚 QUICK REFERENCE

### Bezpośrednie Wywołanie Agentów
```bash
# Steering i koordinacja
"Użyj project-steering-agent do..."
"Invoke context-plan-keeper dla..."

# Dokumentacja i standardy  
"Documentation-reader zweryfikuj..."
"Coding-style-agent sprawdź..."

# Development
"Backend-api-developer zaimplementuj..."
"React-frontend-developer stwórz..."
"PrestaShop-integration-specialist połącz..."

# Debug i troubleshooting
"Debugger-agent przeanalizuj..."
```

### Typowe Workflow Patterns
```bash
# Nowa funkcja
project-steering-agent → documentation-reader → specialists → coding-style-agent → debugger-agent

# Bug fix
debugger-agent → specialist → coding-style-agent → verification

# Release
project-steering-agent → all agents audit → final approval
```

---

## 🎯 KLUCZOWE ZASADY

1. **Spec-Driven Development** - wszystko musi być zgodne z init.md i Plan_Projektu.md
2. **Security First** - każda implementacja musi przejść security review
3. **PrestaShop Compatibility** - testowanie na PS 8 i 9 jest obowiązkowe  
4. **Performance Focus** - aplikacja musi działać szybko z dużymi zbiorami danych
5. **Code Quality** - żadnych kompromisów w standardach kodowania
6. **Documentation** - każda zmiana musi być udokumentowana
7. **Testing** - comprehensive testing na wszystkich poziomach

---

**SUKCES PROJEKTU PPM zależy od systematycznego użycia wszystkich agentów w odpowiedniej kolejności. Każdy agent ma kluczową rolę w dostarczeniu wysokiej jakości, bezpiecznej i wydajnej aplikacji webowej.**

---

**Autor:** System AI Sub-Agentów PPM  
**Data utworzenia:** 2025-08-01  
**Projekt:** Prestashop Product Manager (PPM)  
**Wersja:** 1.0

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>