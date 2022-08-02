import React, { Component, useState } from 'react'
import { useParams } from 'react-router-dom';
import DatePicker from "react-datepicker";
import GoogleMaps from '../maps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'; 

import styles from './index.module.css';
import anims from '../anims.module.css';
import "react-datepicker/dist/react-datepicker.css"

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
            expandFilters: false,
            needApply: false,
            filtersChecked: false,
            lastApplied: [], curApplied: [], 
            toDate: null, fromDate: null,
            linkStations: false,
            isCreate: false,
            mapPreview: false,
        };

        this.changeProps = this.changeProps.bind(this);
    }

    componentDidMount() 
    {
        console.log('params: ' + this.props.params.stationID);
        this.props.changeProps({isLoaded: true});
    }

    changeProps = (data) => {
        this.setState(data);
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
        let format_start = data[2] + '-' + data[3];

        this.setState({
            fromDate: format_start,
            toDate: null,
        });
        
        if(end_date === null) return;

        end_date = end_date.toString();
        data = end_date.split(' ');
        let format_end = data[2] + '-' + data[3];

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
    applyFilters()
    {
        const { curApplied, filtersChecked, toDate, fromDate, needApply } = this.state;
        
        if(!needApply) return; 

        this.setState({
            needApply: false,
            lastApplied: curApplied
        });
        
        // If filter isn't checked, stop
        if(!filtersChecked || toDate === null || fromDate === null) return; 

        // Set loading screen and callback request
        this.props.changeProps({isLoaded: false});
        
        this.setState
        ( {expandFilters: false}, this.formatJsonRequest );
    }

    // Callback for creating a request, called also on initialization
    formatJsonRequest()
    {
        const { curApplied } = this.state;

        // Filter data for backend query request
        const obj = 
        {
            type: 'station',
            fromDate: '',
            toDate: ''
        };
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Sends a request to server
    serverRequest()
    {
        // Change the json to a string and send the request
        const jsonRequest = JSON.stringify(this.state.filters); 
        //socket.send(jsonRequest);
    }

    render() 
    {
        const { expandFilters, needApply, toDate, fromDate, linkStations, isCreate } = this.state;
        const { stationID } = this.props.params;

        return (
            <div className={anims.fade_class}>
                <div className={styles.container}>
                    <div className={styles.station_header}>

                        <p>#{stationID} Töölöntulli</p>
                        <p className={styles.station_address}>Hanasaarenranta 1</p>

                        <div className={styles.station_map}>

                            < GoogleMaps 
                                data = {this.state} 
                                isJourney={linkStations}
                                isCreate={isCreate}
                                changeProps = {this.changeProps} 
                            />

                        </div>
                    </div>

                    <div className={styles.station_stats}>

                        <p className={styles.station_stats_title}>Station statistics</p>
                        
                        {/* When user clicks cogwheel => expand it <DateFormat />*/}
                        <div>
                            <FontAwesomeIcon 
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
                                                <button onClick={() => this.applyFilters()} className={`${needApply === true ? styles.f_apply : styles.f_applyDark} `}>Apply</button>
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
                                <li><p>299</p></li>
                            </ul>

                            <ul className={styles.stats_list}>
                                <li><p>Journeys from this station</p></li>
                                <li><p>299</p></li>
                            </ul>

                            <ul className={styles.stats_list}>
                                <li><p>Average distance traveled to this station</p></li>
                                <li><p>2.23km</p></li>
                            </ul>

                            <ul className={styles.stats_list}>
                                <li><p>Average distance traveled from this station</p></li>
                                <li><p>5.23km</p></li>
                            </ul>

                            <p className={styles.list_head}>Most popular return stations starting here:</p>
                            <ol>
                                <li>Keilalahti</li>
                                <li>Revontulentie</li>
                                <li>Keilalahti</li>
                                <li>Revontulentie</li>
                                <li>Revontulentie</li>
                            </ol>

                            <p className={styles.list_head}>Most popular departure stations ending here:</p>
                            <ol>
                                <li>Hakalehto</li>
                                <li>Oravannahkatori</li>
                                <li>Hakalehto</li>
                                <li>Oravannahkatori</li>
                                <li>Oravannahkatori</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withParams(Station);