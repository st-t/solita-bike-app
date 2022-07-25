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

        # Respond
        r = {"connection": '200 OK'}
        json_response = json.dumps(r)
        socketio.emit('message', json_response, to=request.sid)

    # Client requested journey data
    elif starts(data, '[journeys]') or starts(data, '[next]') or starts(data, '[last]'):
        
        print(' [#] Received a command from', request.sid)

        # Which page and how many entries to get 
        order = ''
        page_id = '0'
        entries = '100'
        data = data.split(' ')

        if starts(data, '[next]'): 
            page_id = str(data[1])
            entries = str(data[2])
        elif starts(data, '[journeys]'): 
            entries = str(data[1])
        elif starts(data, '[last]'): 
            order = 'DESC'
            entries = str(data[1])

        # "Normal" query 
        if not starts(data, '[last]'):
            query = "SELECT j.id, t.name, tr.name, j.distance, j.duration, j.departure " \
                    "FROM `city_journeys` j " \
                    "INNER JOIN `city_translations` t " \
                    "ON t.stationID = j.departure_station AND t.languageID=1 " \
                    "INNER JOIN `city_translations` tr " \
                    "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                    "WHERE j.id > %s ORDER BY j.id {} LIMIT {};".format(order, entries)
            
            results = db.exec_query(query, [page_id])

        # Client wants to see last page
        # This gets complicated since we need to subquery last N rows, and then sort them upside-down
        # We could sort them with python but I've decided to just create a longer query with double join since the query performance is good
        else: 
            query = "SELECT j.id, t.name, tr.name, j.distance, j.duration, j.departure " \
                    "FROM ( " \
                        "SELECT j.* FROM `city_journeys` j " \
                        "INNER JOIN `city_translations` t " \
                        "ON t.stationID = j.departure_station AND t.languageID=1 " \
                        "INNER JOIN `city_translations` tr " \
                        "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                        "ORDER BY j.id DESC LIMIT {}".format(entries) + \
                    ") j " \
                    "INNER JOIN `city_translations` t " \
                    "ON t.stationID = j.departure_station AND t.languageID=1 " \
                    "INNER JOIN `city_translations` tr " \
                    "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                    "ORDER BY j.id ASC LIMIT {};".format(entries)
            
            results = db.exec_query(query, [])


        if not results:
            print(' [#] No results.')

            r = {"null": '404'}
            json_response = json.dumps(r)
            socketio.emit('message', json_response, to=request.sid)
            return

        i = 0
        x = {"journeys":{}}

        # Loop all results
        for row in results:
            i += 1
            idx = row[0]

            # Append data into json array
            x["journeys"][idx] = {
                "dstation": row[1],
                "rstation": row[2],
                "distance": row[3],
                "duration": row[4],
                "departure": str(row[5])
            }

            # Echo data chunk to client
            if i == 100:
                journey_data = json.dumps(x)
                socketio.emit('message', journey_data, to=request.sid)

                i = 0
                x = {"journeys":{}}
        
        if i:
            journey_data = json.dumps(x)
            socketio.emit('message', journey_data, to=request.sid)

        print(' [#] Finished query for', request.sid)

    # We received json data
    if starts(data, '{'):
        print('got: ', data)



@app.route("/")
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