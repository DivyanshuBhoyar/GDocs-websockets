const { io } = require("./app");
const Document = require("./models/document");

const defaultValue = "";

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({
    _id: id,
    data: defaultValue,
  });
}

io.on("connection", (socket) => {
  console.log("connected");

  socket.on("get-document", async (documentId) => {
    console.log("find or get doc");
    const document = await findOrCreateDocument(documentId);

    socket.join(documentId); //joins the socket in the specific room
    console.log("got document", document);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      console.log("send changes", delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta); ///forward the changes to everyone except sender IN THE ROOM
    });

    socket.on("save-document", async (data) => {
      console.log("save request received");

      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});
