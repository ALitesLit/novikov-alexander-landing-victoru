#!/usr/bin/env bash
set -euo pipefail

source "$(dirname -- "${BASH_SOURCE[0]}")/environment.sh"

trap cleanup EXIT
trap 'exit 0' INT TERM

prepare_environment

if [[ ! -s "$runtime_dir/modx/core/config/config.inc.php" || ! -f "$runtime_dir/modx/index.php" ]]; then
    echo "MODX не установлен. Запустите modx/setup.sh." >&2
    exit 1
fi

start_database

echo "Сайт: http://127.0.0.1:8080/"
echo "Админка: http://127.0.0.1:8080/manager/"
echo "Доступы: $runtime_dir/access.json"
echo "Для остановки нажмите Ctrl+C."

"$php_bin" "${php_args[@]}" \
    -S 127.0.0.1:8080 -t "$runtime_dir/modx" "$project_dir/modx/router.php" &

php_pid=$!
wait "$php_pid"
