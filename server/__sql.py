"""
  __sql.py
    MySQL functions
"""

import pymysql



def exec_query(query, args=[], batch=False):

    """ 
    exec_query()

    - parameters : (
            [str] query to execute,
            [arr] array list of arguments
            [bool] are we executing a mass query?
        )

    - description : executes a query to database
    - return : array of results, empty array if no results
    """
    
    # Connect to database
    try:
        MySQLInit = pymysql.connect(
            host="",
            user="",
            passwd="",
            database="",
            charset="utf8mb4"
        )

        SQL_Query = MySQLInit.cursor()

    except:
        print(' [x] Error connecting to MySQL Database')
        return

    # Execute and commit the query
    if not batch:
        SQL_Query.execute(query, args)
    else:
        SQL_Query.executemany(query, args)

    MySQLInit.commit()

    # Close the handle and return results
    results = SQL_Query.fetchall()
    SQL_Query.close()
    return results



def scrape_stations(console_log=False):

    """ 
    scrape_stations()

    - parameters : (
            [bool] enable console logging (dev enviroment)
        )

    - description : reads stations file and inserts data to database
    - return : none
    """

    # Empty the table(s) before performing data import
    query = "TRUNCATE TABLE `city_stations`;"
    exec_query(query, [])

    query = "TRUNCATE TABLE `city_translations`;"
    exec_query(query, [])

    i = 0
    file = 'datasets/Helsingin_ja_Espoon_kaupunkipyöräasemat_avoin.csv'

    with open(file) as lines:

        # Mass query data
        stations_batch = []
        translations_batch = []

        for line in lines:
            
            # Fix some characters and split the data into an array
            line = line.rstrip()
            line = line.replace('Ã¤', 'ä')
            data = line.split(',')

            # If we have an usable array and skip first line
            if len(data) > 12:
                if not 'ID' in data[1]:

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

                    # Append data for batch query
                    stations_batch.append( [
                        data[1], data[9], data[11], data[12]
                    ] )

                    translations_batch.append( [ 
                        data[1], data[4], data[3], data[2],
                        data[6], data[5], data[8], data[7]
                    ] )

            i += 1

            # Insert in batch of 100
            if i > 100: 
                insert_station_batch(stations_batch, translations_batch)

                i = 0
                stations_batch = []
                translations_batch = []

        # File ended, insert rest of the rows if we didn't do that already
        if not i == 0: insert_station_batch(stations_batch, translations_batch)



def insert_station_batch(stations_batch, translations_batch):

    """ 
    insert_station_batch()

    - parameters : (
            [array] array of query arguments
            [array] array of query arguments
        )

    - description : executes a batch query to database, called from scrape_stations()
    - return : none
    """

    # Insert stations
    query = "INSERT INTO `city_stations` (`id`, `operator`, `x`, `y`) " \
            "VALUES( %s, %s, %s, %s )"

    exec_query(query, stations_batch, True)

    # Insert station info
    query = "INSERT INTO `city_translations` " \
            "(`stationID`, `name_en`, `name_swe`, `name_fi`, " \
            "`address_swe`, `address_fi`, `city_swe`, `city_fi`) " \
            "VALUES( %s, %s, %s, %s, %s, %s, %s, %s )"

    exec_query(query, translations_batch, True)
    print(' [#] Batch query successful')



