# ADR-003: JWT (Stateless) statt Session-basierter Authentifizierung

## Status
Entschieden

## Kontext

Single-User-App mit Login. Die App wird als PWA auf iOS installiert und genutzt. Es gibt keinen Registrierungs-Flow.

## Entscheidung

Stateless JWT mit 24 h Gültigkeit (konfigurierbar via `JWT_EXPIRATION_MS`).

## Begründung

**PWA-Kompatibilität**: iOS-PWAs haben eingeschränkte Cookie-Unterstützung (kein `SameSite=None` ohne HTTPS-Kontext, restriktives Cookie-Handling). JWT im `localStorage` funktioniert zuverlässig und vorhersehbar.

**Stateless**: Kein serverseitiger Session-Store nötig — keine Redis-Abhängigkeit, keine Sticky Sessions, kein Komplexitätszuwachs für Single-Instance-Deployment.

**Spring Security** hat erstklassige JWT-Unterstützung via `jjwt`. `JwtAuthFilter` ist ein Standard-Servlet-Filter.

Für einen Single-User mit 24 h Token-Gültigkeit ist das Sicherheitsmodell ausreichend: Login-Rate-Limiting kompensiert die fehlende server-seitige Token-Revocation.

## Konsequenzen

- Token kann nicht server-seitig invalidiert werden (Logout ist nur client-seitig via `localStorage.removeItem`)
- `localStorage` ist anfällig für XSS — mitigiert durch strikte CSP (`frame-ancestors 'none'`, `connect-src 'self'`)
- Bei einer kompromittierten JWT-Signatur müsste `JWT_SECRET` rotiert werden (alle aktiven Sessions werden dadurch ungültig)
