const express = require("express");
const fs = require("fs");
const cors = require('cors');
const app = express();
const jsonParser = express.json();
const MongoClient = require("mongodb").MongoClient; // импортируем из библиотеки MongoClient
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const accessTokenSecret = 'youraccesstokensecret';

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + "/public"));

const filePath = "appointments.json";

let dbClient; // объявляем dbClient, через который
let db;
let appointments;
let users;

// создаем объект mongoClient и передаем ему строку подключения
const mongoClient = new MongoClient("mongodb://localhost:27017/", { useUnifiedTopology: true });
mongoClient.connect((err, client) => {
    if (err) {
        return console.log("Ошибка подключения к Mongo", err);
    }
    dbClient = client; // чтобы можно было использовать dbClient за пределами этого коллбэка
    db = dbClient.db("mrs");
    appointments = db.collection("appointments");
    users = db.collection("users");

    // взаимодействие с базой данных
    // client.close(); // пока не закрываем подключение к базе
});

// промежуточная функция для проверки токена
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, accessTokenSecret, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

//логин
app.post('/api/login', async (req, res) => {
    // Read username and password from request body
    const { username, password } = req.body;

    // Filter user from the users array by username and password
    // const user = users.find(u => { return u.username === username && u.password === password });
    const user = await users.findOne({ username: username, password: password });

    if (user) {
        // Generate an access token
        const accessToken = jwt.sign({ username: user.username, role: user.role }, accessTokenSecret);

        res.json({
            accessToken
        });
    } else {
        res.send('Username or password incorrect');
    }
});

//получение всех пользователей
app.get("/api/appointments", authenticateJWT, (req, res) => {
    appointments.find({}).toArray((err, appointments) => {
        if (err) return console.log("Ошибка получения записей приёмов: ", err); // В случае ошибки ругаемся и выходим из функции
        res.send(appointments); // В случае успеха, отправляем полученные данные на фронт
    });
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