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

$insertStatement = "INSERT INTO feedback (message, email) VALUES (?, ?)";
    try {
        $queryObj = $connection->prepare($insertStatement);
        $queryObj->execute([$inputs->message, $inputs->email]);
        $answer->message = "message received";
    } catch (PDOException $pe) {
        $answer->message = "database error";
    }

    

echo json_encode($answer);



// ---- helpers below ----
function evaluateInput($data) {
    $inputsToReturn = new stdClass();
    $inputsToReturn->message = $data->message;
    $inputsToReturn->email = $data->email;

    return $inputsToReturn;
}

?>