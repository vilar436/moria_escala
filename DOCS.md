
# Arquitetura do Sistema - Escala de Servos

## 1. Modelagem do Banco de Dados (PostgreSQL)

### Tabela: `users`
- `id`: UUID (Primary Key)
- `email`: TEXT (Unique)
- `name`: TEXT
- `avatar_url`: TEXT
- `role`: TEXT (Enum: 'ADMIN', 'SERVO')
- `created_at`: TIMESTAMP

### Tabela: `services` (Cultos)
- `id`: UUID (Primary Key)
- `date`: DATE
- `day_of_week`: TEXT (QUINTA, SABADO, DOMINGO)
- `is_open`: BOOLEAN (Default: true)
- `created_at`: TIMESTAMP

### Tabela: `assignments` (Escalas)
- `id`: UUID (Primary Key)
- `service_id`: UUID (Foreign Key -> services.id)
- `user_id`: UUID (Foreign Key -> users.id)
- `area`: TEXT (Enum: Recepção, Café, Coluna 1, Coluna 2, Abertura, Fundo)
- `created_at`: TIMESTAMP

## 2. Regras de Validação e Constraints
- **Unicidade de Inscrição**: Constraint `UNIQUE(service_id, user_id)` garante que um servo não se inscreva duas vezes no mesmo culto.
- **Área Única**: No frontend e backend, validamos que `area` pertença ao enum definido.
- **Status do Culto**: Inscrições só são permitidas se `services.is_open` for `true`.

## 3. Estrutura de Pastas Sugerida (Next.js App Router)
```text
/app
  /api
    /auth/[...nextauth]  -> Configuração Google Login
    /export              -> Endpoints para CSV/PDF
  /admin                 -> Dashboard administrativo
  /cultos                -> Listagem e detalhes
  layout.tsx
  page.tsx
/components
  /ui                    -> Botões, Inputs (Shadcn/Tailwind)
  ServiceCard.tsx
  RegistrationForm.tsx
  AdminTools.tsx
/lib
  supabase.ts            -> Cliente Supabase
  utils.ts               -> Helpers de data e formatação
/actions
  services.ts            -> Server Actions para CRUD de cultos
  assignments.ts         -> Server Actions para inscrições
```

## 4. Fluxo de UX
1. **Landing**: Login com Google.
2. **Home**: Lista de cultos disponíveis (cards com data e status).
3. **Detalhes do Culto**: 
   - Se aberto: Servo escolhe uma área e confirma.
   - Se fechado: Apenas visualização de quem está escalado.
4. **Admin**:
   - Botão "Gerar próximos cultos" (Automação).
   - Toggle "Abrir/Fechar Escala".
   - Botões de exportação.
