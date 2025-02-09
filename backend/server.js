const mongoose = require('mongoose');
const Document = require('./Document');
const io = require('socket.io')(3001, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    },
});

mongoose.connect('mongodb+srv://cassleyannminaesquivel:AjwZfhlI9mibDfL3@basedroleprac.qoasd.mongodb.net/?retryWrites=true&w=majority&appName=BasedRolePrac', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('get-document', async (documentId) => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);

        if (!document.data || typeof document.data !== 'object' || !document.data.ops) {
            document.data = { ops: [] };
        }

        socket.emit('load-document', document.data);

        // 🔹 Move these listeners outside to avoid duplicate event handlers
        socket.on('send-changes', (delta) => {
            if (!delta || typeof delta !== 'object' || !delta.ops) {
                console.error("Invalid delta received:", delta);
                return;
            }
            console.log("Broadcasting changes:", delta);
            socket.broadcast.to(documentId).emit('receive-changes', delta); // 🔥 Ensures real-time updates
        });

        socket.on('save-document', async (data) => {
            if (data && typeof data === 'object' && data.ops) {
                await Document.findByIdAndUpdate(documentId, { data });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log("User disconnected:", socket.id);
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
