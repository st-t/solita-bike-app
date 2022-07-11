import config from './socket_config';

const io = require("socket.io-client");
let socket = io.connect(config.server.url, {reconnection: true});

export default socket;