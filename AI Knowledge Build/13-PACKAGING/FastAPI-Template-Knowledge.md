---
tags: [knowledge, fastapi, template, fullstack, docker, auth]
source_repo: full-stack-fastapi-template
---

# Full Stack FastAPI Template - Knowledge Extraction

## Overview & Architecture

Official template by the FastAPI author (tiangolo). Production-ready fullstack scaffold with a clear separation between backend, frontend, and infrastructure layers.

**Directory layout:**
```
full-stack-fastapi-template/
├── backend/
│   ├── app/
│   │   ├── api/          # Routes + dependency injection
│   │   │   ├── deps.py   # Shared FastAPI dependencies
│   │   │   ├── main.py   # APIRouter aggregator
│   │   │   └── routes/   # login, users, items, utils, private
│   │   ├── core/         # config, db engine, security
│   │   ├── alembic/      # DB migrations
│   │   ├── models.py     # SQLModel models + Pydantic schemas (single file)
│   │   ├── crud.py       # DB operations (single file)
│   │   ├── main.py       # FastAPI app factory
│   │   └── utils.py      # Email, JWT token helpers
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── scripts/          # prestart.sh, test.sh, lint.sh
├── frontend/
│   ├── src/
│   │   ├── client/       # Auto-generated API client (openapi-ts)
│   │   ├── routes/       # TanStack Router file-based routes
│   │   ├── hooks/        # useAuth, useCustomToast, etc.
│   │   └── components/   # shadcn/ui + Radix UI components
│   └── Dockerfile
├── compose.yml            # Production Docker Compose
├── compose.override.yml   # Dev overrides (ports, reload, mailcatcher)
└── compose.traefik.yml    # Traefik reverse proxy setup
```

**Key architectural decisions:**
- Backend and frontend are completely decoupled — communicate via HTTP/REST only.
- Frontend client is auto-generated from backend OpenAPI spec (zero manual maintenance).
- Single `models.py` file holds both DB tables and Pydantic schemas — works well at small/medium scale.
- Single `crud.py` file for all DB operations — flat, simple, easy to extend.
- Alembic handles all migrations; `SQLModel.metadata.create_all()` is commented out on purpose.
- `prestart` Docker service runs before `backend` — handles migrations + seed data.

---

## Tech Stack & Dependencies

### Backend
| Package | Version | Purpose |
|---|---|---|
| fastapi[standard] | >=0.114.2 | Web framework + auto docs |
| sqlmodel | >=0.0.21 | ORM + Pydantic integration (SQLAlchemy under the hood) |
| pydantic + pydantic-settings | >2.0 | Validation, settings management |
| psycopg[binary] | >=3.1.13 | PostgreSQL driver (psycopg3, NOT psycopg2) |
| alembic | >=1.12.1 | Database migrations |
| pyjwt | >=2.8.0 | JWT encode/decode |
| pwdlib[argon2,bcrypt] | >=0.3.0 | Password hashing (Argon2 primary, bcrypt fallback) |
| python-multipart | >=0.0.7 | Required for OAuth2 form parsing |
| emails + jinja2 | - | Email sending with HTML templates |
| sentry-sdk[fastapi] | >=2.0.0 | Error monitoring |
| tenacity | >=8.2.3 | Retry logic for DB connections |
| uv | - | Package manager (replaces pip, used in Docker) |

### Frontend
| Package | Purpose |
|---|---|
| React 19 + TypeScript | UI |
| Vite 7 | Build tool |
| TanStack Router v1 | File-based routing with type safety |
| TanStack Query v5 | Server state management, caching |
| TanStack Table v8 | Data tables |
| shadcn/ui + Radix UI | Headless UI components |
| Tailwind CSS v4 | Styling |
| react-hook-form + zod | Form validation |
| @hey-api/openapi-ts | Auto-generate typed API client from OpenAPI spec |
| axios | HTTP client (used by generated client) |
| Playwright | E2E testing |
| Biome | Linting + formatting (replaces ESLint + Prettier) |
| Bun | Package manager + test runner |

