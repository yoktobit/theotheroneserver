import QtQuick 2.0
import QtQuick.Controls 1.3
import QtQuick.Window 2.2
import QtQuick.Dialogs 1.2
import Qt.WebSockets 1.0
import "Service.js" as Service

ApplicationWindow {
    title: qsTr("Hello World")
    width: 640
    height: 480
    visible: true

    menuBar: MenuBar {
        Menu {
            title: qsTr("&File")
            MenuItem {
                text: qsTr("E&xit")
                onTriggered: Qt.quit();
            }
        }
    }

    WebSocketServer {
        id: server
        listen: false
        onClientConnected: {
            console.log("Client connected");
            console.log("Address: " + server.url);
            console.log("Port: " + server.port);
            webSocket.onTextMessageReceived.connect(function(message) {
                Service.handleRequest(webSocket, message);
            });
            webSocket.onErrorStringChanged.connect(function() { console.log("WebSocket Error " + webSocket.errorString); });
            webSocket.onStatusChanged.connect(function() {
                console.log("WebSocket Status Changed to " + webSocket.status);
                if (webSocket.status === WebSocket.Closed)
                {
                    Service.userDisconnected(webSocket);
                }
            });
        }
        Component.onCompleted: {
            console.log("Open: " + WebSocket.Open);
            console.log("Closed: " + WebSocket.Closed);
            console.log("Closing: " + WebSocket.Closing);
            console.log("Connecting: " + WebSocket.Connecting);
            console.log("Error: " + WebSocket.Error);

            port = 51481;
            listen = true;
        }
    }
}
