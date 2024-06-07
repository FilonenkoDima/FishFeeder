let socket;
const messagesDiv = document.getElementById('messages');
const statusDiv = document.getElementById('status');

function connect() {
    socket = new WebSocket('ws://127.0.0.1:3000');

    socket.addEventListener('open', function (event) {
        statusDiv.textContent = 'Status: Connected';
    });

    socket.addEventListener('message', function (event) {
        console.log('Message from server ', event.data);
        const message = document.createElement('div');
        message.textContent = 'Received: ' + event.data;
        messagesDiv.appendChild(message);
    });

    socket.addEventListener('error', function (event) {
        statusDiv.textContent = 'Status: Error';
        console.log('WebSocket error: ', event);
    });

    socket.addEventListener('close', function (event) {
        statusDiv.textContent = 'Status: Disconnected';
        console.log('WebSocket closed: ', event);
    });
}

function disconnect() {
    if (socket) {
        socket.close();
    }
}
