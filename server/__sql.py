"""
  __sql.py
    MySQL functions
"""

import codecs
from logging import exception
import pymysql
import json

mysql = []
importing = False 
connected = False 



def socket_send(socket, sid, r):

    """     
    socket_send()

    - parameters : (
            [object] socketio connection object
            [str] client sid
            [json] json object
        )
        
    - description : sends message to a client
    - return : none 
    """
    
    if socket: 
        res = json.dumps(r)
        socket.emit('message', res, to=sid)



def exec_query(query, args=[], batch=False, get_insert=False, socket=None, sid=None):

    """ 
    exec_query()

    - parameters : (
            [str] query to execute,
            [arr] array list of arguments
            [bool] are we executing a mass query?
            [object] socketio connection object
            [str] client sid
        )

    - description : executes a query to database
    - return : array of results, empty array if no results
    """
    global connected

    # Connect to database
    try:
        MySQLInit = pymysql.connect(
            host=mysql[0],
            user=mysql[2],
            passwd=mysql[3],
            database=mysql[1],
            charset="utf8mb4"
        )

        SQL_Query = MySQLInit.cursor()

    except Exception as err:
        print(' [x] Error connecting to MySQL Database:', err)

        r = {"error": str(err)}
        socket_send(socket, sid, r)
        return -1

    connected = True 

    try: 
        if not batch:
            SQL_Query.execute(query, args)
        else:
            SQL_Query.executemany(query, args)
    except Exception as err: 
        r = {"error": str(err)}
        socket_send(socket, sid, r)

        print(' [x] Error:', err)
        return -1

    MySQLInit.commit()

    try: results = SQL_Query.fetchall()
    except: results = 0

    # Returns last inserted rowid
    if get_insert: results = SQL_Query.lastrowid

    SQL_Query.close()
    return results



def scrape_stations(console_log=False, socket=None, sid=None):

    """ 
    scrape_stations()

    - parameters : (
            [bool] enable console logging (dev enviroment)
            [object] socketio connection object
            [str] client sid
        )

    - description : reads stations file and inserts data to database

    associated files (hardcoded since reading custom datasets goes beyond the purpose of this app) :
    'server/datasets/datasets/Helsingin_ja_Espoon_kaupunkipyöräasemat_avoin.csv'

    - return : none
    """

    # Lets make sure all languages exist in the database
    langs = ['fi', 'se', 'us']
    query = "SELECT * FROM `city_languages`;"
    languages = exec_query(query, [])

    # Languages don't exist => insert them 
    if len(languages) < 3:
        for x in langs:
            if not x in languages:
                socket_send(socket, sid, {"status": str('Inserted {} language row'.format(x))})
                query = "INSERT INTO `city_languages` (`language`) VALUES (%s);"
                exec_query(query, [x])

        # Fetch languages array as we need the IDs later
        query = "SELECT * FROM `city_languages`;"
        languages = exec_query(query, [])

    # Empty the table(s) before performing data import
    # Will throw an error if table is already empty so just pass that 
    try:
        query = "TRUNCATE TABLE `city_stations`;"
        exec_query(query, [])

        query = "TRUNCATE TABLE `city_translations`;"
        exec_query(query, [])
    except: pass

    i = 0
    station_names = []
    file = 'datasets/Helsingin_ja_Espoon_kaupunkipyöräasemat_avoin.csv'

    # Open with codecs to get special characters correct
    # Insert stations first since we have auto_increment 
    with codecs.open(file, encoding='utf') as lines:

        # Mass query data
        stations_batch = []
        socket_send(socket, sid, {"status": str('Processing stations dataset...')})

        for line in lines:
            
            # Fix some characters and split the data into an array
            line = line.rstrip()
            data = line.split(',')

            # If we have an usable array and skip first line
            if len(data) > 12:
                if not 'ID' in data[1]:
                    
                    # Fixes formatting longer names with commas such as "Aalto-yliopisto (M), Tietot"
                    for x in range(len(data)):
                        if x >= len(data): break
                        if data[x].startswith('"'):
                            data[x] = data[x] + data[x + 1]
                            del data[x + 1]

                    # For debugging 
                    if console_log:
                        print('\n \n id: {}'.format(data[1]),
                        '\n Nimi: {}'.format(data[2]),
                        '\n Namn: {}'.format(data[3]),
                        '\n Name: {}'.format(data[4]),
                        '\n Osoite: {}'.format(data[5]),
                        '\n Address: {} '.format(data[6]),
                        '\n Kaupunki: {}'.format(data[7]),
                        '\n Stad: {}'.format(data[8]),
                        '\n Operaattori: {}'.format(data[9]),
                        '\n x: {}'.format(data[11]),
                        '\n y: {}'.format(data[12]))

                    station_names.append(data[2])

                    # Append data for batch query
                    stations_batch.append( [
                        data[9], data[11], data[12]
                    ] )

            i += 1
            if i > 200:
                insert_station_batch(stations_batch, socket, sid)

                i = 0
                stations_batch = []

        # File ended, insert rest of the rows if we didn't do that already
        if not i == 0: insert_station_batch(stations_batch, socket, sid)

    # Fetch ids to insert translations, so it matches the increment 
    query = "SELECT id FROM `city_stations` ORDER BY id ASC;"
    query_res = exec_query(query, [])
    station_ids = []

    for x in query_res: station_ids.append(x[0])

    # Do translations next 
    with codecs.open(file, encoding='utf') as lines:

        # Mass query data
        i = 0
        translations_batch = []
        socket_send(socket, sid, {"status": str('Processing translations...')})

        for line in lines:
            
            # Fix some characters and split the data into an array
            line = line.rstrip()
            data = line.split(',')

            # If we have an usable array and skip first line
            if len(data) > 12:
                if not 'ID' in data[1]:
                    
                    # Fixes formatting longer names with commas such as "Aalto-yliopisto (M), Tietot"
                    for x in range(len(data)):
                        if x >= len(data): break
                        if data[x].startswith('"'):
                            data[x] = data[x] + data[x + 1]
                            del data[x + 1]

                    # Find correct station ID
                    station_id = station_names.index(data[2])
                    data[1] = station_ids[station_id]

                    for x in languages:
                        
                        # [0] == id
                        # [1] == lang
                        if x[1] == 'us':
                            translations_batch.append( [ 
                                data[1], x[0], data[4], data[5], data[7]
                            ] )
                        elif x[1] == 'se':
                            translations_batch.append( [ 
                                data[1], x[0], data[3], data[6], data[8]
                            ] )
                        elif x[1] == 'fi':
                            translations_batch.append( [ 
                                data[1], x[0], data[2], data[5], data[7]
                            ] )

            i += 1
            if i > 200:
                insert_translations_batch(translations_batch, socket, sid)
                i = 0
                translations_batch = []

        # File ended, insert rest of the rows if we didn't do that already
        if not i == 0: insert_translations_batch(translations_batch, socket, sid)



