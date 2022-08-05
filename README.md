
# solita-bike-app
This is the pre-assignment for Solita Dev Academy Finland fall 2022

https://github.com/solita/dev-academy-2022-fall-exercise


### Chosen webstack 

This app runs on Python-Flask backend giving the powerful tools of pip with your one and only React.js as frontend to assure smooth sailing.
Back-to-front communication happens through SocketIO and we will be using a MySQL database for handling all the data. 


## Features

- Automatic dataset imports 
   - Does not import journeys under 10 seconds 
   - Does not import journeys under 10 meters 
   - Does not import journeys with same return and departure stations 
   - Does not import journeys with invalid/unknown station 

- Journeys list 
   - Full-fletched pagination 
   - Departure and return stations, distance and duration
   - Map route display on column click 
   - Loads target station data on click 
   - Ordering per column (departure/return/distance/duration)
   - Filtering journeys 
   - Searching 
  
- All stations list 
   - Full-fletched pagination 
   - Searching 
   - Loads target station data on click 
  
- Single station view
   - Location on map
   - Name, address and city (if available)
   - Journey statistics (amount of journeys, avg distances)
   - Top popular return / departure stations  
   - Filtering results by any timerange
  
- Adding new journeys
   - Search and set departure & return stations 
   - Automatic duration and distance calculations 
   - Map route display 
  
- Adding new stations
   - Able to choose station location from the map 
  
- Mobile version
   - Not the greatest but definitely not the worst 
  
- Docker support 
   - You may run the app in any operating system that has Docker 
  
- E2E tests
   - Run automatic tests to test the whole application
  
- Language support for future development 
   - Database structure built to support many languages 

<br>

## Requirements 

- Python3 
- Node.js and NPM
- MySQL database

### Optional:
  
- Git 
- Docker 

<br>

## Running the app

NOTE: Please disable any adblock extensions before running this application.

This can lead to some cors errors with SocketIO (communication from server to client). 

Its also not recommended to use extensions such as DarkReader.

<br>

### Either download the repository use git clone:

```
git clone https://github.com/st-t/solita-bike-app

```

### Download the datasets:

https://dev.hsl.fi/citybikes/od-trips-2021/2021-05.csv

https://dev.hsl.fi/citybikes/od-trips-2021/2021-06.csv

https://dev.hsl.fi/citybikes/od-trips-2021/2021-07.csv


### Place datasets in solita-bike-app\server\datasets 

<br>

## Running the app in Docker ( Windows/Linux/Mac[...] )

### Make sure Docker is successfully installed in your system.

### Execute following commands in terminal: 

```
cd solita-bike-app

docker build --build-arg REACT_APP_HOSTNAME='localhost:3000' -t solita-bike-app . 

docker run --rm --memory=500m -p 3000:3000 solita-bike-app

```

### And that's it. 

The app will run on http://localhost:3000/ which you may open up in browser.

We are adding some memory as extra Docker argument to be able to handle dataset imoprts.

<br>

## Running the app with Python & npm (Windows only) 

### Run:

`cd solita-bike-app` - Navigates into root directory 

`npm install`  		- Installs frontend dependencies

`npm run build` 	- Builds the application 

`cd server` 			- Navigates into server directory 

### Recommended to use python venv (optional):

`pip3 install -U pip virtualenv`   - Installs pip virtualenv

`python -m virtualenv venv`        - Creates venv directory 

`venv/scripts/activate` 			 - Activates the virtualenv 

### Install backend dependencies:

`pip install -r requirements.txt` 

### You may now run the application with:

`python __init.py`

<br>

The app will run on http://localhost:3000/ which you may open up in browser.

<br>

# Configuring the app & Importing datasets 

Open the app in browser and navigate to Settings.

### Enter your MySQL credentials and hit connect:

![screenshot](https://i.gyazo.com/92fb3c010cd8a2ee83125846be9948de.png)

### If no errors show up, you should instantly see a button to import datasets:

![screenshot](https://i.gyazo.com/837300a6d6dba2784b006de38959e3f1.png)

NOTE: Run dataset import only once.

<br>

<br>

# E2E tests

### Introduction

End to end tests automatically test the main functionality of each page of this app.

This requires for the app to be running in your system with MySQL configured and datasets imported. 

[See instructions above.](#running-the-app)

<br>

You may run the app either in Docker or Python to execute these tests.

If you're running the app in Docker you may use Linux/Windows/Mac[...]

Running with Python environment is only tested in Windows.  

<br>

### Running E2E tests 

Execute following command in your terminal (in project root directory):

`.\node_modules\.bin\cypress open`

Wait for cypress to open, click "E2E Testing" => "Start E2E Testing"

You will immediately see a list of E2E tests for each page

Click any of them to run the tests

![screenshot](https://i.gyazo.com/d9dd62902f0646ed34aea95272fe8031.png)

<br>
<br>

# Troubleshooting 

- Make sure nothing is blocking port 3000.

- See javascript console and server terminal if there are any issues with the app.

- Any CORS errors means there was a problem initializing socket connection. 

  - Disable adblock and any other browser extensions to avoid this. 

- Map views not loading is most likely caused by Google's recent restrictions in their API.

<br>
<br>

## Screenshots

<details>
  <summary>Index</summary>
  
  ![screenshot](https://i.gyazo.com/97e5a19c46d56921aacf73f0b736ec64.png)
</details>

<details>
  <summary>Mobile</summary>
  
  ![screenshot](https://i.gyazo.com/ccfaa0e6d807c04b1f2d98352442e192.png)
</details>

<details>
  <summary>Pagination</summary>
  
  ![screenshot](https://i.gyazo.com/e3226d1dc8f9ce7baad2cbfa67a220cd.png)
</details>

<details>
  <summary>Statistics</summary>
  
  ![screenshot](https://i.gyazo.com/1800746b18bc639ac59ecc707f2abf7b.png)
</details>

<details>
  <summary>Adding new data</summary>
  
  ![screenshot](https://i.gyazo.com/be864f05b29ae6d9fccd11965fbd335c.png)
</details>

<details>
  <summary>Adding stations</summary>
  
  ![screenshot](https://i.gyazo.com/3a873ed1f12cc58317291d881a32b9d5.png)
</details>

<details>
  <summary>Filtering</summary>
  
  ![screenshot](https://i.gyazo.com/6cf8376c55264984678d79bfaa2180d2.png)
</details>

<details>
  <summary>Column sorting</summary>
  
  ![screenshot](https://i.gyazo.com/bc197bab4217793af88fcf5da88c8448.png)
</details>
