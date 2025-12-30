-- Tabela para persistir estado da Calculadora por usuário (histórico + memória)
create table if not exists public.user_calculator_state (
  user_id uuid primary key,
  history jsonb not null default '[]'::jsonb,
  memory numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_calculator_state enable row level security;

-- Policies: cada usuário só vê/edita o seu próprio estado
create policy "Users can view their own calculator state"
on public.user_calculator_state
for select
using (auth.uid() = user_id);

create policy "Users can insert their own calculator state"
on public.user_calculator_state
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own calculator state"
on public.user_calculator_state
for update
using (auth.uid() = user_id);

create policy "Users can delete their own calculator state"
on public.user_calculator_state
for delete
using (auth.uid() = user_id);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_user_calculator_state_updated_at on public.user_calculator_state;
create trigger trg_user_calculator_state_updated_at
before update on public.user_calculator_state
for each row execute function public.set_updated_at();

-- Índice opcional para consultas por updated_at (observabilidade)
create index if not exists idx_user_calculator_state_updated_at
  on public.user_calculator_state (updated_at desc);
