let sockets = [];

function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("socket connected... id: " + socket.id);
    sockets.push(socket);

    socket.on("disconnect", () => {
      console.log("socket disconnected... id: " + socket.id);
      sockets = sockets.filter((s) => s.id !== socket.id);
    });
  });
}

function notifyClients(event, data) {
  sockets.forEach((socket) => {
    socket.emit(event, data);
  });
}

module.exports = { initSocket, notifyClients };
