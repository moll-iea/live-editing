const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Document = require("./Document");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    },
});

// 🔹 Connect to MongoDB
mongoose.connect('mongodb+srv://cassleyannminaesquivel:AjwZfhlI9mibDfL3@basedroleprac.qoasd.mongodb.net/?retryWrites=true&w=majority&appName=BasedRolePrac', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

io.on('connection', (socket) => {
    console.log('✅ A user connected:', socket.id);

    socket.on('get-document', async (documentId) => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);

        if (!document.data || typeof document.data !== 'object' || !document.data.ops) {
            document.data = { ops: [] };
        }

        socket.emit('load-document', document.data);

        // 🔹 Ensure real-time updates
        socket.on('send-changes', (delta) => {
            if (!delta || typeof delta !== 'object' || !delta.ops) {
                console.error("⚠️ Invalid delta received:", delta);
                return;
            }
            console.log("📤 Broadcasting changes:", delta);
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        });

        // 🔹 Handle formatting changes
        socket.on('send-format', ({ format, range }) => {
            if (!format || !range) return;
            console.log("📤 Broadcasting format change:", format);
            socket.broadcast.to(documentId).emit('receive-format', { format, range });
          });

        // 🔹 Save document changes
        socket.on('save-document', async (data) => {
            if (data && typeof data === 'object' && data.ops) {
                await Document.findByIdAndUpdate(documentId, { data });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log("⚠️ User disconnected:", socket.id);
    });
});

async function findOrCreateDocument(id) {
    if (!id) return null;

    let document = await Document.findById(id);
    if (!document) {
        document = await Document.create({ _id: id, data: { ops: [] } });
    }
    return document;
}

// 🔹 Start server properly
server.listen(3001, () => {
    console.log("🚀 Server running on http://localhost:3001");
});
