<?php

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");


$hostname = "localhost";
$username = "u208743485_beater";
$password = "N1@e5xWmdg&";
$database = "u208743485_beatburner";

$answer = new stdClass();

$answer->message = "";

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo "request mode must be POST";
    die();
}

$inputs = evaluateInput(json_decode(file_get_contents('php://input')));

try {
    $connection = new PDO("mysql:host=$hostname;dbname=$database", $username, $password);
    $answer->message = "connected successfully";
} catch (PDOException $pe) {
    $answer->message = "database error";
}

$getStatement = "SELECT * FROM sessions WHERE session_id=?";
try {
    $queryObj = $connection->prepare($getStatement);
    $queryObj->execute([$inputs->session]);
    $existingValues = $queryObj->fetchAll();
} catch (PDOException $pe) {
    $answer->message = "database error";
}

if (count($existingValues) > 1) {
    $answer->message = "ERROR multiple values in database";
    echo json_encode($answer);
    die();
}

if (count($existingValues) == 0) {

    $demo = 0;
    $upload = 0;
    $radio = 0;
    $stream = 0;
    if ($inputs->mode == "demo") {
        $demo = 1;
    }
    if ($inputs->mode == "upload") {
        $upload = 1;
    }
    if ($inputs->mode == "radio") {
        $radio = 1;
    }
    if ($inputs->mode == "stream") {
        $stream = 1;
    }

    $insertStatement = "INSERT INTO sessions (ip, session_id, demo, upload, radio, stream) VALUES (?, ?, ?, ?, ?, ?)";
    try {
        $queryObj = $connection->prepare($insertStatement);
        $queryObj->execute([$inputs->ip, $inputs->session, $demo, $upload, $radio, $stream]);
    } catch (PDOException $pe) {
        $answer->message = "database error";
    }

    $answer->message = "new session started";
    // $answer->inputs = $inputs;
    // $answer->ip = $ip;

} else {

    $oldModeAmt = $existingValues[0][$inputs->mode];
    $newModeAmt = $oldModeAmt + 1;

    $updateStatement = "UPDATE sessions SET {$inputs->mode}=? WHERE session_id=?";
    try {
        $queryObj = $connection->prepare($updateStatement);
        $queryObj->execute([$newModeAmt, $inputs->session]);
    } catch (PDOException $pe) {
        $answer->message = "database error";
    }

    $answer->message = "session updated";
}

echo json_encode($answer);



// ---- helpers below ----
function evaluateInput($data) {
    $inputsToReturn = new stdClass();
    $inputsToReturn->ip = getenv("REMOTE_ADDR");
    $inputsToReturn->session = $data->session;
    $inputsToReturn->mode = $data->mode;

    return $inputsToReturn;
}

?>