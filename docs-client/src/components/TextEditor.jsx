import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import "quill/dist/quill.snow.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor() {
  const { id: documentId } = useParams(); // grab from url
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  // initializes the socket connection: runs first render
  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER_URI);
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  //--

  // disables quills and loads document first
  useEffect(() => {
    if (socket == null || quill == null) return;

    // only runs once
    socket.once("load-document", (document) => {
      console.log("loading doc0", document);
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // -

  // save doc request to server
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // --///
  // on new changes received
  useEffect(() => {
    if (socket == null || quill == null) return;
    socket.on("receive-changes", handleReceive);

    // a function to update page
    function handleReceive(delta) {
      console.log("received", delta);
      quill.updateContents(delta);
    }

    return () => {
      socket.off("receive-changes", handleReceive);
    };
  }, [socket, quill]);

  //--
  // on document change; emit to peers
  useEffect(() => {
    if (socket == null || quill == null) return;
    quill.on("text-change", handleLocalChange);

    function handleLocalChange(delta, oldDelta, source) {
      if (source !== "user") return;
      socket.emit("send-changes", delta); // emit the local changes to remote
    }
    return () => {
      quill.off("text-change", handleLocalChange);
    };
  }, [socket, quill]);
  //--

  /// create a quill instance and set
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";

    // create new dom ele and append to wrapper ref
    const editor = document.createElement("div");
    wrapper.append(editor);

    // initialise a new quill instance and set it
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);
  return <div className="container" ref={wrapperRef}></div>;
}
