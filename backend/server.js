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
    console.log('A user connected');
    socket.on('get-document', async (documentId) => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit('load-document', document.data);

        socket.on('send-changes', (delta) => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        });

        socket.on('save-document', async (data) => {
            await Document.findByIdAndUpdate(documentId, { data });
        });
    });
});

async function findOrCreateDocument(id) {
    if (id == null) return;

    const document = await Document.findById(id);
    if (document) return document;
    return await Document.create({ _id: id, data: { text: 'This is a new document.' } });  // Default value
}