def insert_translations_batch(translations_batch, socket, sid):

    """ 
    insert_translations_batch()

    - parameters : (
            [array] array of query arguments
            [object] socketio connection object
            [str] client sid
        )

    - description : executes a batch query to database, called from scrape_stations()
    - return : none
    """

    # Insert station info
    query = "INSERT INTO `city_translations` " \
            "(`stationID`, `languageID`, `name`, `address`, `city`) " \
            "VALUES( %s, %s, %s, %s, %s )"

    exec_query(query, translations_batch, True)
    socket_send(socket, sid, {"status": str('Translation batch query successful...')})



def insert_station_batch(stations_batch, socket, sid):

    """ 
    insert_station_batch()

    - parameters : (
            [array] array of query arguments
            [object] socketio connection object
            [str] client sid
        )

    - description : executes a batch query to database, called from scrape_stations()
    - return : none
    """

    # Insert stations
    query = "INSERT INTO `city_stations` (`operator`, `x`, `y`) " \
            "VALUES( %s, %s, %s )"

    exec_query(query, stations_batch, True)
    socket_send(socket, sid, {"status": str('Stations batch query successful...')})



def scrape_journeys(console_log=False, socket=None, sid=None):
    
    """ 
    scrape_journeys()

    - parameters : (
            [bool] enable console logging (dev enviroment)
            [object] socketio connection object
            [str] client sid
    )

    - description :
    reads journey dataset(s), filters and inserts data to database
    this function will take a few minutes to execute (around 3 million rows & 3 files)

    - notes:
    associated files (hardcoded since reading custom datasets goes beyond the purpose of this app) :
    'server/datasets/datasets/2021-05.csv'
    'server/datasets/datasets/2021-06.csv'
    'server/datasets/datasets/2021-07.csv'

    datasets must fit in your memory to execute this function

    - return : none
    """

    # Empty the table before performing data import
    try:
        query = "TRUNCATE TABLE `city_journeys`;"
        exec_query(query, [])
    except: pass

    # Fetch stations array as we need the IDs for validating
    query = "SELECT s.id, t.name FROM `city_stations` s LEFT JOIN `city_translations` t ON s.id=t.stationID WHERE t.languageID=1;"
    query_res = exec_query(query, [])
    station_ids = []
    station_names = []

    for x in query_res:
        station_ids.append(x[0])
        station_names.append(x[1])

    i = 1
    queries = 0

    # Datasets 
    files = [
        'datasets/2021-05.csv',
        'datasets/2021-06.csv',
        'datasets/2021-07.csv'
    ]

    # Loop all files
    for file in files:

        socket_send(socket, sid, {"status": str('Processing file {} ...'.format(file))})

        # Open with codecs to get special characters correct
        # Also in reversed, since newest journeys start from the bottom
        with codecs.open(file, encoding='utf') as lines:
            
            # Mass query data
            journeys_batch = []

            for line in reversed(list(lines)):
                
                # Fix some characters and split the data into an array
                line = line.rstrip()
                data = line.split(',')

                # Set empty data to 0 to avoid errors 
                for x in range(len(data)):
                    if data[x] == '': data[x] = '0'

                # If we have an usable array and skip first line
                if len(data) > 7:
                    if not 'Departure' in data[0]:
                        
                        # Fixes formatting with some badly generated rows
                        for x in range(len(data)):
                            if x >= len(data): break

                            if data[x].startswith('"'):
                                if len(data) == 8: 
                                    # data[x] = data[x].replace('"', '')
                                    # data[x+2] = data[x+2].replace('"', '')
                                    data[x] = data[x] + data[x + 2]
                                    print('new data:', data[x])
                                    del data[x + 2]
                                else:
                                    data[x] = data[x] + data[x + 1]
                                    del data[x + 1]
                        
                        # For debugging
                        if console_log:
                            print('\n \n Departure: {}'.format(data[0]),
                            '\n Return: {}'.format(data[1]),
                            '\n Departure Station ID: {}'.format(data[2]),
                            '\n Departure Station: {}'.format(data[3]),
                            '\n Return Station ID: {}'.format(data[4]),
                            '\n Return Station: {}'.format(data[5]),
                            '\n Distance: {}'.format(data[6]),
                            '\n Duration: {}'.format(data[7]))

                        # Fix spaces 
                        data[3] = data[3].replace('\xa0', ' ')
                        data[5] = data[5].replace('\xa0', ' ')

                        # Fix station IDs, since we're using auto_increment 
                        try:
                            departure_id = station_names.index(data[3])
                            data[2]  = station_ids[departure_id]
                        except: 
                            # Station name is incorrect (datasets are bad), ignore it
                            # These stations don't exist in stations datasets: 
                            # Aalto-yliopisto (M) Korkeakouluaukio
                            # Outotec
                            # "Aalto-yliopisto (M) Tietotie"
                            # Mestarinkatu
                            # Lumivaarantie
                            # Haukilahdensolmu
                            # Maybe more... 
                            continue
                        
                        try: 
                            return_id = station_names.index(data[5])
                            data[4] = station_ids[return_id]
                        except: continue

                        # Filter journeys we don't want to import 
                        # Distance or duration is too low
                        if float(data[6]) < 10.0 or float(data[7]) < 10.0: 
                            continue 
                        
                        # Departure station is same as return station
                        # Skip these since we want to display a map with a route
                        if data[4] == data[2]:
                            continue

                        # This stationID does not exist
                        # The stations dataset did not include some stations, so skip them
                        if not( int(data[2]) in station_ids and int(data[4]) in station_ids ):
                            continue

                        # Append data for batch query
                        journeys_batch.append( [
                            data[0], data[1], data[2], 
                            data[4], data[6], data[7]
                        ] )

                i += 1

                # This is a larger dataset 
                # Let's not do too much at a time but enough for fast execution
                if i > 75000: 
                    i = 1
                    queries += 1
                    insert_journey_batch(journeys_batch, queries, socket, sid)
                    journeys_batch = []

            # Insert the rest if we didn't do that already
            if not i == 0: insert_journey_batch(journeys_batch, 0, socket, sid)

    print(' [#] Done.')



