<?php
$handle = fopen("mapinfo.txt", "rb");

$maps = [];

    while (($line = fgets($handle)) !== false) {
        $line = trim($line);
        $lineParts = explode("\t", $line);
        $maps[$lineParts[0]] = $lineParts[1];
    }

    fclose($handle);

file_put_contents('../app/mapinfo.json', json_encode($maps, JSON_PRETTY_PRINT));
