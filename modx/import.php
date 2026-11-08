<?php

use MODX\Revolution\modResource;
use MODX\Revolution\modSystemSetting;
use MODX\Revolution\modTemplate;

if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);

if (!is_file($root . "/.local/modx/core/config/config.inc.php")) {
    fwrite(STDERR, "MODX не установлен. Запустите modx/setup.sh.\n");
    exit(1);
}


define("MODX_API_MODE", true);
require $root . "/.local/modx/index.php";

$modx->setLogLevel(1);

$save = static function ( $object ) {
    if (!$object->save()) {
        throw new RuntimeException("Не удалось сохранить " . get_class($object));
    }
};


$page = $modx->getObject(modResource::class, (int) $modx->getOption("site_start"));

if (!$page) {
    throw new RuntimeException("Не найдена главная страница MODX");
}

$firstImport = !$page->getProperty("imported", "donnu", false);

if ($firstImport) {
    $html = file_get_contents($root . "/index.html");

    if ($html === false || !preg_match("~<main\\b[^>]*>.*?</main\\s*>~si", $html, $match)) {
        throw new RuntimeException("В index.html не найдено содержимое страницы");
    }
}


if (!$modx->beginTransaction()) {
    throw new RuntimeException("Не удалось начать транзакцию импорта");
}

try {
    $template = $modx->getObject(modTemplate::class, [ "templatename" => "Памятник" ]);

    if (!$template) {
        $template = $modx->newObject(modTemplate::class);
    }

    $template->fromArray([
        "templatename" => "Памятник",
        "description" => "Шаблон страницы памятника",
        "static" => 1,
        "source" => 0,
        "static_file" => __DIR__ . "/template.html"
    ]);

    $save($template);


    $existingPage = (int) $page->get("template") === (int) $template->get("id")
        && trim($page->get("content")) !== "";

    if ($firstImport && !$existingPage) {
        $page->fromArray([
            "pagetitle" => "Памятник Виктору Проскурину",
            "longtitle" => "",
            "description" => "Тестовое Задание Новиков Александр",
            "alias" => "index",
            "template" => $template->get("id"),
            "content" => $match[0],
            "published" => 1,
            "richtext" => 0,
            "cacheable" => 0
        ]);

        foreach ([
            "site_name" => "Памятник Виктору Проскурину",
            "manager_language" => "ru",
            "cultureKey" => "ru",
            "default_template" => $template->get("id")
        ] as $key => $value) {
            $setting = $modx->getObject(modSystemSetting::class, [ "key" => $key ]);

            if (!$setting) {
                $setting = $modx->newObject(modSystemSetting::class);
                $setting->set("key", $key);
            }

            $setting->set("value", $value);
            $save($setting);
        }
    }

    if ($firstImport) {
        $page->setProperty("imported", true, "donnu");
        $save($page);
    }

    if (!$modx->commit()) {
        throw new RuntimeException("Не удалось завершить транзакцию импорта");
    }
} catch (Throwable $error) {
    $modx->rollBack();
    throw $error;
}

$modx->cacheManager->refresh();

echo $firstImport && !$existingPage ? "Страница импортирована в MODX.\n" : "Шаблон обновлён, содержимое страницы сохранено.\n";
