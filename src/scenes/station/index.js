import React, { Component, useState } from 'react'
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'; 

import socket from '../../addons/socket';
import DatePicker from "react-datepicker";
import GoogleMaps from '../maps';
import styles from './index.module.css';
import anims from '../anims.module.css';
import "react-datepicker/dist/react-datepicker.css"

var dist_to; 
var dist_from;
var refreshLink = false;
var start_date, end_date;


function withParams(Component) {
    return props => <Component {...props} params={useParams()} />;
}


const DateFormat = () => 
{
    const [startDate, setStartDate] = useState( new Date() );
    const [endDate, setEndDate] = useState(null);

    const onChange = (dates) => 
    {
        const [start, end] = dates;

        setStartDate(start);
        setEndDate(end);

        start_date = start;
        end_date = end;
    };

    const selected = new Date(2021, 5, 1);

    return (
        <DatePicker
            selected={selected}
            onChange={onChange}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            inline
        />
    );
};


class Station extends Component 
{
    constructor(props) 
    {
        super(props);

        // Some states to keep our clients happy
        this.state = 
        {
            data:{},
            filters:{},

            id: null,
            
            isCreate: false,
            mapPreview: false,
            linkStations: false,
            needApply: false,
            expandFilters: false,
            filtersChecked: false,
            
            // Filter applied settings 
            lastApplied: [], curApplied: [], 
            
            // Filter dates
            toDate: null, fromDate: null,

            // Station info 
            // id, name, address, city, x, y
            station: ['', '', '', '', '', ''],

            // Station data 
            journeys_to: 0,
            distance_to: 0,
            journeys_from: 0,
            distance_from: 0,
            top_end: [ [], [], [] ],
            top_start: [ [], [], [] ],

            pageLoaded: false,
            sqlConnected: false,
        };
        
        this.changeProps = this.changeProps.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        this.setState({pageLoaded: false});
        this.props.changeProps({isLoaded: false});

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

                        // Start with making a request
                        this.stationRequest();
                    }
                }

                // Station info
                if( obj.hasOwnProperty('station_info') )
                {
                    let values = [
                        this.props.params.stationID,
                        obj.station_info.name,
                        obj.station_info.address,
                        obj.station_info.city,
                        obj.station_info.x,
                        obj.station_info.y
                    ]

                    this.setState({station : values});
                }

                // Journeys to this station
                if( obj.hasOwnProperty('station_journeys_to') )
                {
                    dist_to = obj.station_journeys_to.num;
                    this.setState({journeys_to : this.numberWithCommas(dist_to)});
                }

                // Journeys from this station
                if( obj.hasOwnProperty('station_journeys_from') )
                {
                    dist_from = obj.station_journeys_from.num;
                    this.setState({journeys_from : this.numberWithCommas(dist_from)});
                } 

                // Average distance traveled to this station
                if( obj.hasOwnProperty('station_distance_to') )
                {
                    let dist_str;
                    let fixed_dist = parseFloat(obj.station_distance_to.num / dist_to).toFixed(0);

                    if(fixed_dist < 1000)
                        dist_str = String(fixed_dist) + ' m'
                    else 
                        dist_str = this.numberWithCommas( parseFloat(fixed_dist / 1000).toFixed(2) ) + ' km'

                    this.setState({distance_to : dist_str});
                }

                // Average distance traveled from this station
                if( obj.hasOwnProperty('station_distance_from') )
                {
                    let dist_str;
                    let fixed_dist = parseFloat(obj.station_distance_from.num / dist_from).toFixed(0);

                    if(fixed_dist < 1000)
                        dist_str = String(fixed_dist) + ' m'
                    else 
                        dist_str = this.numberWithCommas( parseFloat(fixed_dist / 1000).toFixed(2) ) + ' km'

                    this.setState({distance_from : dist_str});
                }

                // Most popular return stations starting here 
                if( obj.hasOwnProperty('station_popular_start') )
                {
                    this.handleResponse(1, obj);
                }

                // Most popular return stations ending here 
                if( obj.hasOwnProperty('station_popular_end') )
                {
                    this.handleResponse(2, obj);
                }

                // Requests are handled
                if( obj.hasOwnProperty('done') )
                {
                    this.setState({pageLoaded: true});
                    this.props.changeProps({isLoaded: true});
                }
            }
        });
    }

    changeProps = (data) => {
        this.setState(data);
    }

    // Parse large number 1000000 => 1,000,000
    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Check sql status 
    checkServer()
    {
        const obj = { type: 'check' };
        this.setState( {filters: obj}, this.serverReq );
    }

    // Called on page load
    stationRequest()
    {
        // Pull stationID from props and send it to server 
        const obj = { 
            type: 'station_data', 
            id: this.props.params.stationID ,
            date: false,
            from: 0,
            to: 0
        };
        this.setState( {filters: obj}, this.serverReq );
    }

    // Sends a request to server
    serverReq()
    {
        // Scroll user to top when we're loading the page
        window.scrollTo(0, 0);

        // Change the json to a string and send the request
        const jsonRequest = JSON.stringify(this.state.filters); 
        socket.send(jsonRequest);
    }

    // Handle some statistics
    handleResponse(type, obj)
    {
        let data_obj;

        switch(type)
        {
            case 1: data_obj = obj.station_popular_start; break;
            case 2: data_obj = obj.station_popular_end; break;
            default: break;
        }
        
        const { top_end, top_start } = this.state;

        for(var key in data_obj) 
        {
            if( data_obj.hasOwnProperty(key) ) 
            {
                for( var attr in data_obj[key] ) 
                {
                    // console.log(" " + attr + " -> " + data_obj[key][attr]);

                    switch(attr)
                    {
                        case "count_s": 
                        {
                            if(type === 1) top_start[1].push( data_obj[key][attr] );
                            break;
                        }

                        case "count_e": 
                        {
                            if(type === 2) top_end[1].push( data_obj[key][attr] );
                            break;
                        }

                        case "station_s": 
                        {
                            if(type === 1) top_start[0].push( data_obj[key][attr] );
                            break;
                        }

                        case "station_e": 
                        {
                            if(type === 2) top_end[0].push( data_obj[key][attr] );
                            break;
                        }

                        case "index": 
                        {
                            if(type === 2) top_end[2].push( data_obj[key][attr] );
                            else top_start[2].push( data_obj[key][attr] );
                            break;
                        }

                        default: break;
                    }
                }
            }
        }
    }

    // Client wants to see settings 
    handleFiltersExpansion()
    {
        this.setState({expandFilters: !this.state.expandFilters});
    }

    // Handles checkbox clicks
    handleChecked = e => 
    {
        const name = e.target.name;
        const checked = e.target.checked;

        // Set checkbox state and call a callback 
        this.setState( {[name]: checked}, this.handleApply );
    };

    // Client clicks time calendar 
    dateClick()
    {
        // If start date is null or undefined, return
        if(start_date === null || !start_date) return;

        start_date = start_date.toString();
        let data = start_date.split(' ');

        // Sun May 30 2021 00:00:00 

        var d = Date.parse(data[1] + "1, 2012");
        if( !isNaN(d) ) d = new Date(d).getMonth() + 1;

        let format_start = data[3] + '-' + d + '-' + data[2];

        this.setState({
            fromDate: format_start,
            toDate: null,
        });
        
        if(end_date === null) return;

        end_date = end_date.toString();
        data = end_date.split(' ');

        d = Date.parse(data[1] + "1, 2012");
        if( !isNaN(d) ) d = new Date(d).getMonth() + 1;

        let format_end = data[3] + '-' + d + '-' + data[2];

        this.setState({
            toDate: format_end,
        }, this.handleApply);
    }

    // Check if we need to apply filters 
    handleApply()
    {
        const { toDate, fromDate, filtersChecked } = this.state;
        let arr = [toDate, fromDate];
        
        // If checkbox is not checked, or dates are null, don't apply
        if(!filtersChecked || toDate === null || fromDate === null)
        {
            this.setState({needApply: false});
            return;
        }

        // Set currently applied and call a callback function
        this.setState( {curApplied: arr}, this.applyCallback );
    }

    // Callback function
    applyCallback()
    {
        let needToApply = false;
        const { curApplied, lastApplied } = this.state;

        for(let i = 0; i < curApplied.length; i++) 
        {
            // If last applied data is not same as current => activate apply box
            if( !( curApplied[i] === lastApplied[i] ) )
            {
                needToApply = true;
                break;
            }
        }

        this.setState({needApply: needToApply});
    }

    // Client wants to apply filters 
    applyFilters(fromLink=false)
    {
        const { curApplied, filtersChecked, toDate, fromDate, needApply, pageLoaded } = this.state;

        if(!fromLink)
        {
            if(!needApply || !pageLoaded) return; 
            if(!filtersChecked || toDate === null || fromDate === null) return; 
        }

        if(!pageLoaded) return; 

        refreshLink = fromLink;
        window.scrollTo(0, 0);

        this.setState({
            needApply: false,
            lastApplied: curApplied
        });

        // Set loading screen and callback request
        this.props.changeProps({isLoaded: false});
        
        // Clear the page and refresh data 
        this.setState
        ( {
            expandFilters: false,
            journeys_to: 0,
            journeys_from: 0,
            distance_to: 0,
            distance_from: 0,
            top_end: [ [], [], [] ],
            top_start: [ [], [], [] ],
            pageLoaded: false
        
        }, this.sendTimeRequest );
    }

    // Callback for creating a request
    sendTimeRequest()
    {
        const { fromDate, toDate } = this.state;

        const obj = { 
            type: 'station_data', 
            id: this.props.params.stationID ,
            date: !refreshLink,
            from: fromDate,
            to: toDate
        };

        this.setState( {filters: obj}, this.serverReq );
    }

    // Render station statistics
    renderTopReturn()
    {

        const { top_start } = this.state;
        const titles = [], counts = [], links = [];
        
        for (let i = 0; i < top_start[0].length; i++)
        {
            counts.push( top_start[1][i] );
            titles.push( top_start[0][i] );
            links.push( top_start[2][i] );
        }

        const html = titles.map( (string, index)  => 
        {
            const stationLink = '/station/' + links[index];

            return (
                <li key={index}>
                    <Link data-cy="s_top_rlink" onClick={() => this.applyFilters(true)} className={styles.station_link} to={stationLink}>
                        {string} <p>({counts[index]} journeys)</p>
                    </Link> 
                </li>
            );
        });

        return html;
    }

    // Render station statistics
    renderTopDeparture()
    {
        const { top_end } = this.state;
        const titles = [], counts = [], links = [];
        
        for (let i = 0; i < top_end[0].length; i++)
        {
            counts.push( top_end[1][i] );
            titles.push( top_end[0][i] );
            links.push( top_end[2][i] );
        }

        const html = titles.map( (string, index)  => 
        {
            const stationLink = '/station/' + links[index];

            return (
                <li key={index}>
                    <Link data-cy="s_top_dlink" onClick={() => this.applyFilters(true)} className={styles.station_link} to={stationLink}>
                        {string} <p>({counts[index]} journeys)</p>
                    </Link> 
                </li>
            );
        });

        return html;
    }

    render() 
    {
        const { 
            expandFilters, needApply, 
            toDate, fromDate, 
            linkStations, isCreate, 
            station, pageLoaded,
            journeys_to, journeys_from,
            distance_to, distance_from
        } = this.state;

        return (
            <div className={anims.fade_class}>
                <div className={styles.container}>
                    <div className={styles.station_header}>

                        <p>#{station[0]} {station[1]}</p>
                        <p className={styles.station_address}>{station[2]}</p>
                        <p className={styles.station_address}>{station[3]}</p>

                        <div className={styles.station_map}>

                            {/* Render the map when station data is loaded */}
                            {pageLoaded === true 
                            ?   < GoogleMaps 
                                    data = {this.state} 
                                    isJourney={linkStations}
                                    isCreate={isCreate}
                                    changeProps = {this.changeProps} 
                                    sqlConnected = {this.state.sqlConnected}
                                />
                            : null}

                        </div>
                    </div>

                    <div className={styles.station_stats}>

                        <p className={styles.station_stats_title}>Station statistics</p>
                        
                        {/* When user clicks cogwheel => expand it <DateFormat />*/}
                        <div>
                            <FontAwesomeIcon 
                            data-cy="cog_s"
                            onClick = {() => this.handleFiltersExpansion()} 
                            className={`${expandFilters === true ? styles.icon_filters_open : styles.icon_filters} `} icon={faCogs} size="2x" />
                        </div>

                        <div className={styles.filter_list}>
                            <div className={styles.journey_filters}>

                                {/* Expanded content */}
                                <div className = {`${expandFilters === true ? styles.filters_visible : styles.filters_hidden} `} >

                                    <div className = {`${expandFilters === true ? styles.filters_content : styles.filters_hidden} `} >

                                        <ul>
                                            <li>
                                                <input 
                                                data-cy="datef"
                                                className={styles.checkbox} 
                                                onChange={this.handleChecked} 
                                                name="filtersChecked" 
                                                checked={this.state.filtersChecked} 
                                                id="checkbox-1" 
                                                type="checkbox" 
                                                value="value1"/>
                                                <label htmlFor="checkbox-1">Filter by time</label> 
                                            </li>

                                            <li></li>

                                            <li>
                                                <button data-cy="applyf" onClick={() => this.applyFilters()} className={`${needApply === true ? styles.f_apply : styles.f_applyDark} `}>Apply</button>
                                            </li>

                                        </ul>

                                        <ul>
                                            <li>From:</li>
                                            <li>{fromDate}</li>
                                        </ul>

                                        <ul>
                                            <li>To:</li>
                                            <li>{toDate}</li>
                                        </ul>

                                        <div onClick={() => this.dateClick()}  className={styles.datepick}>
                                            <DateFormat />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.stats_wrap}>

                            <ul className={styles.stats_list}>
                                <li><p>Journeys to this station</p></li>
                                <li><p data-cy="s_stat">{journeys_to}</p></li>
                            </ul>

                            <ul className={styles.stats_list}>
                                <li><p>Journeys from this station</p></li>
                                <li><p data-cy="s_stat">{journeys_from}</p></li>
                            </ul>

                            <ul className={styles.stats_list}>
                                <li><p>Average distance traveled to this station</p></li>
                                <li><p data-cy="s_stat">{distance_to}</p></li>
                            </ul>

                            <ul className={styles.stats_list}>
                                <li><p>Average distance traveled from this station</p></li>
                                <li><p data-cy="s_stat">{distance_from}</p></li>
                            </ul>

                            <p className={styles.list_head}>Most popular return stations starting here:</p>
                            <ol>
                                {this.renderTopReturn()}
                            </ol>

                            <p className={styles.list_head}>Most popular departure stations ending here:</p>
                            <ol>
                                {this.renderTopDeparture()}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withParams(Station);