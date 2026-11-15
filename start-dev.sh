#!/usr/bin/env bash
set -u

export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
PROJECT_DIR="$HOME/store-site"
SERVER_DIR="$PROJECT_DIR/server"
TERMINAL="$(command -v ptyxis || true)"

fail() {
  printf 'Ошибка: %s\n' "$*" >&2
  exit 1
}

[[ -n "$TERMINAL" ]] || fail "Ptyxis не найден. Это настроенный терминал Luna Market."
for cmd in docker node npm codex curl ss; do
  command -v "$cmd" >/dev/null 2>&1 || fail "команда '$cmd' не найдена."
done
docker compose version >/dev/null 2>&1 || fail "Docker Compose недоступен."
[[ -d "$PROJECT_DIR" ]] || fail "папка проекта не найдена: $PROJECT_DIR"

open_window() {
  local title="$1" directory="$2" task="$3"
  "$TERMINAL" --new-window --working-directory="$directory" --title="$title" -- bash -lc "$task"
}

wait_until() {
  local label="$1" timeout="$2"; shift 2
  local deadline=$((SECONDS + timeout))
  until "$@"; do
    if (( SECONDS >= deadline )); then
      fail "$label не готов за ${timeout} секунд. Последовательность остановлена."
    fi
    sleep 1
  done
}

db_ready() {
  docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T postgres pg_isready -U luna_user -d luna_market >/dev/null 2>&1
}
port_available_for() {
  local port="$1" marker="$2" output pid args
  output="$(ss -H -ltnp "sport = :$port" 2>/dev/null || true)"
  [[ -n "$output" ]] || return 1
  while read -r pid; do
    [[ -r "/proc/$pid/cmdline" ]] || continue
    args="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
    [[ "$args" == *"$marker"* ]] && return 0
  done < <(grep -oE 'pid=[0-9]+' <<<"$output" | cut -d= -f2 | sort -u)
  fail "порт $port занят другим процессом. Ничего не завершал."
}
http_ready() { curl --silent --show-error --fail --max-time 2 "$1" >/dev/null 2>&1; }
express_ready() { port_available_for 3001 express-server.js; }

# 1. Docker / PostgreSQL — открывать окно при каждом запуске, как для остальных сервисов.
docker_task="cd '$PROJECT_DIR' || exit 1
docker compose up -d || { echo 'Ошибка: docker compose up -d завершилась неудачно.' >&2; exec bash -i; }
docker compose ps
if docker compose exec -T postgres pg_isready -U luna_user -d luna_market >/dev/null 2>&1; then
  echo 'PostgreSQL готов.'
else
  for i in {1..120}; do
    if docker compose exec -T postgres pg_isready -U luna_user -d luna_market >/dev/null 2>&1; then echo 'PostgreSQL готов.'; exec bash -i; fi
    sleep 1
  done
  echo 'Ошибка: PostgreSQL не стал готов за 120 секунд.' >&2
fi
exec bash -i"
open_window Docker "$PROJECT_DIR" "$docker_task" || fail "не удалось открыть терминал Docker."
wait_until "PostgreSQL" 120 db_ready

# 2. Express: запускать только при свободном порту; если уже слушает нужный сервер, переиспользовать.
if ! port_available_for 3001 express-server.js; then
  express_task="cd '$SERVER_DIR' || exit 1
node express-server.js
status=\$?
echo \"Express завершился (код \$status).\" >&2
exec bash -i"
  open_window Express "$SERVER_DIR" "$express_task" || fail "не удалось открыть терминал Express."
fi
wait_until "Express на порту 3001" 60 express_ready

# 3. Vite
if ! port_available_for 5173 vite; then
  vite_task="cd '$PROJECT_DIR' || exit 1
npm run dev -- --strictPort
status=\$?
echo \"Vite завершился (код \$status).\" >&2
exec bash -i"
  open_window Vite "$PROJECT_DIR" "$vite_task" || fail "не удалось открыть терминал Vite."
fi
wait_until "Vite на порту 5173" 60 http_ready http://127.0.0.1:5173/

# 4. Codex and 5. interactive shell
open_window Codex "$PROJECT_DIR" "cd '$PROJECT_DIR' || exit 1; exec codex" || fail "не удалось открыть терминал Codex."
open_window Terminal "$PROJECT_DIR" "cd '$PROJECT_DIR' || exit 1; exec bash -i" || fail "не удалось открыть пустой терминал."
