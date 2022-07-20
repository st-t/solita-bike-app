import React, { Component, useState, useEffect } from 'react';
import socket from '../../addons/socket';
import styles from './index.module.css';
import anims from '../anims.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp } from '@fortawesome/free-solid-svg-icons';



export default class index extends Component 
{  
    constructor(props) 
    {
        super(props);

        // Some states to keep our clients happy
        this.state = 
        {
            // If client wants to sort by a column
            sort_columns: [false, false, false, false, false, false],
            
            // Data for each pages
            currentPage: 1, pageEntries: 10, expandJourney: 0,
            IDs: [], stations: [], returnStations: [], distances: [], durations: [], departures: []
        };
        
        // Handle pagination clicks
        this.handlePage = this.handlePage.bind(this);

        // Handle jorney entry clicks
        this.handleJourneyExpansion = this.handleJourneyExpansion.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        // Set loaded true
        this.props.changeProps({isLoaded: true});

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

                // We have some data 
                if(obj.hasOwnProperty('connection'))
                {
                    console.log('>> socket response: ' + String(obj.connection) ); 
                }

                // We recieved journey data
                if(obj.hasOwnProperty('journeys'))
                {
                    var i = 0;

                    for (var key in obj.journeys) 
                    {
                        if(obj.journeys.hasOwnProperty(key)) 
                        {
                            i++;
                            var id = key;
                            this.state.IDs.push(id);

                            for(var attr in obj.journeys[key]) 
                            {
                                //console.log(id + " " + attr + " -> " + obj.journeys[key][attr]);

                                switch(attr)
                                {
                                    case "dstation": 
                                    {
                                        this.state.stations.push(obj.journeys[key][attr]);
                                        break;
                                    }
                                    case "rstation": 
                                    {
                                        this.state.returnStations.push(obj.journeys[key][attr]);
                                        break;
                                    }
                                    case "distance": 
                                    {
                                        this.state.distances.push(obj.journeys[key][attr]);
                                        break;
                                    }
                                    case "duration":
                                    {
                                        this.state.durations.push(obj.journeys[key][attr]);
                                        break;
                                    }
                                    case "departure":
                                    {
                                        this.state.departures.push(obj.journeys[key][attr]);
                                        break;
                                    }
                                    default: break;
                                }
                            }
                        }
                    }
                    this.setState({currentPage: 1});
                }
            }
        });
    }

    // Clients wants to sort by column
    handleSort(el, state_var, column)
    {
        var arr = [];

        // Loop column indexes (6 columns)
        for(let i=0 ; i <= 5 ; i++)
        {
            // This will set all other columns false (except the one client clicked)
            // since we are not sorting 2 columns at the same time 
            if(!(i===column) && el) arr.push(false);
            else arr.push(!state_var);
        }

        // Set the state array that we just made 
        this.setState({sort_columns: arr});
    }

    // Renders journeys of selected page on the pagination
    renderJourneys()
    {
        const { stations, currentPage, pageEntries } = this.state;

        // Logic for paginating entries
        const indexLast = currentPage * pageEntries;
        const indexFirst = indexLast - pageEntries;
        const currentEntries = stations.slice(indexFirst, indexLast);

        const mapJourneys = currentEntries.map((station, index) => 
        {
            let idx = currentPage * pageEntries - pageEntries;
            
            return (
                <ul key={idx + index}
                    id = {this.state.IDs[idx + index]} 
                    onClick = { () => this.handleJourneyExpansion(this.state.IDs[idx + index])}>
                    
                    {/* When user clicks an entry => expand it */}
                    <li className={`${this.state.expandJourney === this.state.IDs[idx + index] ? styles.entry_ex : styles.entry} `} >

                        #{this.state.IDs[idx + index]}
                        <p className={styles.journey}></p>

                        {/* Expanded content */}
                        <div className = {`${this.state.expandJourney === this.state.IDs[idx + index] ? styles.entry_visible : styles.entry_hidden} `} >
                            <div className = {`${this.state.expandJourney === this.state.IDs[idx + index] ? styles.entry_content_l : styles.entry_hidden} `}>
                                content_left
                            </div>

                            <div className={`${this.state.expandJourney === this.state.IDs[idx + index] ? styles.entry_content_r : styles.entry_hidden} `}>
                                content_right
                            </div>
                        </div>
                    </li>

                    <li className={styles.entry}>{station}
                        <p>Departure Station</p>
                    </li>
                    <li className={styles.entry}>{this.state.returnStations[idx + index]}
                        <p>Return Station</p>
                    </li>
                    <li className={styles.entry}>{this.state.distances[idx + index]}
                        <p>Distance</p>
                    </li>
                    <li className={styles.entry}>{this.state.durations[idx + index]}
                        <p>Duration</p>
                    </li>
                    <li className={styles.entry}>{this.state.departures[idx + index]}
                        <p>Departure</p>
                    </li>
                </ul>
            );
        });

        return mapJourneys;
    }

    // Render page numbers (pagination)
    renderPages()
    {
        const pageNumbers = [];
        const { stations, pageEntries } = this.state;

        for (let i = 1; i <= Math.ceil(stations.length / pageEntries); i++)
            pageNumbers.push(i);

        const pages = pageNumbers.map(number => 
        {
            return (
                <li className={`${this.state.currentPage === number ? styles.pageActive : styles.pageIncrement} `}
                    key={number}
                    id={number}
                    onClick={this.handlePage}
                >
                    {number}
                </li>
            );
        });

        return pages;
    }

    // Handle page clicks
    handlePage(event) 
    {
        this.setState({
            currentPage: Number(event.target.id)
        });
    }

    // Handle journey clicks
    handleJourneyExpansion = (num) => { 
        
        // Client clicked an expanded column => close it 
        if(num == this.state.expandJourney)
        {
            this.setState({expandJourney: 0 });
            console.log('Closing expansion: ' + this.state.expandJourney + ' : ' + num);
            return; 
        }

        this.setState({expandJourney: num});
        console.log('Expanding: ' + this.state.expandJourney + ' : ' + num);
    }

    // Render the page 
    // <table className={`${styles.container} ${styles.container}`}>
    render() 
    {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>
                    
                    <div className={styles.list}>
                        
                        <div className={styles.searchWrap}>
                            <div className={styles.search}>
                                <input type="text" className={styles.searchTerm} placeholder="search" />
                                <button type="submit" className={styles.searchButton}>
                                    <FontAwesomeIcon className={styles.icon} icon={faSearch} />
                                </button>
                            </div>
                        </div>

                        <ul className={styles.list_header}>
                            <li>#
                                { this.state.sort_columns[0] === true 
                                ? <FontAwesomeIcon className={styles.sort_icon} icon={faAngleUp} onClick = { e => this.handleSort(e, this.state.sort_columns[0], 0)} /> 
                                : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.state.sort_columns[0], 0)} /> }
                            </li>
                            
                            <li>Departure Station 
                                { this.state.sort_columns[1] === true 
                                ? <FontAwesomeIcon className={styles.sort_icon} icon={faAngleUp} onClick = { e => this.handleSort(e, this.state.sort_columns[1], 1)} /> 
                                : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.state.sort_columns[1], 1)} /> }
                            </li>

                            <li>Return Station 
                                { this.state.sort_columns[2] === true 
                                ? <FontAwesomeIcon className={styles.sort_icon} icon={faAngleUp} onClick = { e => this.handleSort(e, this.state.sort_columns[2], 2)} /> 
                                : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.state.sort_columns[2], 2)} /> }
                            </li>

                            <li>Distance 
                                { this.state.sort_columns[3] === true 
                                ? <FontAwesomeIcon className={styles.sort_icon} icon={faAngleUp} onClick = { e => this.handleSort(e, this.state.sort_columns[3], 3)} /> 
                                : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.state.sort_columns[3], 3)} /> }
                            </li>

                            <li>Duration 
                                { this.state.sort_columns[4] === true 
                                ? <FontAwesomeIcon className={styles.sort_icon} icon={faAngleUp} onClick = { e => this.handleSort(e, this.state.sort_columns[4], 4)} /> 
                                : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.state.sort_columns[4], 4)} /> }
                            </li>

                            <li>Departure 
                                { this.state.sort_columns[5] === true 
                                ? <FontAwesomeIcon className={styles.sort_icon} icon={faAngleUp} onClick = { e => this.handleSort(e, this.state.sort_columns[5], 5)} /> 
                                : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.state.sort_columns[5], 5)} /> }
                            </li>
                        </ul>
                        
                        {/* Journey pagination */}
                        {this.renderJourneys()}
                        
                    </div>

                    {/* Page numbers */}
                    <ul className={styles.pages}>
                        {this.renderPages()}
                    </ul>
                </div>
            </div>
        )
    }
}