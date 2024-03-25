<?php

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");


$hostname = "localhost";
$username = "u208743485_beater";
$password = "N1@e5xWmdg&";
$database = "u208743485_beatburner";

$answer = new stdClass();

$answer->message = "";
$answer->value = "";

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo "request mode must be POST";
    die();
}

$inputs = evaluateInput(json_decode(file_get_contents('php://input')));

if (!isset($inputs->action)) {
    echo ("no action specified");
    die();
}

try {
    $connection = new PDO("mysql:host=$hostname;dbname=$database", $username, $password);
    $answer->message = "connected successfully";
} catch (PDOException $pe) {
    $answer->message = "database error";
}


$getStatement = "SELECT * FROM connect WHERE name=?";
try {
    $queryObj = $connection->prepare($getStatement);
    $queryObj->execute([$inputs->name]);
    $existingValues = $queryObj->fetchAll();
} catch (PDOException $pe) {
    $answer->message = "database error";
}

if (count($existingValues) > 1) {
    $answer->message = "ERROR multiple values in database";
    echo json_encode($answer);
    die();
}

if ($inputs->action == "retrieve") {
    if (count($existingValues) == 1) {
        $answer->value = $existingValues[0]["value"];
        $answer->message = "successfully retrieved";
    } else {
        $answer->message = "not found";
        echo json_encode($answer);
        die();
    }
} else if (count($existingValues) == 1){
    $setStatement = "UPDATE connect SET value=? WHERE name=?";
    try {

        $queryObj = $connection->prepare($setStatement);
        $queryObj->execute([$inputs->value, $inputs->name]);
    } catch (PDOException $pe) {
        $answer->message = "database error";
        die();
    }
    $answer->message = "successfully updated";
    $answer->value = $inputs->value;
} else {
    $insertStatement = "INSERT INTO connect (name, value) VALUES (?, ?)";
    try {

        $queryObj = $connection->prepare($insertStatement);
        $queryObj->execute([$inputs->name, $inputs->value]);
    } catch (PDOException $pe) {
        $answer->message = "database error";
        die();
    }
    $answer->message = "successfully set new value";
    $answer->value = $inputs->value;
}

// ---- end ----
echo json_encode($answer);

// ---- helpers below ----
function evaluateInput($data) {
    if ($data->action == "retrieve") {
        if (checkTypes([
            [$data->name, "string"]
        ])) {
            // SUCCESS
            $usefulInput = new stdClass();
            $usefulInput->action = "retrieve";
            $usefulInput->name = $data->name;

            return $usefulInput;
        } else {
            echo "invalid";
            die();
        }
    } else if ($data->action == "set") {
        if (checkTypes([
            [$data->name, "string"],
            [$data->value, "string"]
        ])) {
            // SUCCESS
            $usefulInput = new stdClass();
            $usefulInput->action = "set";
            $usefulInput->name = $data->name;
            $usefulInput->value = $data->value;

            return $usefulInput;
        } else {
            echo "invalid";
            die();
        }
    } else {
        echo "action must be set or retrieve";
        die();
    }
}

function checkTypes($valueTypePair) {
    foreach($valueTypePair as $pair) {
        if (!gettype($pair[0] !== $pair[1])) {
            return false;
        }
    }
    return true;
}

?>