"""
  __init.py
    Backend core
"""

from logging import exception
from multiprocessing.sharedctypes import Value
import __sql as db

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



def respond_to_client(socketio, json_response, sid):

    # Sends a socketio message to client
    res = db.json.dumps(json_response)
    socketio.emit('message', res, to=sid)



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

        r = {"connection": '200 OK'}
        json_response = db.json.dumps(r)
        socketio.emit('message', json_response, to=request.sid)

    # We received a request from a client
    if starts(data, '{'):

        message = db.json.loads(data)

        # Client wants to import datasets 
        if message['type'] == 'start_import':
            db.run_import(socketio, request.sid)


        # Send connection status 
        if message['type'] == 'check':

            r = {"check":{}}

            r["check"] = {
                "check": str(db.importing),
                "connected": str(db.connected)
            }
            respond_to_client(socketio, r, request.sid)


        # Client wants to connect to database
        if message['type'] == 'connect':
            
            x = message 

            host = x['host']
            _db = x['db']
            user = x['user']
            passw = x['p']

            db.mysql = [host, _db, user, passw]
            db.init_tables(socketio, request.sid)

            r = {"check":{}}

            r["check"] = {
                "check": str(db.importing),
                "connected": str(db.connected)
            }


        # Client landed on single station view
        if message['type'] == 'station_data':
            
            # Station ID 
            row = message['id']
            has_date = message['date']
            from_date = message['from']
            to_date = message['to']


            # Lets make sure client isn't doing an sql injection by modifying the link
            try: row = int(row)
            except ValueError: 
                return 

            # Station info 
            x = {"station_info":{}}
            query = "SELECT t.name, t.address, t.city, s.x, s.y FROM `city_stations` s " \
                        "LEFT JOIN `city_translations` t " \
                        "ON t.stationID = s.id " \
                        "AND t.languageID = 1 " \
                    "WHERE s.id = {}".format(row)
            
            results = db.exec_query(query, [], False, False)
            
            if results: 
                x["station_info"] = {
                    "name": results[0][0], 
                    "address": results[0][1], 
                    "city": results[0][2], 
                    "x": results[0][3], 
                    "y": results[0][4]
                }

            respond_to_client(socketio, x, request.sid)

            
            time_column = "`departure`"
            time_filter = ''
            if has_date: time_filter = " AND {} BETWEEN '{}' AND '{}' ".format(time_column, from_date, to_date)

            # Journeys to this station
            x = {"station_journeys_to":{}}
            query = "SELECT COUNT(id) AS num FROM `city_journeys` WHERE `return_station`= {}{};".format(row, time_filter)
            results = db.exec_query(query, [], False, False)

            if results: 
                for y in results: x["station_journeys_to"] = {"num": y[0]}
            respond_to_client(socketio, x, request.sid)


            # Journeys from this station
            x = {"station_journeys_from":{}}
            query = "SELECT COUNT(*) AS num FROM `city_journeys` WHERE `departure_station`= {}{};".format(row, time_filter)
            results = db.exec_query(query, [], False, False)

            if results: 
                for y in results: x["station_journeys_from"] = {"num": y[0]}
            respond_to_client(socketio, x, request.sid)


            time_column = "`departure`"
            time_filter = ''
            if has_date: time_filter = " AND {} BETWEEN '{}' AND '{}' ".format(time_column, from_date, to_date)

            # Average distance traveled to this station
            x = {"station_distance_to":{}}
            query = "SELECT SUM(distance) AS num FROM `city_journeys` WHERE `return_station`= {}{};".format(row, time_filter)
            results = db.exec_query(query, [], False, False)

            if results: 
                for y in results: x["station_distance_to"] = {"num": y[0]}
            respond_to_client(socketio, x, request.sid)


            time_column = "`return`"
            time_filter = ''
            if has_date: time_filter = " AND {} BETWEEN '{}' AND '{}' ".format(time_column, from_date, to_date)

            # Average distance traveled from this station
            x = {"station_distance_from":{}}
            query = "SELECT SUM(distance) AS num FROM `city_journeys` WHERE `departure_station`= {}{};".format(row, time_filter)
            results = db.exec_query(query, [], False, False)

            if results: 
                for y in results: x["station_distance_from"] = {"num": y[0]}
            respond_to_client(socketio, x, request.sid)

            
            time_column = "j.departure"
            time_filter = ''
            if has_date: time_filter = " AND {} BETWEEN '{}' AND '{}' ".format(time_column, from_date, to_date)

            # Most popular return stations starting here 
            query = "SELECT t.name, COUNT(j.id) AS num, t.stationID " \
                        "FROM `city_journeys` j " \
                        "LEFT JOIN `city_translations` t " \
                        "ON t.stationID = j.return_station " \
                        "AND t.languageID = 1 " \
                    "WHERE j.departure_station = {}{} ".format(row, time_filter) + \
                    "GROUP BY j.return_station " \
                    "ORDER BY num DESC LIMIT 5;"
            
            results = db.exec_query(query, [], False, False)

            total = 0
            r = {"station_popular_start":{}}

            if results: 
                for y in results: 
                    total += 1
                    r["station_popular_start"][total] = { "station_s": y[0], "count_s": y[1], "index": y[2] }
            
            respond_to_client(socketio, r, request.sid)
            
            
            time_column = "j.return"
            time_filter = ''
            if has_date: time_filter = " AND {} BETWEEN '{}' AND '{}' ".format(time_column, from_date, to_date)

            # Most popular departure stations ending here 
            query = "SELECT t.name, COUNT(j.id) AS num, t.stationID " \
                        "FROM `city_journeys` j " \
                        "LEFT JOIN `city_translations` t " \
                        "ON t.stationID = j.departure_station " \
                        "AND t.languageID = 1 " \
                    "WHERE j.return_station = {}{} ".format(row, time_filter) + \
                    "GROUP BY j.departure_station " \
                    "ORDER BY num DESC LIMIT 5;" \

            results = db.exec_query(query, [], False, False)

            total = 0
            r = {"station_popular_end":{}}

            if results: 
                for y in results: 
                    total += 1
                    r["station_popular_end"][total] = { "station_e": y[0], "count_e": y[1], "index": y[2] }
            
            respond_to_client(socketio, r, request.sid)

            # Notify that the request is handled
            y = {"done": {}}
            respond_to_client(socketio, y, request.sid)


        # Client wants a create a new station
        if message['type'] == 'new_station':

            # Station id & coords
            query = "INSERT INTO `city_stations` (`operator`, `x`, `y`) " \
                    "VALUES( %s, %s, %s )"

            params = [ 
                message['operator'],
                message['long'],
                message['lat']
            ]

            try:
                results = db.exec_query(query, params, False, True)
            except Exception as err:
                print(' [x] Error inserting journey:', str(err))
                respond_to_client(socketio, r, request.sid)
                return

            # Station translations
            query = "INSERT INTO `city_translations` " \
                    "(`stationID`, `languageID`, `name`, `address`, `city`) " \
                    "VALUES( %s, %s, %s, %s, %s )"

            params = [ 
                results,
                '1',
                message['name'],
                message['address'],
                message['city']
            ]

            try:
                results = db.exec_query(query, params)
            except Exception as err:
                print(' [x] Error inserting journey:', str(err))

                r = {"insertfail": str(err)}
                respond_to_client(socketio, r, request.sid)
                return

            r = {"inserted": '200'}
            respond_to_client(socketio, r, request.sid)


        # Client wants a create a new journey
        if message['type'] == 'new_journey':

            query = "INSERT INTO `city_journeys` " \
                    "(`departure`, `return`, `departure_station`, " \
                    "`return_station`, `distance`, `duration`) " \
                    "VALUES( %s, %s, %s, %s, %s, %s )"
            
            params = [ 
                message['dateOfDeparture'],
                message['dateOfReturn'],
                message['departure_station'],
                message['return_station'],
                message['distance'],
                message['duration']
            ]

            try:
                results = db.exec_query(query, params)
            except Exception as err:
                print(' [x] Error inserting journey:', str(err))

                r = {"insertfail": str(err)}
                respond_to_client(socketio, r, request.sid)
                return

            r = {"inserted": '200'}
            respond_to_client(socketio, r, request.sid)


        # Client wants a list of all stations  
        if message['type'] == 'list_stations':

            query = "SELECT t.name, s.id, s.x, s.y " \
                    "FROM `city_stations` s " \
                    "LEFT JOIN `city_translations` t " \
                    "ON t.stationID = s.id " \
                    "AND t.languageID=1 " \
                    "ORDER BY s.id ASC;"
            
            print('\n [#] Fetch - {}\n'.format(query))
            results = db.exec_query(query, [])

            # Notify if nothing was found
            if not results:
                r = {"null": '404'}
                respond_to_client(socketio, r, request.sid)
                return

            i = 0
            total = 0
            x = {"list_stations":{}}

            # Loop all results
            try:
                for row in results:
                    
                    i += 1
                    total += 1
                    idx = row[0]

                    # Append data into json array
                    x["list_stations"][total] = {
                        "id": idx,
                        "name": row[1],
                        "x": row[2],
                        "y": row[3]
                    }

                    # Echo data chunk to client
                    if i == 100:
                        respond_to_client(socketio, x, request.sid)

                        i = 0
                        x = {"list_stations":{}}
                
                # Send the rest, if there's something left
                if i:
                    respond_to_client(socketio, x, request.sid)

            except:
                r = {"null": '404'}
                respond_to_client(socketio, r, request.sid)
                return

            r = {"done": {}}
            respond_to_client(socketio, r, request.sid)

            print(' [#] Done')


        # Client wants stations data (list comp)
        if message['type'] == 'stations':
            
            x = message
            sort = x['sort']
            entries = x['limit']
            previous = x['prev']
            search = x['search']
            last_page = x['last']
            scrolled = x['scrolled']

            # Some scroll logic
            scrolled += 1
            show_entries = entries
            entries = (entries * scrolled)
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
                    
                print(' [#] Count query:', query)
                results = db.exec_query(query, query_params)

            else:
                query = "SELECT COUNT(*) AS num FROM `city_stations` s " \
                        "LEFT JOIN `city_translations` t " \
                        "ON s.id = t.stationID AND t.languageID=1 " \
                        "WHERE s.id > {}{} ;".format(
                            0, 
                            search_query.replace('WHERE', 'AND')
                        )

            print(' [#] Count query:', query)
            results = db.exec_query(query, query_params)
            
            # Inform client how many rows were returned
            if results:
                r = {"rows": results[0][0]}
                respond_to_client(socketio, r, request.sid)

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
                query = "SELECT * " \
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
                        "ORDER BY {} ASC;".format(column_sort)
            
            # Fetch
            print('\n [#] Fetch - {}\n'.format(query))
            results = db.exec_query(query, query_params)

            # Notify if nothing was found
            if not results:
                r = {"null": '404'}
                respond_to_client(socketio, r, request.sid)
                return

            i = 0
            total = 0
            first_id = -1
            x = {"stations":{}}

            # Loop all results
            try: 
                for row in results:

                    total += 1

                    # Logic for pagescrolling
                    if not last_page:
                        if(scrolled > 1) and (total <= (entries - show_entries)): 
                            continue
                    else: 
                        if(scrolled > 1) and (total > (entries - ((show_entries * scrolled) - show_entries ))): 
                            continue

                    i += 1
                    idx = row[0]

                    # Send client first rowID since they need it on some pagination functions
                    if first_id == -1 and not previous: 
                        first_id = idx
                        r = {"first": first_id}
                        respond_to_client(socketio, r, request.sid)
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
                        respond_to_client(socketio, x, request.sid)

                        i = 0
                        x = {"stations":{}}
                
                # Send the rest, if there's something left
                if i:
                    respond_to_client(socketio, x, request.sid)

            except:
                r = {"null": '404'}
                respond_to_client(socketio, r, request.sid)
                return

            # Client is going to a previous page, they need some data
            if previous:
                r = {"first": first_id}
                respond_to_client(socketio, r, request.sid)

            # Notify that the request is handled
            r = {"done": {}}
            respond_to_client(socketio, r, request.sid)

            print(' [#] Finished query for', request.sid)


        # Client wants journey data (list comp)
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

            # Some scroll logic
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

            if has_seconds and has_meters: 
                query_dur = ' AND j.duration {} {} '.format(measure, total_seconds)
            elif has_seconds: 
                query_dur = ' WHERE j.duration {} {} '.format(measure, total_seconds)

            # Search
            query_params = []
            search_query = ''

            if search:
                query_params = [f"{search}%", f"%{search}"]
                if not has_seconds and not has_meters and scrolled == 1:
                    search_query = " WHERE (t.name LIKE %s OR t.name LIKE %s) "
                else: search_query = " AND (t.name LIKE %s OR t.name LIKE %s) "

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

            results = db.exec_query(query, query_params)
            
            # Inform client how many rows were returned
            if results:
                r = {"rows": results[0][0]}
                respond_to_client(socketio, r, request.sid)

            # Sorting
            column_sort = 'j.id'
            if sort == 2: column_sort = 'j.departure_station'
            if sort == 3: column_sort = 'j.return_station'
            if sort == 4: column_sort = 'j.distance'
            if sort == 5: column_sort = 'j.duration'

            if not last_page:

                query = "SELECT j.id, t.name, tr.name, j.distance, j.duration, j.departure, s.x, s.y, sr.x, sr.y, s.id, sr.id, j.return_station " \
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
                query = "SELECT * " \
                        "FROM ( " \
                            "SELECT j.id, t.name, tr.name AS ret, j.distance, j.duration, j.departure, s.x, s.y, sr.x AS ret_x, sr.y AS ret_y, s.id AS s_id, sr.id AS ret_id, j.return_station " \
                            "FROM `city_journeys` j " \
                            "LEFT JOIN `city_translations` t " \
                            "ON t.stationID = j.departure_station AND t.languageID=1 " \
                            "LEFT JOIN `city_translations` tr " \
                            "ON tr.stationID = j.return_station AND tr.languageID=1 " \
                            "LEFT JOIN `city_stations` s " \
                            "ON s.id = t.stationID " \
                            "LEFT JOIN `city_stations` sr " \
                            "ON sr.id = tr.stationID " \
                            "{}{}{}ORDER BY {} DESC LIMIT {}".format(
                            query_dist, 
                            query_dur, 
                            search_query,
                            column_sort, 
                            entries) + \
                        ") j " \
                        "ORDER BY {} ASC;".format(column_sort)
            
            # Fetch
            print('\n [#] Fetch - {}\n'.format(query))
            results = db.exec_query(query, query_params)

            # Notify if nothing was found
            if not results:
                r = {"null": '404'}
                respond_to_client(socketio, r, request.sid)
                return

            i = 0
            total = 0
            first_id = -1
            x = {"journeys":{}}

            # Loop all results
            try: 
                for row in results:

                    total += 1

                    # Logic for pagescrolling
                    if not last_page:
                        if(scrolled > 1) and (total <= (entries - show_entries)): 
                            continue
                    else: 
                        if(scrolled > 1) and (total > (entries - ((show_entries * scrolled) - show_entries ))): 
                            continue

                    i += 1
                    idx = row[0]

                    # Send client first rowID since they need it on some pagination functions
                    if first_id == -1 :
                        first_id = idx
                        r = {"first": first_id}
                        respond_to_client(socketio, r, request.sid)
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
                        respond_to_client(socketio, x, request.sid)

                        i = 0
                        x = {"journeys":{}}

                # Send the rest, if there's something left
                if i:
                    respond_to_client(socketio, x, request.sid)

            except:
                r = {"null": '404'}
                respond_to_client(socketio, r, request.sid)
                return

            # Client is going to a previous page, they need some data
            if previous:
                r = {"first": first_id}
                respond_to_client(socketio, r, request.sid)

            # Notify that the request is handled
            r = {"done": {}}
            respond_to_client(socketio, r, request.sid)
            print(' [#] Finished query for', request.sid)



@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):

    path_dir = db.os.path.abspath("../build")
    if path != "" and db.os.path.exists(db.os.path.join(path_dir, path)):
        return send_from_directory(db.os.path.join(path_dir), path)
    else:
        return send_from_directory(db.os.path.join(path_dir),'index.html')



@app.errorhandler(404)   
def not_found(e):   
    return app.send_static_file('index.html')



def main():

    # init 
    # Check if we're running production & Gunicorn 
    prod = db.os.getenv('PRODUCTION')

    if not prod:
        port = 5000
        domain = 'localhost'
        print(' [#] __init:', domain, port)
        socketio.run(app, host=domain, port=port)

    print(' [#] __init production', prod)



if __name__ == '__main__':
    main()



# Called from docker since __name__ is not __main__
main()