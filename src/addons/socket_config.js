// Pull hostname from docker env vars 
let hostname = process.env.REACT_APP_HOSTNAME;

// If we aren't using docker, do localhost
if(!hostname) hostname = 'http://localhost:3000';
console.log('>> socket init ~ %s', hostname);


module.exports = {
    server: {
        url: hostname
    }
}