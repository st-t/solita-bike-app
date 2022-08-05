import React, { Component, useState } from 'react'
import GoogleMaps from '../maps';
import styles from './index.module.css';
import anims from '../anims.module.css';
import socket from '../../addons/socket';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";

let set = false;
let dateType = 0;
let selectedDeparture;
let selectedReturn;
var last_date = [0, 0];


const DateFormat = () => 
{
    const [startDate, setStartDate] = useState(
        setHours(setMinutes(new Date(), 0), 0)
    );

    if(!set)
    {
        set = true; 
        selectedReturn = startDate;
        selectedDeparture = startDate;
    }

    return (
        <DatePicker
            customInput={<input className={styles.custominput} inputMode='none'/>}
            selected={startDate}

            onChange={(date) => {
                setStartDate(date);

                if(dateType === 1) selectedReturn = date;
                else if(dateType === 0) selectedDeparture = date;
            }}

            showTimeSelect
            timeFormat="HH:mm"
            injectTimes={[
                setHours(setMinutes(new Date(), 1), 0),
                setHours(setMinutes(new Date(), 5), 12),
                setHours(setMinutes(new Date(), 59), 23),
            ]}
            dateFormat="MMMM d, yyyy h:mm aa"
        />
    );
};


export default class index extends Component 
{
    constructor(props) 
    {
        super(props);

        // Some states to keep our clients happy
        this.state = 
        {
            data:{},
            filters:{},
            stationsLoaded: false,
            
            // Stations data for dropdowns
            s_ids: [ [] ],
            dropdownValues: [],
            stations_coords: [ [], [] ], 
            stations_data: [ [], [], [], [] ], 
            refreshStations: false,

            // Journey data
            serverMessage: false, err_return: false, mapPreview: true,
            distance_text: '', duration_text: '', messageFromServer: '',
            d_station: null, r_station: null, distance: null, duration: null, depar: null, ret: null,
            d_x: null, d_y: null, r_x: null, r_y: null, d_id: null, r_id: null, dateOfDeparture: null, dateOfReturn: null,

            // Data for new station
            station_long: -0.404, station_lat: -0.404,
            station_name: '', station_address: '', station_city: '',

            // Can we query this journey
            canCreate: false, canCreateStation: false,
            
            // Can we start calculating stations distance ? 
            canGetDistance: false,

            // Expand
            expandDeparture: false, expandReturn: false,

            // Dropdowns
            dropdownDeparture: false, dropdownReturn: false,

            // Creating journey input strings
            departure_station: '', return_station: '',

            sqlConnected: false,
        };

        this.changeProps = this.changeProps.bind(this);
        this.createDropdown = this.createDropdown.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        this.setState({stationsLoaded: false});
        this.props.changeProps({isLoaded: true});
        
        this.dateClick(0);
        this.dateClick(1);
        this.checkServer();

        // Listen the server for messages
        socket.on('message', (msg) => 
        {
            this.setState({data:msg})

            // Message from socketio 
            let json_response = this.state.data; 

            // Check if we got some data and not an empty object
            if( String( typeof(json_response) ) === 'string' )
            {
                // Parse the json string 
                const obj = JSON.parse(json_response);

                // Check if we are connected 
                if( obj.hasOwnProperty('check') )
                {
                    if(obj.check.connected === 'True')
                    {
                        this.setState({sqlConnected: true});

                        // Get stations data 
                        this.stationsRequest();
                    }
                }

                // We recieved stations data
                if( obj.hasOwnProperty('list_stations') )
                {
                    // Handle json data
                    this.handleStationsData(obj);
                }

                // We have recieved stations data
                if( obj.hasOwnProperty('done') )
                {
                    this.setState({stationsLoaded: true});
                    this.props.changeProps({isLoaded: true});
                }

                // We have successfully inserted a new journey
                if( obj.hasOwnProperty('inserted') )
                {
                    this.props.changeProps({isLoaded: true});

                    this.setState({
                        err_return: false,
                        serverMessage: true,
                        messageFromServer: 'Successfully inserted new data!'
                    });

                    // Client inserted a new station. Refresh stations array
                    if(this.state.refreshStations)
                        this.setState({refreshStations: false}, this.updateStationsList );
                }

                // There was an error creating a journey
                if( obj.hasOwnProperty('insertfail') )
                {
                    this.props.changeProps({isLoaded: true});

                    this.setState({
                        err_return: true,
                        serverMessage: true,
                        messageFromServer: 'Error: ' + obj.insertfail
                    });
                }
            }
        });
    }

