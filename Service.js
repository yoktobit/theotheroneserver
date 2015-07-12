.pragma library

var logins = [{name: "Martin", password: "123456", key: ""}];
var users = {};
var rooms = [{name: "Raum1", id: 1, state: "init", users: [], drawings: [], tips: []}];
var games = [{subject1: "Stein", subject2: "Kartoffel"}];

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function getRandom(min, max) {
    if(min > max) {
        return -1;
    }

    if(min == max) {
        return min;
    }

    var r;

    do {
        r = Math.random();
    }
    while(r === 1.0);

    return min + parseInt(r * (max-min+1));
}


function clone(object)
{
    return JSON.parse(JSON.stringify(object));
}

function getRoom(room)
{
    for (var ii in rooms)
    {
        if (rooms[ii].id === room.id)
        {
            return rooms[ii];
        }
    }
}

function userDisconnected(webSocket)
{
    var user = users[webSocket];
    if (user)
    {
        for (var ii in rooms)
        {
            for (var jj in rooms[ii].users)
            {
                rooms[ii].users.splice(jj,1);
            }
        }
        delete user;
    }
}

function getLogin(username, password, key)
{
    for (var ii in logins)
    {
        if (username === logins[ii].name && (password === logins[ii].password || key === logins[ii].key))
        {
            return logins[ii];
        }
    }
    var newUser = {name: username, password: password, key: Date.now().toPrecision()};
    logins.push(newUser);
    return newUser;
}

function handleRequest(webSocket, request)
{
    console.log("Request: " + request);
    var content = JSON.parse(request);
    var response, user, room;
    if (content.method === "login")
    {
        user = getLogin(content.name, content.password, content.key);
        user.socket = webSocket;
        response = {method: "login", user: user};
        users[webSocket] = user;
        webSocket.sendTextMessage(JSON.stringify(response));
    }
    else if (content.method === "sendDrawing")
    {
        var drawing = content.drawing;
        user = users[webSocket];
        var newDrawing = {user: user, drawing: drawing};
        room = getRoom(content.room);
        room.drawings.push(newDrawing);
        console.log(JSON.stringify(room));
        response = {method: "sendDrawing", ok: true, room: room};
        webSocket.sendTextMessage(JSON.stringify(response));
    }
    else if (content.method === "getRooms")
    {
        response = {method: "getRooms", rooms: rooms};
        console.log("Response: " + JSON.stringify(response));
        webSocket.sendTextMessage(JSON.stringify(response));
    }
    else if (content.method === "getRoom")
    {
        room = getRoom(content.room);
        response = { method: "getRoom", room: room };
        webSocket.sendTextMessage(JSON.stringify(response));
    }
    else if (content.method === "enterRoom")
    {
        room = getRoom(content.room);
        room.users.push(users[webSocket]);
        /*response = {method: "enterRoom", room: room};
        var responseText = JSON.stringify(response);
        console.log("Response: " + responseText);
        webSocket.sendTextMessage(responseText);*/
        for (var ii in room.users)
        {
            response = {method: "enterRoom", room: room};
            room.users[ii].socket.sendTextMessage(JSON.stringify(response));
        }
    }
    else if (content.method === "startGame")
    {
        room = getRoom(content.room);
        room.state = "drawing";
        var randomPlayer = getRandom(0, room.users.length-1);
        console.log(randomPlayer);
        var subject1 = games[0].subject1;
        var subject2 = games[0].subject2;
        for (var ii in room.users)
        {
            room.users[ii].subject = (ii == randomPlayer) ? subject2 : subject1;
            console.log(ii + ". " + room.users[ii].name + ": " + room.users[ii].subject);
            response = {method: "startGame", room: room, subject: room.users[ii].subject};
            room.users[ii].socket.sendTextMessage(JSON.stringify(response));
        }
    }
    else if (content.method === "sendTip")
    {
        var tip = content.tip;
        user = users[webSocket];
        var newTip = {user: user, tip: tip};
        room = getRoom(content.room);
        room.tips.push(newTip);
        console.log(JSON.stringify(room));
        response = {method: "sendTip", ok: true, room: room};
        webSocket.sendTextMessage(JSON.stringify(response));
    }
}

