import React, { useEffect, useState, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { FONT_OPTIONS } from './Live-Editing Functionalities/quillFonts';

const TOOLBAR_OPTIONS = [
  [{ font: FONT_OPTIONS }], // Font options
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
];

const SAVE_INTERVAL_MS = 2000;

export default function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);

  // 🔹 Connect to Socket.io
  useEffect(() => {
    const s = io('http://localhost:3001'); // Update the port if needed
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // 🔹 Receive changes from other users and update Quill (Ensures real-time updates)
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      if (!quill || !delta || typeof delta !== 'object' || !delta.ops) return;

      try {
        quill.updateContents(delta, 'silent'); // 🔥 Ensures text updates in real-time
      } catch (error) {
        console.error("Error applying delta:", error);
      }
    };

    socket.on('receive-changes', handler);

    return () => {
      socket.off('receive-changes', handler);
    };
  }, [socket, quill]);

  // 🔹 Load document contents from server
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once('load-document', (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

  // 🔹 Save document periodically
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // 🔹 Handle text changes and send to server (Ensures real-time collaboration)
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
    };

    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [socket, quill]);

  // 🔹 Initialize Quill editor
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = '';

    const editor = document.createElement('div');
    wrapper.append(editor);

    const q = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    q.disable();
    q.setText('Loading...');
    setQuill(q);
  }, []);

  return (
    <div className="container">
      <div ref={wrapperRef}></div>
      <div>Document ID: {documentId}</div>
    </div>
  );
}
