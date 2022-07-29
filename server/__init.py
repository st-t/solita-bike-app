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

    # We received a request from a client
    if starts(data, '{'):

        message = json.loads(data)

        # Client wants stations data 
        if message['type'] == 'stations':
            
            x = message
            print("Got request for stations data")

            sort = x['sort']
            entries = x['limit']
            previous = x['prev']
            search = x['search']
            last_page = x['last']
            scrolled = x['scrolled']

            print('typeOf entries:', type(entries), 'typeOf scrolled:', type(scrolled))

            # Scroll logic
            scrolled += 1
            show_entries = entries
            if scrolled: entries = (entries * scrolled)
            else: entries = 0
            if(entries == 0): entries = show_entries

            # Res order
            order = 'ASC'

            # Search
            query_params = []
            search_query = ''

            if search:
                query_params = [search, f"{search}%", f"%{search}"]
                search_query = " WHERE (t.name = %s OR t.name LIKE %s OR t.name LIKE %s) "

            if not search:
                query = "SELECT COUNT(*) AS num FROM `city_stations`;"
                    
                print('count query:', query)
                results = db.exec_query(query, query_params)

            else:
                query = "SELECT COUNT(*) AS num FROM `city_stations` s " \
                        "LEFT JOIN `city_translations` t " \
                        "ON s.id = t.stationID AND t.languageID=1 " \
                        "WHERE s.id > {}{} ;".format(
                            0, 
                            search_query.replace('WHERE', 'AND')
                        )

            print('count query:', query)
            results = db.exec_query(query, query_params)
            
            # Inform client how many rows were returned
            if results:
                r = {"rows": results[0][0]}
                jr = json.dumps(r)
                socketio.emit('message', jr, to=request.sid)

            # Sorting
            column_sort = 's.id'
            if sort == 2: column_sort = 's.x'
            if sort == 3: column_sort = 's.y'

            # Language
            lang = " AND t.languageID=1 "

            if not last_page:

                query = "SELECT s.id, t.name, s.x, s.y " \
                        "FROM `city_stations` s " \
                        "LEFT JOIN `city_translations` t " \
                        "ON s.id = t.stationID {}" \
                        "{}ORDER BY {} {} LIMIT {} ;".format(
                            lang,
                            search_query,
                            column_sort, 
                            order, entries)
            else: 
                
                # Client wants to see the last page which becomes a bit funky 
                # fix count something stuff
                query = "SELECT s.id, t.name, s.x, s.y " \
                        "FROM ( " \
                            "SELECT s.id, t.name, s.x, s.y " \
                            "FROM `city_stations` s " \
                            "LEFT JOIN `city_translations` t " \
                            "ON s.id = t.stationID {}" \
                            "{}ORDER BY {} DESC LIMIT {} ".format(
                            lang,
                            search_query,
                            column_sort, 
                            entries) + \
                        ") s " \
                        "LEFT JOIN `city_translations` t " \
                        "ON s.id = t.stationID {}" \
                        "{}ORDER BY {} ASC LIMIT {} ".format(
                        lang,
                        search_query,
                        column_sort, 
                        entries)
            
            # Fetch
            print('\n{}\n'.format(query))
            results = db.exec_query(query, query_params)

            # Notify if nothing was found
            if not results:
                r = {"null": '404'}
                jr = json.dumps(r)
                socketio.emit('message', jr, to=request.sid)
                return

            i = 0
            total = 0
            first_id = -1
            x = {"stations":{}}

            # Loop all results
            for row in results:

                total += 1
                view_total = (entries - show_entries)

                # Logic for pagescrolling
                if not last_page:
                    if not ( total > view_total ): continue
                else: 
                    if ( total > view_total and view_total > 0 or total > show_entries ): continue

                i += 1
                idx = row[0]

                # Send client first rowID since they need it on some pagination functions
                if first_id == -1 and not previous: 
                    first_id = idx
                    r = {"first": first_id}
                    jr = json.dumps(r)
                    socketio.emit('message', jr, to=request.sid)
                else: 
                    first_id = idx

                # Append data into json array
                x["stations"][total] = {
                    "station": row[1],
                    "long": row[2],
                    "lat": row[3],
                    "id": idx
                }

                # Echo data chunk to client
                if i == 100:
                    journey_data = json.dumps(x)
                    socketio.emit('message', journey_data, to=request.sid)

                    i = 0
                    x = {"stations":{}}
            
            # Send the rest, if there's something left
            if i:
                journey_data = json.dumps(x)
                socketio.emit('message', journey_data, to=request.sid)

            # Client is going to a previous page, they need some data
            if previous:
                r = {"first": first_id}
                jr = json.dumps(r)
                socketio.emit('message', jr, to=request.sid)

            # Notify that the request is handled
            r = {"done": {}}
            jr = json.dumps(r)
            socketio.emit('message', jr, to=request.sid)
            print(' [#] Finished query for', request.sid)

        # Client wants journey data 
        if message['type'] == 'journeys':
            
            x = message
            sort = x['sort']
            entries = x['limit']
            previous = x['prev']
            search = x['search']
            last_page = x['last']
            scrolled = x['scrolled']
            has_meters = x['distance']['metersFilter']
            has_seconds = x['duration']['secondsFilter']
            total_meters = x['distance']['amount']
            total_seconds = x['duration']['amount']
            duration_over = x['duration']['over']
            distance_over = x['distance']['over']

            # Scroll logic
            scrolled += 1
            show_entries = entries
            entries = (entries * scrolled)
            if(entries == 0): entries = show_entries

            # Distance
            if has_meters:
                if x['distance']['unit'] == 'kilometers ':
                    total_meters = int(total_meters) * 1000

            # Duration
            if has_seconds:
                if x['duration']['unit'] == 'minutes ':
                    total_seconds = int(total_seconds) * 60
                elif x['duration']['unit'] == 'hours ':
                    total_seconds = (int(total_seconds) * 60) * 60

            # Res order
            order = 'ASC'

            # Distance
            measure = '>'
            query_dist = ''
            if distance_over: measure = '<'
            if has_meters: query_dist = ' WHERE j.distance {} {} '.format(measure, total_meters)
            
            # Duration
            measure = '>'
            query_dur = ''
            if duration_over: measure = '<'
            if has_seconds: 
                if has_meters: query_dur = ' AND j.duration {} {} '.format(measure, total_seconds)
                else: query_dur = ' WHERE j.duration {} {} '.format(measure, total_seconds)

            # Search
            query_params = []
            search_query = ''

            if search:
                query_params = [f"{search}%", f"{search}%", f"%{search}", f"%{search}"]
                if not has_seconds and not has_meters:
                    search_query = " WHERE (t.name LIKE %s OR tr.name LIKE %s OR t.name LIKE %s OR tr.name LIKE %s) "
                else: search_query = " AND (t.name LIKE %s OR tr.name LIKE %s OR t.name LIKE %s OR tr.name LIKE %s)  "

            # Send count to client since they need it 
            count_format = query_dist.replace('j.', '')
            count_format_2 = query_dur.replace('j.', '')

            if not search:
                query = "SELECT COUNT(*) AS num FROM `city_journeys` " \
                        "WHERE `id` > {}{}{}{} ;".format(
                            0, 
                            count_format.replace('WHERE', 'AND'), 
                            count_format_2.replace('WHERE', 'AND'),
                            search_query.replace('WHERE', 'AND')
                        )

            else:
                query = "SELECT COUNT(*) AS num FROM `city_journeys` j " \
                        "LEFT JOIN `city_translations` t " \
                        "ON t.stationID = j.departure_station AND t.languageID=1 " \
                        "LEFT JOIN `city_translations` tr " \
                        "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                        "WHERE `id` > {}{}{}{} ;".format(
                            0, 
                            count_format.replace('WHERE', 'AND'), 
                            count_format_2.replace('WHERE', 'AND'),
                            search_query.replace('WHERE', 'AND')
                        )

            print('count query:', query)
            results = db.exec_query(query, query_params)
            
            # Inform client how many rows were returned
            if results:
                r = {"rows": results[0][0]}
                jr = json.dumps(r)
                socketio.emit('message', jr, to=request.sid)

            # Sorting
            column_sort = 'j.id'
            if sort == 2: column_sort = 'j.departure_station'
            if sort == 3: column_sort = 'j.return_station'
            if sort == 4: column_sort = 'j.distance'
            if sort == 5: column_sort = 'j.duration'

            if not last_page:

                query = "SELECT j.id, t.name, tr.name, j.distance, j.duration, j.departure, s.x, s.y, sr.x, sr.y, s.id, sr.id " \
                        "FROM `city_journeys` j " \
                        "LEFT JOIN `city_translations` t " \
                        "ON t.stationID = j.departure_station AND t.languageID=1 " \
                        "LEFT JOIN `city_translations` tr " \
                        "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                        "LEFT JOIN `city_stations` s " \
                        "ON s.id = t.stationID " \
                        "LEFT JOIN `city_stations` sr " \
                        "ON sr.id = tr.stationID " \
                        "{}{}{}ORDER BY {} {} LIMIT {};".format(
                            query_dist, 
                            query_dur, 
                            search_query,
                            column_sort, 
                            order, entries)
            else: 
                
                # Client wants to see the last page which becomes a bit funky 
                query = "SELECT j.id, t.name, tr.name, j.distance, j.duration, j.departure, s.x, s.y, sr.x, sr.y, s.id, sr.id " \
                        "FROM ( " \
                            "SELECT j.* FROM `city_journeys` j " \
                            "LEFT JOIN `city_translations` t " \
                            "ON t.stationID = j.departure_station AND t.languageID=1 " \
                            "LEFT JOIN `city_translations` tr " \
                            "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                            "{}{}{}ORDER BY {} DESC LIMIT {}".format(
                            query_dist, 
                            query_dur, 
                            search_query,
                            column_sort, 
                            entries) + \
                        ") j " \
                        "LEFT JOIN `city_translations` t " \
                        "ON t.stationID = j.departure_station AND t.languageID=1 " \
                        "LEFT JOIN `city_translations` tr " \
                        "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                        "LEFT JOIN `city_stations` s " \
                        "ON s.id = t.stationID " \
                        "LEFT JOIN `city_stations` sr " \
                        "ON sr.id = tr.stationID " \
                        "ORDER BY {} ASC LIMIT {};".format(column_sort, entries)
            
            # Fetch
            print('\n{}\n'.format(query))
            results = db.exec_query(query, query_params)

            # Notify if nothing was found
            if not results:
                r = {"null": '404'}
                jr = json.dumps(r)
                socketio.emit('message', jr, to=request.sid)
                return

            i = 0
            total = 0
            first_id = -1
            x = {"journeys":{}}

            # Loop all results
            for row in results:

                total += 1
                view_total = (entries - show_entries)

                # Logic for pagescrolling
                if not last_page:
                    if not ( total > view_total ): continue
                else: 
                    if ( total > view_total and view_total > 0 or total > show_entries ): continue

                i += 1
                idx = row[0]

                # Send client first rowID since they need it on some pagination functions
                if first_id == -1 and not previous: 
                    first_id = idx
                    r = {"first": first_id}
                    jr = json.dumps(r)
                    socketio.emit('message', jr, to=request.sid)
                else: 
                    first_id = idx

                # Append data into json array
                x["journeys"][total] = {
                    "dstation": row[1],
                    "rstation": row[2],
                    "distance": row[3],
                    "duration": row[4],
                    "departure": str(row[5]),
                    "id": idx,
                    "d_x": row[6],
                    "d_y": row[7],
                    "r_x": row[8],
                    "r_y": row[9],
                    "d_id": row[10],
                    "r_id": row[11]
                }

                # Echo data chunk to client
                if i == 100:
                    journey_data = json.dumps(x)
                    socketio.emit('message', journey_data, to=request.sid)

                    i = 0
                    x = {"journeys":{}}
            
            # Send the rest, if there's something left
            if i:
                journey_data = json.dumps(x)
                socketio.emit('message', journey_data, to=request.sid)

            # Client is going to a previous page, they need some data
            if previous:
                r = {"first": first_id}
                jr = json.dumps(r)
                socketio.emit('message', jr, to=request.sid)

            # Notify that the request is handled
            r = {"done": {}}
            jr = json.dumps(r)
            socketio.emit('message', jr, to=request.sid)
            print(' [#] Finished query for', request.sid)



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