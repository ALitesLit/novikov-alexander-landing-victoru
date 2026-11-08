<?php

$path = rawurldecode(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH) ?: "/");
$root = dirname(__DIR__) . "/.local/modx";

if (
    str_contains($path, "\0") ||
    str_contains($path, "\\") ||
    preg_match("~^/(?:core|setup)(?:/|$)|(?:^|/)(?:\\.[^/]*|config\\.core\\.php)(?:/|$)~i", $path)
) {
    http_response_code(404);
    exit;
}

$file = $root . $path;

if (is_file($file)) {
    return false;
}

if (is_dir($file) && is_file(rtrim($file, "/") . "/index.php")) {
    return false;
}

require $root . "/index.php";