def scrape_journeys(console_log=False):
    
    """ 
    scrape_journeys()

    - parameters : (
            [bool] enable console logging (dev enviroment)
    )

    - description :
    reads journey dataset(s), filters and inserts data to database
    this function will take a few minutes to execute (around 3 million rows)

    - return : none
    """

    # Empty the table before performing data import
    query = "TRUNCATE TABLE `city_journeys`;"
    exec_query(query, [])

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

        print(' [#] Processing file', file, '...')

        with open(file) as lines:

            distance = 0
            duration = 0
            return_station_id = 4
            journeys_batch = []
            return_station = ''
            departure_station = ''

            for line in lines:
                
                # Fix some characters and split the data into an array
                line = line.rstrip()
                line = line.replace('Ã¤', 'ä')
                data = line.split(',')

                # Set empty data to 0 to avoid errors 
                for x in range(len(data)):
                    if data[x] == '': data[x] = 0

                # If we have an usable array and skip first line
                if len(data) > 7:
                    if not 'Departure' in data[0]:
                        
                        # Fix some array index formatting with extra commas
                        # Source: trust me bro
                        if len(data) == 9:

                            distance = 7
                            duration = 8
                            return_station_id = 5

                            departure_station = data[3]
                            return_station = data[5] + data[6]
                            return_station = return_station.replace('"', '')

                        elif len(data) == 8: 

                            distance = 6
                            duration = 7
                            return_station_id = 4

                            return_station = data[5]
                            departure_station = data[3]

                        elif len(data) == 10:
                            
                            distance = 8
                            duration = 9
                            return_station_id = 5

                            departure_station = data[3] + data[4]
                            departure_station = departure_station.replace('"', '')
                            return_station = data[6] + data[7]
                            return_station = return_station.replace('"', '')
                        
                        # For debugging
                        if console_log:
                            print('\n \n Departure: {}'.format(data[0]),
                            '\n Return: {}'.format(data[1]),
                            '\n Departure Station ID: {}'.format(data[2]),
                            '\n Departure Station: {}'.format(departure_station),
                            '\n Return Station ID: {}'.format(data[return_station_id]),
                            '\n Return Station: {}'.format(return_station),
                            '\n Distance: {}'.format(data[distance]),
                            '\n Duration: {}'.format(data[duration]))

                            print('len:', len(data))
                        
                        # Filter journeys we don't want to import 
                        if float(data[duration]) < 10.0 or float(data[distance]) < 10.0: 
                            continue 

                        # Append data for batch query
                        journeys_batch.append( [
                            data[0], data[1], data[2], 
                            data[return_station_id], data[distance], data[duration]
                        ] )

                i += 1

                # This is a larger dataset 
                # Let's not do too much at a time
                if i > 75000: 
                    i = 1
                    queries += 1
                    insert_journey_batch(journeys_batch, queries)
                    journeys_batch = []

            # Insert the rest if we didn't do that already
            if not i == 0: insert_journey_batch(journeys_batch, 0)

    print(' [#] Done.')



def insert_journey_batch(journeys_batch, queries):

    """ 
    insert_journey_batch()

    - parameters : (
            [array] array of query arguments
            [int] amount of queries we've done(for debugging)
        )

    - description : executes a batch query to database, called from scrape_journeys()
    - return : none
    """

    # Insert stations
    query = "INSERT INTO `city_journeys` " \
            "(`departure`, `return`, `departure_station`, `return_station`, " \
            "`distance`, `duration`) " \
            "VALUES( %s, %s, %s, %s, %s, %s )"

    exec_query(query, journeys_batch, True)
    if not queries == 0: print(' [#] Batch query successful:', queries*75000)



def init_tables():

    """     
    init_tables()

    - parameters : ()
    - description : creates database table(s) 
    - return : none 
    """

    # Station coordinates 
    # Index x/y if we need to make searches on coordinate areas
    query = "CREATE TABLE IF NOT EXISTS `city_stations` " \
            "( " \
                "`id` INT(1) NOT NULL UNIQUE, " \
                "`operator` VARCHAR(64), " \
                "`x` FLOAT(12), " \
                "`y` FLOAT(12), " \
                "PRIMARY KEY(`id`) USING BTREE, " \
                "INDEX (`x`) USING BTREE, " \
                "INDEX (`y`) USING BTREE " \
            ") " \
            "COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;"

    exec_query(query, [])

    # Station information 
    # 64 cells should be more than enough
    # If a station is removed, also remove the translations automatically
    query = "CREATE TABLE IF NOT EXISTS `city_translations` " +\
            "( " +\
                "`stationID` INT(1) NOT NULL, " +\
                "`name_en` VARCHAR(64), " +\
                "`name_swe` VARCHAR(64), " +\
                "`name_fi` VARCHAR(64), " +\
                "`address_swe` VARCHAR(64), " +\
                "`address_fi` VARCHAR(64), " +\
                "`city_swe` VARCHAR(64), " +\
                "`city_fi` VARCHAR(64), " +\
                "INDEX `FK_station` (`stationID`) USING BTREE, " +\
                "CONSTRAINT `FK_station` FOREIGN KEY (`stationID`) " \
                "REFERENCES `solita`.`city_stations` (`id`) ON DELETE CASCADE " \
            ") " +\
            "COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;"

    exec_query(query, [])

    # Journeys
    # We don't need to specify names here, since they're already in other table
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
                "INDEX (`departure`) USING BTREE, " \
                "INDEX (`return`) USING BTREE, " \
                "INDEX (`departure_station`) USING BTREE, " \
                "INDEX (`return_station`) USING BTREE " \
            ") " \
            "COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;"

    exec_query(query, [])



if __name__ == '__main__':

    # This will be removed later and merged with backend core file 

    # Create db tables
    init_tables()

    # To import stations and journeys 
    # scrape_stations()
    # scrape_journeys()