const https = require('https')
const express = require('express')
const cors = require('cors')
const { readFileSync } = require('fs')
const { Server } = require('socket.io')
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 5001
const app = express()
const httpsOptions = {
    key: readFileSync('selfsigned.key'),
    cert: readFileSync('selfsigned.crt')
}
const server = https.createServer(httpsOptions, app)
const io = new Server(server, {
    cors: {
        origin: '*'
    }
})

app.use(cors({origin: '*'}))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send("This is a server page.")
})

let users = []

io.on('connection', socket => {
    console.log("User connected with id: ", socket.id)
    socket.emit('yourId', socket.id)

    socket.onAny((event, ...args) => console.log('Event: ', event))

    socket.on('ping', () => {
        socket.emit('pong')
    })

    if(users.filter(user => user.id === socket.id).length === 0) {
        users.push({id: socket.id})
        console.log('new user added')
    }
    io.emit('allUsers', users)

    socket.on('disconnect', () => {
        users = users.filter(user => user.id !== socket.id)
    })

    socket.on('callUser', data => {
        console.log('Call requested from ', data.from)
        io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from })
    })

    socket.on('acceptedCall', data => {
        console.log('Call accepted')
        io.to(data.to).emit('callAccepted', data.signal)
    })
})



server.listen(PORT, () =>  {
    console.log("listening at port ", PORT)
})