export default function TextEditor(props) {
  const [socket, setSocket] = useState(); //to access from anywhere in conponent
  const [quill, setQuill] = useState();
  const { id: documentId } = useParams();
  const defaultValue = " ";
  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s); //the created socket in useEffect is now made available anywhere by pushing it to state
    return () => {
      s.disconnect();
    };
  }, []); //runs only once

  useEffect(() => {
    //for each unique document, creating rooms
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable(); //enable the text editor as doc loaded
    });
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    q.disable();
    q.setText("Loading ...");
    setQuill(q); //same as setSocket(s)
  }, []); //empty dependency array means runs single time

  //receiving changes
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler); //.off() removes all handlers attached
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 3000);
    return () => clearInterval(interval);
  }, [socket, quill]);

  return <div ref={wrapperRef} className="container"></div>;
}

///=================================================================

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
