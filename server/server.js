const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://hatwaarbeta:mongo7038@devcluster0.hdvnq.mongodb.net/google_sockets?retryWrites=true&w=majority",
    {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(console.log("connected to atlas"));

const Document = require("./document");

const io = require("socket.io")(3001, {
  cors: {
    //since client runs on other port
    origin: "http://localhost:3000", //socketio only makes get and post
    methods: ["GET", "POST"],
  },
});
const defaultValue = "";
io.on("connection", (socket) => {
  console.log("connected");
  socket.on("get-document", (documentId) => {
    const document = findOrCreateDocument(documentId);
    socket.join(documentId); //joins the socket in the specific room
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      // console.log(delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta); ///forward the changes to everyone except sender IN THE ROOM
    });

    socket.on("save-document", async (data) => {
      console.log("save request received");
      console.log(data);
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({
    _id: id,
    data: defaultValue,
  });
}