    changeProps = (data) => {
        this.setState(data, this.checkValues);
    }

    // Check sql status 
    checkServer()
    {
        const obj = { type: 'check' };
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Handle server response
    handleStationsData(obj) 
    {
        const { stations_data } = this.state;

        for(var key in obj.list_stations) 
        {
            if( obj.list_stations.hasOwnProperty(key) ) 
            {
                for( var attr in obj.list_stations[key] ) 
                {
                    // console.log(" " + attr + " -> " + obj.list_stations[key][attr]);

                    switch(attr)
                    {
                        case "id": stations_data[0].push( obj.list_stations[key][attr] ); break;
                        case "name": stations_data[1].push( obj.list_stations[key][attr] ); break;
                        case "x": stations_data[2].push( obj.list_stations[key][attr] ); break;
                        case "y": stations_data[3].push( obj.list_stations[key][attr] ); break;
                        default: break;
                    }
                }
            }
        }
    }

    // Called on page load
    stationsRequest()
    {
        const obj = { type: 'list_stations' };
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Sends a request to server
    serverRequest()
    {
        // Scroll user to top when we're loading the page
        window.scrollTo(0, 0);
        this.props.changeProps({isLoaded: false});

        // Change the json to a string and send the request
        const jsonRequest = JSON.stringify(this.state.filters); 
        socket.send(jsonRequest);
    }

    // Updates stations list 
    updateStationsList()
    {
        this.setState({stationsLoaded: false});
        this.stationsRequest();
    }

    // Client is setting journey date
    dateClick(type)
    {
        let dateObject;
        dateType = type;

        if(type === 1) dateObject = selectedReturn;
        else if(type === 0) dateObject = selectedDeparture;

        // If date is null or undefined, return
        if(dateObject === null || !dateObject) return;
        
        let selectedDate = dateObject.toString();
        let data = selectedDate.split(' ');

        var d = Date.parse(data[1] + "1, 2012");
        if( !isNaN(d) ) d = new Date(d).getMonth() + 1;
        
        let close_tab = false;
        const {d_station, r_station} = this.state;
        let format_date = Number(d) + '-' + data[2] + '-' + data[3] + ' ' + data[4];

        switch(type)
        {
            case 0: 
            {
                // Check if we wanna close the station tab for client 
                if( !( last_date[0] === 0 ) && !( last_date[0] === data[4] ) ) {
                    close_tab = true;
                }

                if(d_station && close_tab) 
                {
                    selectedDate = 0;
                    last_date[0] = 0;
                    close_tab = false;
                    this.setState({expandDeparture: false});
                }
                else last_date[0] = data[4];

                this.setState( {dateOfDeparture: dateObject, depar: format_date}, this.checkValues ); 
                break;
            }
                
            case 1: 
            {
                if( !( last_date[1] === 0 ) && !( last_date[1] === data[4] ) ) {
                    close_tab = true;
                }

                if(r_station && close_tab) 
                {
                    selectedDate = 0;
                    last_date[1] = 0;
                    close_tab = false;
                    this.setState({expandReturn: false});
                } 
                else last_date[1] = data[4];
                
                this.setState( {dateOfReturn: dateObject, ret: format_date}, this.calcTimeDiff ); 
                break;
            }
                
            default: break;
        }
    }

    // Calculates time difference between return and departure 
    calcTimeDiff()
    {
        const {dateOfDeparture, dateOfReturn} = this.state;
        const date1 = new Date(dateOfDeparture);
        const date2 = new Date(dateOfReturn);
        const diffMilliseconds = Math.abs(date2 - date1);
        const diffSeconds = Math.ceil( diffMilliseconds / 1000 );

        // Check if departure is greater than return
        // Which doesn't make sense, we are not going back in time (last time I checked)
        if(date1 > date2)
            this.setState( {duration: null} ); 
        else 
        {
            if(diffSeconds > 0)
            {
                this.setState( { 
                    duration: diffSeconds, 
                    duration_text: this.durationToString(diffSeconds) 
                }, this.checkValues ); 
            }
            else 
                this.setState( {duration: null} ); 
        }
    }

    // Client wants to expand departure part
    handleDeparture()
    {
        if(!this.state.sqlConnected) return; 
        this.setState({expandDeparture: !this.state.expandDeparture});
    }

    handleReturn()
    {
        if(!this.state.sqlConnected) return; 
        this.setState({expandReturn: !this.state.expandReturn});
    }

    // Client is writing duration
    handleDuration(e)
    {
        let input;
        input = e.target.value;

        // Check if typed input is a valid number, and not text
        if( !isNaN(input) && !isNaN( parseFloat(input) ) )
        {
            // Limit the input lenght
            if(input.length > 7) return;
            this.setState({duration: input});
        } 
        // Input wasn't a valid number 
        else
            return;
    }

    // Client is writing a station
    handleStation(e)
    {
        let input, attr;
        input = e.target.value;
        attr = e.target.attributes.getNamedItem('data-name').value;

        switch(attr)
        {
            case 'departure':
            {
                this.setState({dropdownDeparture: true});
                this.setState( {departure_station: input} ); 
                break;
            }
            case 'return': 
            {
                this.setState({dropdownReturn: true});
                this.setState( {return_station: input} ); 
                break;
            }
            default: break;
        }

        let ids = [];
        let total = 0;
        let values = [];
        let coords = [ [], [] ];
        
        // Input is greater than 1 character
        if(input.length > 1)
        {
            const { stations_data, stationsLoaded } = this.state;

            if(!stationsLoaded) return;
            
            // If stations data contains searched term, push it into dropdown
            for(let i = 0; i < stations_data[1].length; i++)   
            {
                if(!stations_data[1][i])
                    break;

                let str = String( stations_data[0][i] );
                let c_with = input.toLowerCase();
                let compare = str.toLowerCase();

                if( compare.indexOf(c_with) > -1 || compare === c_with )
                {
                    // 2 : x
                    // 3 : y
                    total ++;
                    ids.push( stations_data[1][i] );
                    values.push( stations_data[0][i] );
                    coords[0].push( stations_data[2][i] );
                    coords[1].push( stations_data[3][i] );
                }

                // Limit dropdown entries to 9
                if(total >= 9) break;
            }
        }

        this.setState({
            s_ids: ids,
            dropdownValues: values,
            stations_coords: coords,
        });
    }

    // Client is writing a new station
    handleNewStation(e, t)
    {
        let input;
        input = e.target.value;

        switch(t)
        {
            case 1:
                this.setState( {station_name: input}, this.stationIsSet ); break;
            case 2: 
                this.setState( {station_address: input}, this.stationIsSet ); break;
            case 3: 
                this.setState( {station_city: input}, this.stationIsSet ); break;
            default: break;
        }

        if(input.length < 1)
            this.changeProps({canCreateStation: false});
    }

    // Callback function
    stationIsSet()
    {
        const { station_long, station_lat, station_name, station_address, station_city } = this.state;
        this.checkNewStation(station_long, station_lat, station_name, station_address, station_city);
    }

    // Generates a dropdown(s)
    createDropdown = (type) => 
    {
        // We don't really need all these local arrays I just thought it'd ease the read 
        // No harm no foul
        let all = [];
        let ids = [];
        let values = [];
        let coords = [ [], [] ];
        const { dropdownValues, stations_coords, s_ids } = this.state;

        // Push stations names coordinates and rowIDs that we'll pass into handler
        for(let i = 0; i < dropdownValues.length; i++) 
        {
            ids.push( s_ids[i] );
            values.push( dropdownValues[i] );
            coords[0].push( stations_coords[0][i] );
            coords[1].push( stations_coords[1][i] );
        }
            
        for(let i = 0; i < values.length; i++) 
        {
            all.push(
                <span className={styles.item} data-cy="dr_dep" onClick ={() => this.handleDropdown( values[i], type, coords[0][i], coords[1][i], ids[i] )} key={i}>
                    <p>{values[i]}</p>
                </span>
            )
        }
        return(all);
    }

    // Dropdown pressed handler
    handleDropdown(val, type, x, y, id)
    {
        // Specify which dropdown was clicked
        switch(type)
        {
            case 1:  
            {
                this.setState( {
                    d_x: x,
                    d_y: y,
                    d_id: id, 
                    dropdownDeparture: false,
                    departure_station: val,
                    d_station: val
                }, this.stationsSet );
                break;
            }

            case 2:
            {
                this.setState( {
                    r_x: x,
                    r_y: y,
                    r_id: id, 
                    dropdownReturn: false,
                    return_station: val,
                    r_station: val,
                }, this.stationsSet );
                break;
            }
            default: break;
        }
    }

    // Check if both stations are set to calculate the distance between stations
    stationsSet()
    {
        const {d_station, r_station} = this.state;

        if(d_station && r_station)
            this.setState( {canGetDistance: true, mapPreview: false}, this.checkValues );
    }

    // Check if client has set all values and we can query them to database 
    checkValues()
    {
        if(!this.state.sqlConnected) return; 

        const {
            d_x, d_y,
            r_x, r_y,
            r_id, d_id,
            distance, duration,
            d_station, r_station,
            dateOfDeparture, dateOfReturn
        } = this.state;

        if( d_x && d_y
            && r_x && r_y
            && r_id && d_id
            && distance && duration
            && d_station && r_station
            && dateOfDeparture && dateOfReturn)
        {
            this.setState({canCreate: true});
        }
        else 
            this.setState({serverMessage: false});

        this.setState({canGetDistance: false});
    }

    // Returns passed seconds as time string
    durationToString(seconds)
    {
        var hours   = Math.floor(seconds / 3600);
        var minutes = Math.floor( ( seconds - (hours * 3600) ) / 60 );
        seconds = seconds - (hours * 3600) - (minutes * 60);
        return hours + 'h ' + minutes + 'min  ' + seconds + 's';
    }

    // Send a new journey to database
    queryJourney()
    {
        // Client hasn't set all data for this query 
        if(!this.state.canCreate) return;
        if(!this.state.sqlConnected) return; 
        
        const {
            r_id, d_id,
            distance, duration,
            dateOfDeparture, dateOfReturn
        } = this.state;

        // Construct the data
        const obj = 
        { 
            type: 'new_journey',
            return_station: r_id,
            departure_station: d_id,
            distance: distance,
            duration: duration,
            dateOfDeparture: dateOfDeparture,
            dateOfReturn: dateOfReturn
        };

        // Sent the data
        this.setState( {filters: obj}, this.serverRequest );

        // Data is sent, reset the page
        this.setState({
            d_x: null,
            d_y: null,
            r_x: null,
            r_y: null,
            r_id: null,
            d_id: null,
            distance: null, 
            duration: null,
            d_station: null, 
            r_station: null,
            dateOfDeparture: null,
            dateOfReturn: null,
            depar: null,
            ret: null,
            return_station: '',
            departure_station: '',
            distance_text: null,
            duration_text: null,
            canCreate: false,
            expandDeparture: false,
            expandReturn: false,
            mapPreview: true
        });
    }

    // Check if station values are set 
    checkNewStation(station_long, station_lat, station_name, station_address, station_city, maps=false)
    {
        let coords = false;
        if( !(station_long === -0.404) && !(station_lat === -0.404) ) coords = true;
        
        if(!maps)
        {
            if( coords && station_name && station_address && station_city)
                this.setState({canCreateStation: true});
            else 
                this.setState({serverMessage: false});
        }
        else 
        {
            if( coords && station_name && station_address && station_city)
                this.changeProps({canCreateStation: true});
            else 
                this.changeProps({serverMessage: false});
        }
    }

    // Send a new station to database
    queryStation()
    {
        // Client hasn't set all data for this query 
        if(!this.state.canCreateStation) return;
        if(!this.state.sqlConnected) return; 
        
        const {
            station_long, station_lat, 
            station_name, station_address, station_city
        } = this.state;

        // Construct the data
        const obj = 
        { 
            type: 'new_station',
            long: station_long,
            lat: station_lat,
            name: station_name,
            address: station_address,
            city: station_city,
            operator: ' '
        };

        // Send the data
        this.setState( {
            filters: obj,
            stations_data: [ [], [], [], [] ],
            refreshStations: true

        }, this.serverRequest );

        // Data is sent, reset the page
        this.setState({
            station_address: '',
            station_name: '',
            station_city: '',
            station_lat: -0.404,
            station_long: -0.404,
            canCreateStation: false
        });
    }

    render() 
    {
        const {
            expandDeparture, expandReturn, 
            departure_station, return_station, 
            dropdownDeparture, dropdownReturn,
            duration_text, d_station, 
            r_station, distance_text, 
            depar, ret,
            canGetDistance, canCreate,
            serverMessage, messageFromServer,
            err_return,
            station_name, station_address,
            canCreateStation, station_city
        } = this.state;

        return (
            <div className={anims.fade_class}>
                <div className={styles.container}>
                    <div 
                    className={`${expandDeparture === true ? expandReturn === true ? styles.create_header_large : styles.create_header_px : expandReturn === true ? styles.create_header_px : styles.create_header} `} >

                        <div className={`${serverMessage === true ? styles.server_notify : styles.server_notify_hide} `}>
                            <p data-cy="s_notif" className={`${err_return === true ? styles.server_txt_err : styles.server_txt} `}>
                                {messageFromServer}
                            </p>
                        </div>

                        <p className={styles.create_title}>Create new journey</p>

                        <div className={styles.journey_list}>
                            <p data-cy="c_dep"
                            onClick = {() => this.handleDeparture()} 
                            className={`${expandDeparture === true ? styles.departure_e : styles.departure} `}> Departure </p>

                            {/* Expanded content */}
                            <div className = {`${expandDeparture === true ? styles.j_departure_visible : styles.j_departure_off} `} >

                                <ul className={styles.j_ul}>
                                    <li>
                                        <p>Station :</p>
                                    </li>
                                </ul>

                                <ul className={styles.j_ul}>
                                    <li>
                                        <div className={styles.f_searchWrap}>
                                            <div className={styles.f_search}>
                                                <input type="text" data-name="departure" onChange={this.handleStation.bind(this)} className={styles.f_searchTerm} value={departure_station} />
                                            </div>

                                            <div className={styles.drop_abs_1}>
                                                <div className={styles.dropdown} data-open={dropdownDeparture} data-type="1">
                                                    {this.createDropdown(1)}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>

                                <ul className={styles.j_ul2}>
                                    <li>
                                        <p>Start :</p>
                                    </li>
                                </ul>

                                <ul className={styles.j_ul}>
                                    <li>
                                        <div onClick={() => this.dateClick(0)} onKeyUp={() => this.dateClick(0)}  className={styles.datepick}>
                                            <DateFormat />
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className={styles.journey_list}>
                            <p data-cy="c_ret"
                            onClick = {() => this.handleReturn()} 
                            className={`${expandReturn === true ? styles.departure_e : styles.departure} `}> Return </p>

                            {/* Expanded content */}
                            <div className = {`${expandReturn === true ? styles.j_departure_visible : styles.j_departure_off} `} >

                                <ul className={styles.j_ul}>
                                    <li>
                                        <p>Station :</p>
                                    </li>
                                </ul>

                                <ul className={styles.j_ul}>
                                    <li>
                                        <div className={styles.f_searchWrap}>
                                            <div className={styles.f_search}>
                                                <input type="text" data-name="return" onChange={this.handleStation.bind(this)} className={styles.f_searchTerm} value={return_station} />
                                            </div>

                                            <div className={styles.drop_abs_1}>
                                                <div className={styles.dropdown} data-open={dropdownReturn} data-type="2">
                                                    {this.createDropdown(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>

                                <ul className={styles.j_ul2}>
                                    <li>
                                        <p>Start :</p>
                                    </li>
                                </ul>

                                <ul className={styles.j_ul}>
                                    <li>
                                        <div onClick={() => this.dateClick(1)} onKeyUp={() => this.dateClick(1)} className={styles.datepick}>
                                            <DateFormat />
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className={styles.journey_headers_list}>
                            <ul className={styles.set_list}>
                                <li>From:</li>
                                <li data-cy="new_j_data">{d_station}</li>
                            </ul>
                            <ul className={styles.set_list}>
                                <li>To:</li>
                                <li data-cy="new_j_data">{r_station}</li>
                            </ul>
                            <ul className={styles.set_list}>
                                <li>Departure:</li>
                                <li data-cy="new_j_data">{depar}</li>
                            </ul>
                            <ul className={styles.set_list}>
                                <li>Return:</li>
                                <li data-cy="new_j_data">{ret}</li>
                            </ul>
                            <ul className={styles.set_list}>
                                <li>Distance:</li>
                                <li data-cy="new_j_data">{distance_text}</li>
                            </ul>

                            <ul className={styles.set_list}>
                                <li>Duration:</li>
                                <li data-cy="new_j_data">{duration_text}</li>
                            </ul>
                        </div>

                        <div className={styles.station_map}>
                            {
                                canGetDistance === true
                                ? < GoogleMaps 
                                    data = {this.state} 
                                    changeProps = {this.changeProps} 
                                    isJourney={false}
                                    isCreate={true}
                                    mapPreview={false}
                                    sqlConnected={this.state.sqlConnected}
                                /> 
                                : < GoogleMaps 
                                    data = {this.state} 
                                    changeProps = {this.changeProps} 
                                    isJourney={false}
                                    isCreate={true}
                                    mapPreview={true}
                                    sqlConnected={this.state.sqlConnected}
                                />
                                
                            }
                        </div>

                        <button data-cy="create-j"
                        onClick={() => this.queryJourney()} 
                        className={`${canCreate === true ? styles.apply : styles.applyDark} `}>Create</button>

                        <div className={styles.add_stations}>

                            <p className={styles.create_station}>Create new station</p>
                            
                            <div className={styles.station_map}>

                                <p className={styles.new_station}>Set location</p>
                                {this.state.station_long}<br/>
                                {this.state.station_lat}<br/> <br/>
                                < GoogleMaps 
                                    data = {this.state} 
                                    changeProps = {this.changeProps} 
                                    isJourney={false}
                                    isCreate={false}
                                    clickOnCoord={true}
                                    checkNewStation = {this.checkNewStation} 
                                    sqlConnected={this.state.sqlConnected}
                                />

                            </div>
                            
                            <div className={styles.station_name}>
                                <p className={styles.new_station_n}>- Name</p>
                                <input data-cy="in-name" type="text" onChange={(e) => {this.handleNewStation(e, 1)}} className={styles.input_station} value={station_name} />
                                <p className={styles.new_station_n}>- Address</p>
                                <input data-cy="in-addr" type="text" onChange={(e) => {this.handleNewStation(e, 2)}} className={styles.input_station} value={station_address} />
                                <p className={styles.new_station_n}>- City</p>
                                <input data-cy="in-city" type="text" onChange={(e) => {this.handleNewStation(e, 3)}} className={styles.input_station} value={station_city} />
                                
                                <div className={styles.create_wrap}>
                                    <button data-cy="create-j2"
                                    onClick={() => this.queryStation()} 
                                    className={`${canCreateStation === true ? styles.apply : styles.applyDark} `}>Create</button>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }
}