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
                insert_batch(stations_batch, translations_batch)

                i = 0
                stations_batch = []
                translations_batch = []

        # File ended, insert rest of the rows if we didn't do that already
        if not i == 0: insert_batch(stations_batch, translations_batch)



def insert_batch(stations_batch, translations_batch):

    """ 
    insert_batch()

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



def scrape_journeys():
    
    """ 
    scrape_journeys()

    - parameters : ()
    - description : reads journey file and inserts data to database
    - return : none
    """

    i = 0
    file = 'datasets/2021-05.csv'

    with open(file) as lines:

        for line in lines:
            
            line = line.rstrip()
            line = line.replace('Ã¤', 'ä')
            data = line.split(',')

            if len(data) > 6:
                print('\n \n Departure: {}'.format(data[0]),
                '\n Return: {}'.format(data[1]),
                '\n Departure Station ID: {}'.format(data[2]),
                '\n Departure Station: {}'.format(data[3]),
                '\n Return Station ID: {}'.format(data[4]),
                '\n Return Station: {} '.format(data[5]),
                '\n Distance: {}'.format(data[6]),
                '\n Duration: {}'.format(data[7]))

            i += 1
            if i > 10: break


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



if __name__ == '__main__':

    # This will be removed later and merged with backend core file 

    init_tables()
    # scrape_journeys()
    scrape_stations()