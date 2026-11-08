#!/usr/bin/env bash
set -euo pipefail
umask 077

source "$(dirname -- "${BASH_SOURCE[0]}")/environment.sh"

trap cleanup EXIT
trap 'exit 0' INT TERM

prepare_environment
check_commands curl unzip mktemp mariadb-install-db
php_args+=(-d "display_errors=stderr")

if [[ -s "$runtime_dir/modx/core/config/config.inc.php" ]]; then
    echo "MODX уже установлен. Для запуска используйте modx/start.sh."
    exit 0
fi

if [[ -d "$runtime_dir/modx" && ! -f "$runtime_dir/modx/setup/index.php" ]]; then
    echo "Обнаружена незавершённая установка в .local/modx. Существующие файлы сохранены." >&2
    exit 1
fi

install_tmp="$(mktemp -d "$runtime_dir/tmp/setup.XXXXXXXX")"

if [[ ! -d "$runtime_dir/modx" ]]; then
    curl --fail --location --connect-timeout 15 --max-time 1800 \
        "https://modx.com/download/direct/modx-3.2.4-pl.zip" -o "$install_tmp/modx.zip"

    unzip -tq "$install_tmp/modx.zip" >/dev/null
    unzip -q "$install_tmp/modx.zip" -d "$install_tmp"
    mv "$install_tmp/modx-3.2.4-pl" "$runtime_dir/modx"
fi

if [[ ! -d "$runtime_dir/mariadb/mysql" ]]; then
    mariadb-install-db --no-defaults --basedir=/usr \
        --datadir="$runtime_dir/mariadb" \
        --auth-root-authentication-method=socket \
        --auth-root-socket-user="$(id -un)" \
        --skip-test-db --skip-name-resolve --tmpdir="$runtime_dir/tmp"
fi

start_database

"$php_bin" "${php_args[@]}" "$project_dir/modx/install.php" "$database_socket" "$(id -un)" "$install_tmp/config.xml"

"$php_bin" "${php_args[@]}" "$runtime_dir/modx/setup/index.php" \
    --installmode=new --config="$install_tmp/config.xml"

chmod 600 "$runtime_dir/modx/core/config/config.inc.php"

"$php_bin" "${php_args[@]}" "$project_dir/modx/install.php" --finish

for directory in css js static; do
    ln -s "$project_dir/$directory" "$runtime_dir/modx/$directory"
done

"$php_bin" "${php_args[@]}" "$project_dir/modx/import.php"

echo "MODX установлен. Запуск: $project_dir/modx/start.sh"