### Infrastructure
- PostgreSQL 18 (via Docker)
- Traefik 3.6 (reverse proxy, automatic HTTPS via Let's Encrypt)
- Mailcatcher (local email testing)
- Adminer (DB admin UI)
- GitHub Actions (CI/CD)
- Sentry (optional error tracking)

---

## FastAPI Backend Patterns

### App Factory Pattern (`main.py`)
```python
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,  # clean client method names
)

# CORS — only add if origins are configured
if settings.all_cors_origins:
    app.add_middleware(CORSMiddleware, allow_origins=settings.all_cors_origins, ...)

app.include_router(api_router, prefix=settings.API_V1_STR)
```

**`custom_generate_unique_id`** generates names like `login-login_access_token` from `{tag}-{route_name}`. This drives the auto-generated frontend client method names.

### Settings via `pydantic-settings` (`core/config.py`)
- Reads from `../.env` (one level above `backend/`)
- Uses `@computed_field` for derived values (database URI, CORS origins, emails_enabled)
- `@model_validator(mode="after")` enforces non-default secrets — raises `ValueError` in staging/production, `warnings.warn` locally
- CORS origins support both comma-separated string and JSON array in `.env`

### Dependency Injection Pattern (`api/deps.py`)
```python
# Re-usable typed aliases — use these in route signatures
SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]
CurrentUser = Annotated[User, Depends(get_current_user)]
```

Routes declare dependencies by type annotation — clean and composable:
```python
def read_items(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100)
```

### Router Organization (`api/main.py`)
```python
api_router = APIRouter()
api_router.include_router(login.router)    # no prefix
api_router.include_router(users.router)    # prefix="/users"
api_router.include_router(items.router)    # prefix="/items"
api_router.include_router(utils.router)    # prefix="/utils"

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)  # dev-only routes, not in production
```

### Health Check
```python
@router.get("/utils/health-check/")
async def health_check() -> bool:
    return True
```
Docker `healthcheck` calls this endpoint: `curl -f http://localhost:8000/api/v1/utils/health-check/`

---

## Auth Implementation

### Password Hashing (`core/security.py`)
Uses `pwdlib` with **Argon2 as primary hasher, bcrypt as fallback** (for migrating existing bcrypt hashes):
```python
password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))

def verify_password(plain, hashed) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain, hashed)
    # Returns (verified, updated_hash_or_None)
    # If updated_hash is not None, the hash was bcrypt and should be re-saved as Argon2
```

### JWT Token Creation
```python
ALGORITHM = "HS256"

def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
```
Token payload contains only `sub` (user UUID as string) and `exp`. Access token lifetime: 8 days by default.

### Login Flow
1. `POST /api/v1/login/access-token` — OAuth2PasswordRequestForm (`username` + `password`)
2. `crud.authenticate()` looks up user by email, verifies password
3. Returns `Token(access_token=..., token_type="bearer")`
4. Frontend stores token in `localStorage` under key `"access_token"`

### Timing Attack Prevention (`crud.py`)
```python
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$..."

def authenticate(*, session, email, password) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        verify_password(password, DUMMY_HASH)  # always run hash, prevent timing attack
        return None
    verified, updated_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_hash:  # re-save if hash was upgraded (bcrypt -> argon2)
        db_user.hashed_password = updated_hash
        session.add(db_user); session.commit(); session.refresh(db_user)
    return db_user
```

### Token Validation (`api/deps.py`)
```python
def get_current_user(session: SessionDep, token: TokenDep) -> User:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    token_data = TokenPayload(**payload)
    user = session.get(User, token_data.sub)
    if not user: raise HTTPException(404)
    if not user.is_active: raise HTTPException(400)
    return user
```

### Email-based Password Recovery
1. `POST /password-recovery/{email}` — generates a short-lived JWT (48h) with email as `sub`, sends reset link
2. `POST /reset-password/` — verifies the JWT, updates password
3. **Email enumeration prevention**: always returns same success message regardless of whether email exists
4. **User existence prevention in reset**: returns `"Invalid token"` (not `"User not found"`) to avoid leaking info

### Superuser Guard
```python
def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user
```
Applied as `dependencies=[Depends(get_current_active_superuser)]` on route.

---

## CRUD Patterns

All CRUD is in a single flat `crud.py`. Key patterns:

### Create with computed fields
```python
def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj
```
`model_validate(..., update={...})` merges extra computed fields during model construction.

### Update with partial fields
```python
def update_user(*, session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)  # only fields explicitly provided
    extra_data = {}
    if "password" in user_data:
        extra_data["hashed_password"] = get_password_hash(user_data["password"])
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user); session.commit(); session.refresh(db_user)
    return db_user
```
`model_dump(exclude_unset=True)` + `sqlmodel_update()` = clean partial update pattern.

### Paginated list with count
```python
count_statement = select(func.count()).select_from(User)
count = session.exec(count_statement).one()
statement = select(User).order_by(col(User.created_at).desc()).offset(skip).limit(limit)
users = session.exec(statement).all()
return UsersPublic(data=[UserPublic.model_validate(u) for u in users], count=count)
```
Response always includes `data: list[...]` + `count: int` — enables frontend pagination.

### Owner-scoped queries (items)
```python
if current_user.is_superuser:
    # superuser sees all items
    statement = select(Item).order_by(...)
else:
    # regular user only sees their own
    statement = select(Item).where(Item.owner_id == current_user.id).order_by(...)
```

---

## Database & Migration Patterns

### SQLModel Models (`models.py`)
Each entity follows a layered schema pattern:
```
EntityBase (SQLModel)       — shared validation fields
├── EntityCreate(Base)      — creation input (adds password, etc.)
├── EntityUpdate(Base)      — update input (all fields Optional)
├── EntityRegister(SQLModel)— public self-registration (minimal fields)
├── Entity(Base, table=True)— DB table (adds id, hashed_password, relationships)
├── EntityPublic(Base)      — API response (adds id, excludes secrets)
└── EntitiesPublic(SQLModel)— paginated list response {data, count}
```

UUID primary keys (not integers):
```python
id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
```

Timezone-aware timestamps:
```python
created_at: datetime | None = Field(
    default_factory=get_datetime_utc,
    sa_type=DateTime(timezone=True),
)
```

Foreign key with cascade delete:
```python
owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
```

SQLModel relationship:
```python
# In User:
items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
# In Item:
owner: User | None = Relationship(back_populates="items")
```

### Alembic Integration (`alembic/env.py`)
```python
from app.models import SQLModel  # import to register all models
from app.core.config import settings

target_metadata = SQLModel.metadata

def get_url():
    return str(settings.SQLALCHEMY_DATABASE_URI)
```
Key: models must be imported before `target_metadata` is set so SQLModel registers the tables.

### DB Engine (`core/db.py`)
```python
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
# Uses postgresql+psycopg (psycopg3)
```

`init_db()` seeds the first superuser if not present — idempotent, safe to call on every start.

### Prestart Script (`scripts/prestart.sh`)
Runs before the app starts:
1. `backend_pre_start.py` — waits for DB to be ready (with retry/tenacity)
2. `alembic upgrade head` — applies all pending migrations
3. `initial_data.py` — seeds first superuser

---

## Frontend Integration

### Auto-generated API Client
The frontend uses `@hey-api/openapi-ts` to generate a fully typed client from the FastAPI OpenAPI spec:
```bash
npm run generate-client  # reads openapi-ts.config.ts, outputs to src/client/
```

The generated client includes:
- `LoginService.loginAccessToken()`
- `UsersService.readUserMe()`, `UsersService.registerUser()`
- Type definitions matching all Pydantic response models

**Key config in `main.tsx`:**
```typescript
OpenAPI.BASE = import.meta.env.VITE_API_URL
OpenAPI.TOKEN = async () => localStorage.getItem("access_token") || ""
```

### Auth Flow (Frontend)
`useAuth` hook (`hooks/useAuth.ts`) manages:
- `isLoggedIn()` — checks `localStorage` for token
- `loginMutation` — calls API, stores token, navigates to `/`
- `logout()` — removes token, navigates to `/login`
- `user` query — fetches `/users/me` when logged in (TanStack Query, key: `["currentUser"]`)

Global 401/403 handler in `QueryClient`:
```typescript
const handleApiError = (error: Error) => {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    localStorage.removeItem("access_token")
    window.location.href = "/login"
  }
}
```

### File-based Routing (TanStack Router)
Route files under `src/routes/`:
- `__root.tsx` — root layout
- `login.tsx`, `signup.tsx`, `recover-password.tsx`, `reset-password.tsx` — public routes
- `_layout.tsx` — authenticated layout (wraps protected routes)
- `_layout/index.tsx`, `_layout/items.tsx`, `_layout/admin.tsx`, `_layout/settings.tsx` — protected routes

Auth guard pattern in route:
```typescript
export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) throw redirect({ to: "/" })
  },
})
```

### Form Validation Pattern
```typescript
const formSchema = z.object({
  username: z.email(),
  password: z.string().min(8),
}) satisfies z.ZodType<AccessToken>  // ensures schema matches API type

const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  mode: "onBlur",
  criteriaMode: "all",
})
```

---

## Docker & Deployment

### Docker Services
| Service | Image / Build | Purpose |
|---|---|---|
| db | postgres:18 | PostgreSQL database |
| prestart | backend build | Run migrations + seed data |
| backend | backend build | FastAPI app (4 workers) |
| frontend | frontend build | React app served by nginx |
| adminer | adminer | DB admin UI |
| proxy (dev) | traefik:3.6 | Local reverse proxy |
| mailcatcher (dev) | schickling/mailcatcher | Catch emails locally |

### Startup Order (production `compose.yml`)
```
db (healthy) -> prestart (completed) -> backend (running)
```
Docker health check on `db` + `condition: service_completed_successfully` on `prestart` ensures correct startup order.

### Backend Dockerfile
```dockerfile
FROM python:3.10
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/  # install uv

ENV UV_COMPILE_BYTECODE=1   # compile .pyc for faster startup
ENV UV_LINK_MODE=copy        # needed for Docker layer caching

# Two-step install: deps first (cached layer), then app code
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-workspace --package app

COPY ./backend/app /app/backend/app

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --package app

CMD ["fastapi", "run", "--workers", "4", "app/main.py"]
```

### Frontend Dockerfile
- Multi-stage: build with Node/Bun, serve with nginx
- `VITE_API_URL` passed as build arg — baked into the bundle at build time
- `nginx.conf` handles SPA routing (all paths -> `index.html`)

### Development vs Production
`compose.override.yml` is automatically merged in dev:
- Backend: `--reload`, `develop.watch` for hot sync
- Frontend: exposes port 5173
- Traefik in insecure mode (no HTTPS locally)
- Mailcatcher for email testing
- All services expose ports directly

### Production Deployment
- Traefik handles HTTPS via Let's Encrypt (`certresolver=le`)
- Subdomain routing: `api.domain.com` -> backend, `dashboard.domain.com` -> frontend, `adminer.domain.com` -> adminer
- All services on `traefik-public` Docker network
- HTTP -> HTTPS redirect via `https-redirect` middleware

---

## Key Code Patterns (with snippets)

### 1. Annotated Dependency Aliases
```python
# Instead of repeating Depends() everywhere:
SessionDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

# Use in routes cleanly:
def my_route(session: SessionDep, current_user: CurrentUser): ...
```

### 2. Route-level Dependency (no parameter pollution)
```python
@router.get("/", dependencies=[Depends(get_current_active_superuser)])
def admin_only_route(session: SessionDep) -> ...:
    # superuser check happens, but superuser object not injected as parameter
```

### 3. SQLModel model_validate with computed fields
```python
# Merge extra fields during model construction:
db_obj = User.model_validate(
    user_create,
    update={"hashed_password": get_password_hash(user_create.password)}
)
```

### 4. Partial Updates with exclude_unset
```python
user_data = user_in.model_dump(exclude_unset=True)
db_user.sqlmodel_update(user_data)
```

### 5. Environment-based Route Registration
```python
if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
```
Dev-only endpoints (e.g., create user without auth for testing) never exist in production.

### 6. Clean OpenAPI operation IDs
```python
def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"
# Generates: "login-login_access_token", "users-read_user_me"
# Frontend client gets clean method names like LoginService.loginAccessToken()
```

### 7. pydantic-settings computed_field
```python
@computed_field
@property
def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
    return PostgresDsn.build(
        scheme="postgresql+psycopg",
        username=self.POSTGRES_USER, password=self.POSTGRES_PASSWORD,
        host=self.POSTGRES_SERVER, port=self.POSTGRES_PORT, path=self.POSTGRES_DB,
    )
```

### 8. Default Secret Enforcement
```python
@model_validator(mode="after")
def _enforce_non_default_secrets(self) -> Self:
    self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
    # In production: raises ValueError. Locally: warns.
```

### 9. Timezone-aware UTC timestamps
```python
def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)

created_at: datetime | None = Field(
    default_factory=get_datetime_utc,
    sa_type=DateTime(timezone=True),
)
```

### 10. Frontend global error boundary for 401/403
```typescript
const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleApiError }),
  mutationCache: new MutationCache({ onError: handleApiError }),
})
// Any query or mutation returning 401/403 auto-redirects to /login
```

---

## What We Can Reuse

### Directly reusable (copy-paste)
- `core/config.py` — Settings pattern with pydantic-settings, computed fields, secret enforcement
- `core/security.py` — JWT creation + Argon2/bcrypt password hashing with upgrade path
- `api/deps.py` — SessionDep, CurrentUser, superuser guard pattern
- `crud.py` — `model_validate(..., update={})` and `model_dump(exclude_unset=True)` patterns
- `models.py` — Base/Create/Update/Public/sPublic layered schema pattern
- `utils.py` — Email sending with Jinja2 templates, JWT-based password reset tokens
- Docker multi-stage build with uv — fast, cached, production-ready
- `compose.yml` + `compose.override.yml` split — clean dev/prod separation

### Patterns to adapt for our AI agency system
- **Auth pattern**: Reuse JWT + Argon2 exactly as-is. Add refresh tokens if needed.
- **Settings pattern**: Use `pydantic-settings` with `@computed_field` for derived config (API keys, service URLs).
- **CRUD pattern**: Scale to separate `crud/` directory with one file per entity when models grow.
- **Dependency pattern**: Define `CurrentUser`, `SessionDep`, `RateLimitDep` etc. as `Annotated` aliases.
- **Paginated response**: Always return `{data: [...], count: N}` — consistent, frontend-friendly.
- **Auto-generated client**: If building internal tools / admin panels, use `openapi-ts` to auto-generate typed clients from FastAPI's OpenAPI spec.
- **Private routes**: Use environment-based route registration for dev/test utilities.
- **Email templates**: Jinja2 HTML templates + `emails` library pattern is simple and works well.

### What to skip / replace for our use case
- **SQLModel**: Works well here but for complex query patterns consider raw SQLAlchemy with `select()`. SQLModel is fine for CRUD-heavy services.
- **Single models.py**: Good for small apps; split into `models/` directory once you have 10+ entities.
- **Single crud.py**: Split into `crud/` directory once you have 10+ entities.
- **React frontend**: Our projects may use Next.js or other stacks — the backend patterns are stack-agnostic.
- **TanStack Router**: Solid choice for SPAs; if using Next.js, ignore frontend entirely and use only the backend scaffold.

---

## Lessons & Best Practices

### Security
1. **Timing attack prevention**: Always run `verify_password()` even when user doesn't exist (dummy hash). Copy this pattern exactly.
2. **Email enumeration prevention**: `/password-recovery/{email}` always returns the same response. Never reveal whether an email is registered.
3. **User existence leakage in reset**: Return `"Invalid token"` not `"User not found"` in reset password flow.
4. **Secret enforcement at startup**: Fail hard in production if secrets are still `"changethis"`. Warn locally. Use `@model_validator`.
5. **Separate public schemas**: Never return DB model directly. Always use `EntityPublic` which excludes `hashed_password` etc.
6. **UUID primary keys**: Harder to enumerate than integer IDs. Use `uuid.uuid4()` as default.

### FastAPI Patterns
7. **`generate_unique_id_function`**: Always set this when building APIs with auto-generated clients. Cleaner method names.
8. **`exclude_unset=True`**: Critical for PATCH endpoints — only update fields the client actually sent.
9. **Annotated dependency aliases**: Eliminates boilerplate. Define once, use everywhere.
10. **`condition: service_completed_successfully`** in Docker Compose: Proper way to run prestart/migration jobs.

### Database
11. **Alembic over `create_all()`**: Never use `SQLModel.metadata.create_all()` in production. Always use Alembic for schema changes.
12. **Import models before metadata**: In `alembic/env.py`, import models before accessing `SQLModel.metadata` or relationships won't register.
13. **Timezone-aware datetimes**: Always use `DateTime(timezone=True)` in SA column type + `datetime.now(timezone.utc)` in Python.
14. **Cascade delete at DB level**: Use `ondelete="CASCADE"` on FK field + `cascade_delete=True` on Relationship for proper cleanup.
15. **psycopg3 not psycopg2**: The template uses `psycopg[binary]` (v3) with `postgresql+psycopg` URI scheme — newer, async-capable.

### Development Workflow
16. **uv over pip**: Significantly faster installs. Use `uv sync --frozen` in Docker for reproducible builds.
17. **Two-step Docker build**: Install deps (cached layer) separately from copying app code — avoids reinstalling deps on every code change.
18. **Prestart pattern**: Separate migration/seeding from the main app startup. Use `condition: service_completed_successfully` to enforce order.
19. **Mailcatcher**: Essential for local email testing. Points `SMTP_HOST=mailcatcher` in `compose.override.yml`.
20. **Biome over ESLint+Prettier**: Single tool for both linting and formatting, much faster.

### Scaling considerations
21. **`workers=4`** in production CMD: FastAPI runs with 4 Uvicorn workers by default. Adjust based on CPU count.
22. **Health check endpoint**: Always expose a simple `/health-check/` — used by Docker, load balancers, uptime monitors.
23. **Sentry integration**: Template already wires it in `main.py` — just set `SENTRY_DSN` in env to enable.
24. **Superuser vs regular user**: Role separation at the application layer (no RBAC library needed for simple cases). Extend `User.role` field for more granular permissions.
25. **Auto-generated frontend client**: Eliminates entire category of frontend-backend type mismatch bugs. Regenerate after any API change.
