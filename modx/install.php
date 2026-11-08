<?php

use MODX\Revolution\modSystemSetting;

if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);
$runtime = $root . "/.local";

if ($argc === 2 && $argv[1] === "--finish") {
    define("MODX_API_MODE", true);
    require $runtime . "/modx/index.php";

    $setting = $modx->getObject(modSystemSetting::class, [ "key" => "photo_profile_source" ]);

    if (!$setting) {
        $setting = $modx->newObject(modSystemSetting::class);
        $setting->set("key", "photo_profile_source");
        $setting->fromArray([
            "value" => $modx->getOption("default_media_source"),
            "namespace" => "core",
            "area" => "manager",
            "xtype" => "modx-combo-source"
        ]);

        if (!$setting->save()) {
            throw new RuntimeException("Не удалось завершить установку настроек MODX");
        }
    }

    $modx->cacheManager->refresh();
    exit;
}

if ($argc !== 4) {
    fwrite(STDERR, "Запустите modx/setup.sh.\n");
    exit(1);
}

$accessFile = $runtime . "/access.json";

if (is_file($accessFile)) {
    $access = json_decode(file_get_contents($accessFile), true, 512, JSON_THROW_ON_ERROR);
} else {
    $access = [
        "site_url" => "http://127.0.0.1:8080/",
        "manager_url" => "http://127.0.0.1:8080/manager/",
        "username" => "aliteslit",
        "password" => bin2hex(random_bytes(24)),
        "email" => "admin@localhost.test",
        "database" => "test_donnu_modx",
        "database_user" => "donnu_modx",
        "database_password" => bin2hex(random_bytes(24))
    ];

    $file = fopen($accessFile, "x");

    if (!$file) {
        throw new RuntimeException("Не удалось создать файл доступов");
    }

    chmod($accessFile, 0600);
    fwrite($file, json_encode($access, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n");
    fclose($file);
}


foreach ([ "database", "database_user" ] as $key) {
    if (!preg_match("~^[a-zA-Z0-9_]+$~", $access[$key])) {
        throw new RuntimeException("Недопустимое имя базы или пользователя");
    }
}

$database = new mysqli("localhost", $argv[2], "", "", 0, $argv[1]);
$password = $database->real_escape_string($access["database_password"]);
$user = $access["database_user"];
$name = $access["database"];

$database->query("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$database->query("CREATE USER IF NOT EXISTS '$user'@'localhost' IDENTIFIED BY '$password'");
$database->query("GRANT ALL PRIVILEGES ON `$name`.* TO '$user'@'localhost'");


$config = simplexml_load_file($runtime . "/modx/setup/config.dist.new.xml");

foreach ([
    "database_server" => "localhost",
    "database" => $name,
    "database_user" => $user,
    "database_password" => $access["database_password"],
    "database_connection_charset" => "utf8mb4",
    "database_charset" => "utf8mb4",
    "database_collation" => "utf8mb4_unicode_ci",
    "http_host" => "127.0.0.1:8080",
    "language" => "ru",
    "cmsadmin" => $access["username"],
    "cmspassword" => $access["password"],
    "cmsadminemail" => $access["email"],
    "core_path" => $runtime . "/modx/core/",
    "context_mgr_path" => $runtime . "/modx/manager/",
    "context_mgr_url" => "/manager/",
    "context_connectors_path" => $runtime . "/modx/connectors/",
    "context_connectors_url" => "/connectors/",
    "context_web_path" => $runtime . "/modx/",
    "context_web_url" => "/",
    "remove_setup_directory" => "1"
] as $key => $value) {
    $config->$key = htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, "UTF-8");
}

if (!$config->asXML($argv[3])) {
    throw new RuntimeException("Не удалось создать конфигурацию установщика");
}

chmod($argv[3], 0600);
