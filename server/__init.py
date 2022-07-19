"""
  __init.py
    Backend core
"""

import __sql as db

import json
from flask_socketio import SocketIO as sio
from flask import Flask, send_from_directory, request, jsonify




# Compiled React directory (<parent>/build)
static_index = '../build'

# Initialize the app
app = Flask(__name__)

# Set static folder as our compiled React project 
app = Flask(__name__, static_url_path='', static_folder=static_index)

# We actually need cors enabled
socketio = sio(app, async_mode='threading', cors_allowed_origins="*", async_handlers=True)



def starts(var, string):

    # String wrapper function
    # (if string starts with a substring)
    try:
        if var.startswith(string): return True
        else: return False
    except AttributeError as e:
        if var[0].startswith(string): return True
        else: return False



@socketio.on('disconnect', namespace='/')
def socket_disconnect():

    # Just for debug 
    print(' [#] Client disconnected:', request.sid)



@socketio.on('message')
def handle_message(data):

    # Listen for socket messages 
    # A client has connected to our webpage
    if starts(data, '[connection]'):
        print(' [#] Client loaded:', request.sid)

        # Send clients their needed data
        # Format our json data, round up some decimals
        x = {
            "connection": '200 OK'
        }

        json_response = json.dumps(x)

        # Echo the json back to client
        socketio.emit('message', json_response, to=request.sid)



@app.route("/app")
def serve():
    # Client landed, render the index
    return send_from_directory(app.static_folder, 'index.html')



def main():

    # init 
    port = 5000
    domain = 'localhost'

    # Create database tables
    db.init_tables()

    print(' [#] __init:', domain, port)
    socketio.run(app, host=domain, port=port)



if __name__ == '__main__':
    main()