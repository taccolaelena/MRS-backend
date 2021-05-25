const express = require("express");
const fs = require("fs");
const cors = require('cors');
const app = express();
const jsonParser = express.json();

app.use(cors());
app.use(express.static(__dirname + "/public"));

const filePath = "appointments.json";

//получение всех пользователей
app.get("/api/appointments", function (req, res) {

    const content = fs.readFileSync(filePath, "utf8");

    const appointments = JSON.parse(content);
    res.send(appointments);
});

// получение одного пользователя по id
app.get("/api/appointments/:id", function (req, res) {

    const id = req.params.id; // получаем id
    const content = fs.readFileSync(filePath, "utf8");
    const appointments = JSON.parse(content);
    let user = null;
    // находим в массиве пользователя по id
    for (var i = 0; i < appointments.length; i++) {
        if (appointments[i].id == id) {
            user = appointments[i];
            break;
        }
    }
    // отправляем пользователя
    if (user) {
        res.send(user);
    }
    else {
        res.status(404).send();
    }
});

// получение отправленных данных
app.post("/api/appointments", jsonParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);

    const userName = req.body.name;
    const userAge = req.body.age;
    let user = { name: userName, age: userAge };

    let data = fs.readFileSync(filePath, "utf8");
    let appointments = JSON.parse(data);

    // находим максимальный id
    const id = Math.max.apply(Math, appointments.map(function (o) { return o.id; }))
    // увеличиваем его на единицу
    user.id = id + 1;
    // добавляем пользователя в массив
    appointments.push(user);
    data = JSON.stringify(appointments);
    // перезаписываем файл с новыми данными
    fs.writeFileSync("appointments.json", data);
    res.send(user);
});

// удаление пользователя по id
app.delete("/api/appointments/:id", function (req, res) {

    const id = req.params.id;
    let data = fs.readFileSync(filePath, "utf8");
    let appointments = JSON.parse(data);
    let index = -1;
    // находим индекс пользователя в массиве
    for (var i = 0; i < appointments.length; i++) {
        if (appointments[i].id == id) {
            index = i;
            break;
        }
    }
    if (index > -1) {
        // удаляем пользователя из массива по индексу
        const user = appointments.splice(index, 1)[0];
        data = JSON.stringify(appointments);
        fs.writeFileSync("appointments.json", data);
        // отправляем удаленного пользователя
        res.send(user);
    }
    else {
        res.status(404).send();
    }
});

// изменение пользователя
app.put("/api/appointments", jsonParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);

    const userId = req.body.id;
    const userName = req.body.name;
    const userAge = req.body.age;

    let data = fs.readFileSync(filePath, "utf8");
    const appointments = JSON.parse(data);
    let user;
    for (var i = 0; i < appointments.length; i++) {
        if (appointments[i].id == userId) {
            user = appointments[i];
            break;
        }
    }
    // изменяем данные у пользователя
    if (user) {
        user.age = userAge;
        user.name = userName;
        data = JSON.stringify(appointments);
        fs.writeFileSync("appointments.json", data);
        res.send(user);
    }
    else {
        res.status(404).send(user);
    }
});

app.listen(3001, () => {
    console.log("Сервер ожидает подключения...");
});