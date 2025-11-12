# Recomendaciones de Steering Global para RESERVEO

## Siempre háblame en español

## Resumen

Este documento proporciona recomendaciones sobre qué steering files deberías tener a nivel **global** (en `~/.kiro/steering/`) vs **workspace** (en `.kiro/steering/`).

## Diferencia: Global vs Workspace

### Steering Global (`~/.kiro/steering/`)
- **Ubicación:** `~/.kiro/steering/` (fuera del proyecto)
- **Alcance:** Se aplica a TODOS tus proyectos
- **Uso:** Preferencias personales, estándares generales, herramientas comunes
- **Git:** NO se versiona (es personal)

### Steering Workspace (`.kiro/steering/`)
- **Ubicación:** `.kiro/steering/` (dentro del proyecto)
- **Alcance:** Solo este proyecto
- **Uso:** Estándares del proyecto, arquitectura específica, reglas del equipo
- **Git:** SÍ se versiona (compartido con el equipo)

## Recomendaciones de Steering Global

Basado en la documentación oficial de Kiro y mejores prácticas de la comunidad:

### 1. Preferencias de Comunicación

**Archivo:** `~/.kiro/steering/communication-preferences.md`

```markdown
---
inclusion: always
---

# Preferencias de Comunicación

## Idioma
- Siempre responde en español
- Usa terminología técnica en inglés cuando sea estándar (e.g., "commit", "deploy")

## Estilo de Respuesta
- Sé conciso y directo
- Usa ejemplos de código cuando sea relevante
- Explica el "por qué" además del "cómo"
- Usa emojis moderadamente para claridad visual

## Formato
- Usa markdown para estructura
- Incluye bloques de código con syntax highlighting
- Usa listas para pasos múltiples
- Resalta información crítica con **negrita**
```

### 2. Estándares de Git

**Archivo:** `~/.kiro/steering/git-standards.md`

```markdown
---
inclusion: always
---

# Estándares de Git

## Conventional Commits
Usa el formato: `<type>(<scope>): <description>`

**Tipos:**
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Formato, punto y coma, etc.
- `refactor:` - Refactorización de código
- `test:` - Añadir o modificar tests
- `chore:` - Tareas de mantenimiento

**Ejemplos:**
```bash
feat(auth): add password reset functionality
fix(api): resolve race condition in user creation
docs(readme): update installation instructions
```

## Branching
- `main` - Producción
- `develop` - Desarrollo
- `feature/nombre` - Nuevas funcionalidades
- `fix/nombre` - Correcciones
- `hotfix/nombre` - Correcciones urgentes

## Commits
- Commits pequeños y atómicos
- Mensajes descriptivos en presente
- Un commit = un cambio lógico
```

### 3. Seguridad General

**Archivo:** `~/.kiro/steering/security-general.md`

```markdown
---
inclusion: always
---

# Seguridad General

## Variables de Entorno
- ❌ NUNCA hardcodear credenciales
- ❌ NUNCA subir archivos `.env` a Git
- ✅ Usar `.env.example` como plantilla
- ✅ Documentar variables requeridas

## Secrets Management
- Usar gestores de secrets (AWS Secrets Manager, Vault)
- Rotar credenciales regularmente
- Principio de mínimo privilegio

## Validación de Inputs
- Validar TODOS los inputs del usuario
- Sanitizar datos antes de usar
- Usar librerías de validación (Zod, Joi, etc.)

## Dependencias
- Mantener dependencias actualizadas
- Revisar vulnerabilidades con `npm audit`
- No usar paquetes abandonados o sin mantenimiento
```

### 4. Mejores Prácticas de Código

**Archivo:** `~/.kiro/steering/code-best-practices.md`

```markdown
---
inclusion: always
---

# Mejores Prácticas de Código

## Principios Generales
- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)
- **SOLID** principles

## Nombres
- Variables: `camelCase` descriptivo
- Constantes: `UPPER_SNAKE_CASE`
- Funciones: verbos descriptivos (`getUserById`, `calculateTotal`)
- Clases: `PascalCase` sustantivos

## Funciones
- Una función = una responsabilidad
- Máximo 20-30 líneas
- Parámetros: máximo 3-4
- Early returns para casos edge

## Comentarios
- Código auto-explicativo > comentarios
- Comentar el "por qué", no el "qué"
- JSDoc para funciones públicas
- TODO/FIXME con contexto

## Error Handling
- Siempre manejar errores
- Mensajes de error descriptivos
- Logging apropiado
- Fail fast cuando sea apropiado
```

### 5. Testing Standards

**Archivo:** `~/.kiro/steering/testing-standards.md`

