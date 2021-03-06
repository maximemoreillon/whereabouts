const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const cors = require('cors')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const ws_auth = require('@moreillon/socketio_authentication_middleware')


dotenv.config()

const APP_PORT = process.env.APP_PORT || 80

const app = express()
const http_server = http.createServer(app)
const io = socketio(http_server)
exports.io = io

app.use(cors())
app.use(bodyParser.json())

// Express
const express_users_controller = require('./express_controllers/users.js')
const express_groups_controller = require('./express_controllers/groups.js')
const express_auth_controller = require('./express_controllers/auth.js')


app.get('/', (req, res) => {
  res.send({
    application_name: '行先掲示板',
    author: 'Maxime MOREILLON',
    version: require('./package.json').version,
    authentication_api_url: process.env.AUTHENTICATION_API_URL,
    group_manager_api_url: process.env.GROUP_MANAGER_API_URL,
    employee_manager_api_url: process.env.EMPLOYEE_MANAGER_API_URL,
  })
})


// For people updating themselves using a script or something else
app.route('/users/:user_id')
  .patch(express_users_controller.update_user)

app.route('/members/:user_id/groups')
  .get(express_groups_controller.get_groups_of_user)

app.route('/login')
  .post(express_auth_controller.login)

// Websockets
const ws_groups_controllers = require('./ws_controllers/groups.js')
const ws_auth_controllers = require('./ws_controllers/auth.js')

io.on('connection', (socket) => {
  console.log('[WS] a user connected')

  // This is too complex
  socket.use(ws_auth(socket, ws_auth_controllers.auth(socket)))

  socket.on('get_members_of_group', ws_groups_controllers.get_members_of_group(socket))
})

// Start listening
http_server.listen(APP_PORT, () => {
  console.log(`行先掲示板 Listening on *:${APP_PORT}`);
})