def insert_journey_batch(journeys_batch, queries, socket, sid):

    """ 
    insert_journey_batch()

    - parameters : (
            [array] array of query arguments
            [int] amount of queries we've done(for debugging)
            [object] socketio connection object
            [str] client sid
        )

    - description : executes a batch query to database, called from scrape_journeys()
    - return : none
    """

    query = "INSERT INTO `city_journeys` " \
            "(`departure`, `return`, `departure_station`, " \
            "`return_station`, `distance`, `duration`) " \
            "VALUES( %s, %s, %s, %s, %s, %s )"

    exec_query(query, journeys_batch, True)
    if not queries == 0: socket_send(socket, sid, {"status": str('Journey batch query successful: {} ...'.format(queries*75000))})



def init_tables(socket, sid):

    """     
    init_tables()

    - parameters : (
            [object] socketio connection object
            [str] client sid
        )

    - description : creates database table(s) 
    - return : none 
    """

    # Station coordinates 
    # Index x/y if we need to make searches on coordinate areas
    query = "CREATE TABLE IF NOT EXISTS `city_stations` " \
            "( " \
                "`id` INT(1) NOT NULL AUTO_INCREMENT, " \
                "`operator` VARCHAR(64), " \
                "`x` FLOAT(12), " \
                "`y` FLOAT(12), " \
                "PRIMARY KEY(`id`) USING BTREE, " \
                "INDEX (`x`, `y`) USING BTREE " \
            ") " \
            "COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;"

    if exec_query(query, [], False, False, socket, sid) == -1: return

    # Languages for station information
    # Language is defined by its ALPHA-2 code
    # Added as a seperate table since it never hurts to have faster queries
    query = "CREATE TABLE IF NOT EXISTS `city_languages` " +\
            "( " +\
                "`id` INT(1) NOT NULL AUTO_INCREMENT, " +\
                "`language` VARCHAR(3) NOT NULL, " +\
                "PRIMARY KEY(`id`) USING BTREE " \
            ") " +\
            "COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;"

    if exec_query(query, [], False, False, socket, sid) == -1: return

    # Station information 
    # Re-structured for possibility to add more languages
    # If a station is removed from city_stations, the table will remove translations of that station automatically
    query = "CREATE TABLE IF NOT EXISTS `city_translations` " +\
            "( " +\
                "`stationID` INT(1) NOT NULL, " +\
                "`languageID` INT(1) NOT NULL, " +\
                "`name` VARCHAR(64), " +\
                "`address` VARCHAR(64), " +\
                "`city` VARCHAR(64), " +\
                "INDEX (`name`) USING BTREE, " \
                "INDEX (`languageID`) USING BTREE, " \
                "INDEX `FK_station` (`stationID`) USING BTREE, " +\
                "INDEX (`stationID`, `languageID`) USING BTREE, " \
                "CONSTRAINT `FK_station` FOREIGN KEY (`stationID`) " \
                "REFERENCES `bike-app`.`city_stations` (`id`) ON DELETE CASCADE " \
            ") " +\
            "COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;"

    if exec_query(query, [], False, False, socket, sid) == -1: return

    # Journeys
    # We don't need to specify names here, since they're already in other table
    # Slapped indexes on each column cause its possible we need all of them, we can modify them later
    query = "CREATE TABLE IF NOT EXISTS `city_journeys` " \
            "( " \
                "`id` INT(1) NOT NULL AUTO_INCREMENT, " \
                "`departure` DATETIME NOT NULL, " \
                "`return` DATETIME NOT NULL, " \
                "`departure_station` INT(1) NOT NULL, " \
                "`return_station` INT(1) NOT NULL, " \
                "`distance` FLOAT(12) NOT NULL, " \
                "`duration` FLOAT(12) NOT NULL, " \
                "PRIMARY KEY(`id`) USING BTREE, " \
                "INDEX `stations` (`departure_station`, `return_station`) USING BTREE, " \
                "INDEX (`distance`) USING BTREE, " \
                "INDEX (`duration`) USING BTREE, " \
                "INDEX (`departure`) USING BTREE, " \
                "INDEX (`return`) USING BTREE " \
            ") " \
            "COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;"

    if exec_query(query, [], False, False, socket, sid) == -1: return
    socket_send(socket, sid, {"OK": str('200')})



def run_import(socket, sid):

    """     
    run_import()

    - parameters : (
            [object] socketio connection object
            [str] client sid
        )

    - description : starts dataset import by request
    - return : none 
    """

    global importing
    if(importing): return 

    importing = True 
    scrape_stations(False, socket, sid)
    scrape_journeys(False, socket, sid)
    socket_send(socket, sid, {"OK": str('200')})
    importing = False 