```markdown
---
inclusion: always
---

# Estándares de Testing

## Pirámide de Testing
1. **Unit Tests** (70%) - Funciones individuales
2. **Integration Tests** (20%) - Interacción entre módulos
3. **E2E Tests** (10%) - Flujos completos

## Naming Convention
```typescript
describe('ComponentName', () => {
  it('should do something when condition', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Cobertura
- Mínimo 80% de cobertura
- 100% en lógica crítica de negocio
- No obsesionarse con el número

## Principios
- Tests independientes (no dependen entre sí)
- Tests rápidos (< 1s por test)
- Tests determinísticos (mismo resultado siempre)
- Un assert por test (cuando sea posible)

## Mocking
- Mock dependencias externas (APIs, DB)
- No mockear lo que estás testeando
- Usar factories para datos de prueba
```

### 6. TypeScript/JavaScript Standards

**Archivo:** `~/.kiro/steering/typescript-standards.md`

```markdown
---
inclusion: always
---

# Estándares TypeScript/JavaScript

## TypeScript
- Usar `strict: true` en tsconfig
- Evitar `any`, usar `unknown` si es necesario
- Definir interfaces para objetos complejos
- Usar tipos de utilidad (Partial, Pick, Omit)

## Imports
```typescript
// 1. External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// 3. Types
import type { User } from '@/types';

// 4. Styles/Assets
import './styles.css';
```

## Async/Await
- Preferir async/await sobre .then()
- Siempre usar try/catch
- Manejar errores apropiadamente

## Array Methods
- Usar métodos funcionales (map, filter, reduce)
- Evitar mutaciones (usar spread operator)
- Preferir métodos de array sobre loops

## Destructuring
```typescript
// ✅ Bueno
const { name, email } = user;
const [first, ...rest] = items;

// ❌ Malo
const name = user.name;
const email = user.email;
```
```

### 7. React Best Practices

**Archivo:** `~/.kiro/steering/react-standards.md`

```markdown
---
inclusion: always
---

# Estándares React

## Componentes
- Componentes funcionales con hooks
- Named exports preferidos
- Props interface con TypeScript
- Máximo 200 líneas por componente

## Hooks
- Seguir reglas de hooks
- Custom hooks para lógica reutilizable
- useCallback para funciones pasadas como props
- useMemo para cálculos costosos

## Estado
- useState para estado local
- Context para estado compartido
- React Query para estado del servidor
- Evitar prop drilling (max 2-3 niveles)

## Performance
- React.memo para componentes pesados
- Lazy loading para rutas
- Code splitting cuando sea apropiado
- Evitar re-renders innecesarios

## Accesibilidad
- Usar elementos semánticos HTML
- aria-labels cuando sea necesario
- Keyboard navigation
- Contraste de colores adecuado
```

### 8. Documentación

**Archivo:** `~/.kiro/steering/documentation-standards.md`

```markdown
---
inclusion: always
---

# Estándares de Documentación

## README.md
Debe incluir:
- Descripción del proyecto
- Requisitos previos
- Instalación
- Configuración
- Uso básico
- Scripts disponibles
- Contribución
- Licencia

## Código
- JSDoc para funciones públicas
- Comentarios inline para lógica compleja
- TODO/FIXME con contexto y fecha

## API
- OpenAPI/Swagger para REST APIs
- GraphQL schema documentation
- Ejemplos de requests/responses
- Códigos de error documentados

## Arquitectura
- Diagramas de arquitectura
- Decisiones de diseño (ADRs)
- Flujos de datos
- Integraciones externas
```

## Steering Específico de RESERVEO (Workspace)

Lo que YA tienes en `.kiro/steering/` está perfecto para el proyecto:

✅ `tech.md` - Stack técnico de Reserveo  
✅ `supabase.md` - Configuración específica de Supabase  
✅ `supabase-cli-setup.md` - Setup del CLI  
✅ `structure.md` - Estructura del proyecto  
✅ `product.md` - Overview del producto  
✅ `security.md` - Seguridad específica del proyecto  
✅ `incidents.md` - Sistema de incidentes  
✅ `mcp-servers.md` - MCPs configurados  

## Implementación Recomendada

### Paso 1: Crear Steering Global

```bash
# Crear directorio global
mkdir -p ~/.kiro/steering

# Crear archivos recomendados
touch ~/.kiro/steering/communication-preferences.md
touch ~/.kiro/steering/git-standards.md
touch ~/.kiro/steering/security-general.md
touch ~/.kiro/steering/code-best-practices.md
touch ~/.kiro/steering/testing-standards.md
touch ~/.kiro/steering/typescript-standards.md
touch ~/.kiro/steering/react-standards.md
touch ~/.kiro/steering/documentation-standards.md
```

### Paso 2: Copiar Contenido

Copia el contenido de cada sección en su archivo correspondiente.

### Paso 3: Personalizar

Ajusta cada archivo según tus preferencias personales.

## Ventajas de Esta Estructura

### Global
- ✅ Se aplica a todos tus proyectos
- ✅ Preferencias personales consistentes
- ✅ No contamina repositorios del equipo
- ✅ Fácil de mantener en un solo lugar

### Workspace
- ✅ Específico del proyecto
- ✅ Compartido con el equipo
- ✅ Versionado en Git
- ✅ Documentación del proyecto

## Recursos Adicionales

- [Documentación Oficial de Kiro Steering](https://kiro.dev/docs/steering/)
- [Book of Kiro - Steering](https://kiro-community.github.io/book-of-kiro/en/features/steering/)
- [Kiro Best Practices Boilerplate](https://github.com/awsdataarchitect/kiro-best-practices)

## Conclusión

**Para RESERVEO:**
- Mantén el steering workspace actual (está excelente)
- Añade steering global para preferencias personales
- Esto te dará consistencia en todos tus proyectos

**Prioridad:**
1. `communication-preferences.md` - Idioma y estilo
2. `git-standards.md` - Commits consistentes
3. `security-general.md` - Seguridad básica
4. Los demás según necesidad
