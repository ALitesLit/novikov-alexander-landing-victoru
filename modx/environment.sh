#!/usr/bin/env bash

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
runtime_dir="$project_dir/.local"
database_started=0

check_commands() {
    local missing=()

    for command in "$@"; do
        command -v "$command" >/dev/null 2>&1 || missing+=("$command")
    done

    if ((${#missing[@]})); then
        echo "Не найдены команды: ${missing[*]}. Установите их перед запуском." >&2
        return 1
    fi
}

prepare_environment() {
    check_commands realpath sha256sum id flock mariadb mariadb-admin mariadbd

    mkdir -p "$runtime_dir/run" "$runtime_dir/tmp" "$runtime_dir/log" "$runtime_dir/sessions"

    local instance_id
    instance_id="$(printf '%s' "$(realpath "$runtime_dir")" | sha256sum)"
    socket_dir="/tmp/modx-$(id -u)-${instance_id:0:16}"
    database_socket="$socket_dir/db.sock"

    mkdir -p "$socket_dir"
    chmod 700 "$socket_dir"

    exec 9>"$runtime_dir/run/start.lock"
    flock -n 9 || { echo "Это окружение MODX уже запущено." >&2; return 1; }

    php_args=()

    if [[ -x "$runtime_dir/php/usr/bin/php" ]]; then
        php_bin="$runtime_dir/php/usr/bin/php"
        export PHP_INI_SCAN_DIR="$runtime_dir/php/etc/php.d"
        php_args+=(-d "extension_dir=$runtime_dir/php/usr/lib64/php/modules")
    elif command -v php >/dev/null 2>&1; then
        php_bin="$(command -v php)"
    else
        echo "Нужен PHP 8.1+ с curl, dom, fileinfo, gd, mbstring, mysqli, pdo_mysql, simplexml, xml, xmlwriter и zip." >&2
        return 1
    fi

    php_args+=(
        -d "pdo_mysql.default_socket=$database_socket"
        -d "mysqli.default_socket=$database_socket"
        -d "session.save_path=$runtime_dir/sessions"
        -d "upload_tmp_dir=$runtime_dir/tmp"
        -d "sys_temp_dir=$runtime_dir/tmp"
        -d "error_log=$runtime_dir/log/php.log"
        -d "date.timezone=Europe/Moscow"
        -d "memory_limit=256M"
        -d "upload_max_filesize=32M"
        -d "post_max_size=40M"
        -d "log_errors=1"
        -d "display_errors=0"
        -d "expose_php=0"
    )

    "$php_bin" "${php_args[@]}" -r '
        $required = ["curl", "dom", "fileinfo", "gd", "json", "mbstring", "mysqli", "pdo_mysql", "simplexml", "xml", "xmlwriter", "zip", "zlib"];
        $missing = array_filter($required, static fn ($name) => !extension_loaded($name));
        if (version_compare(PHP_VERSION, "8.1", "<") || $missing) {
            fwrite(STDERR, "Нужен PHP 8.1+. Отсутствующие расширения: " . implode(", ", $missing) . PHP_EOL);
            exit(1);
        }
    '
}


start_database() {
    if [[ ! -d "$runtime_dir/mariadb/mysql" ]]; then
        echo "База проекта не подготовлена. Запустите modx/setup.sh." >&2
        return 1
    fi

    if ! mariadb-admin --no-defaults --socket="$database_socket" --user="$(id -un)" ping >/dev/null 2>&1; then
        mariadbd --no-defaults \
            --datadir="$runtime_dir/mariadb" \
            --socket="$database_socket" \
            --pid-file="$runtime_dir/run/mariadb.pid" \
            --skip-networking \
            --tmpdir="$runtime_dir/tmp" \
            --log-error="$runtime_dir/log/mariadb.log" &

        database_pid=$!
        database_started=1

        for attempt in {1..50}; do
            if mariadb-admin --no-defaults --socket="$database_socket" --user="$(id -un)" ping >/dev/null 2>&1; then
                break
            fi

            kill -0 "$database_pid" 2>/dev/null || return 1
            sleep 0.2
        done
    fi

    local actual_directory
    actual_directory="$(mariadb --no-defaults --socket="$database_socket" --user="$(id -un)" -N -e 'SELECT @@datadir')"

    if [[ "$(realpath "$actual_directory")" != "$(realpath "$runtime_dir/mariadb")" ]]; then
        echo "Сокет занят другой базой. Запуск остановлен." >&2
        return 1
    fi
}

cleanup() {
    trap - EXIT INT TERM

    if [[ -n "${php_pid:-}" ]]; then
        kill "$php_pid" 2>/dev/null || true
        wait "$php_pid" 2>/dev/null || true
    fi

    if [[ "$database_started" == 1 ]]; then
        kill "$database_pid" 2>/dev/null || true
        wait "$database_pid" 2>/dev/null || true
    fi

    if [[ -n "${install_tmp:-}" ]]; then
        rm -rf -- "$install_tmp"
    fi
}

