import React, { Component, useState, useEffect } from 'react';
import socket from '../../addons/socket';
import styles from './index.module.css';
import anims from '../anims.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import { faCaretRight } from '@fortawesome/free-solid-svg-icons';

var lastFetchID = 0;            // ID we last fetched
var scrolledPage = 0;           // Used on pagination
var fetchEntriesAmount = 100    // How many entries to fetch at a time 
var calledLast = false;         // Load last page?


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
            currentPage: 1, pageEntries: 20, expandJourney: 0,
            IDs: [], stations: [], returnStations: [], distances: [], durations: [], departures: [],

            displayFilters: false
        };
        
        // Handle pagination clicks
        this.handlePage = this.handlePage.bind(this);

        // Handle jorney entry clicks
        this.handleJourneyExpansion = this.handleJourneyExpansion.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        // Display loading message
        this.props.changeProps({isLoaded: false});

        lastFetchID = 0;
        scrolledPage = 0;
        fetchEntriesAmount = 100 
        calledLast = false;

        // Fetch journeys from database
        // Called everytime client lands on index page but that's fine
        // Queries are very fast since we're showing only 100 at a time and table structure is optimized
        socket.send('[journeys] ' + fetchEntriesAmount);

        // Listen the server for messages
        socket.on('message', (msg) => 
        {
            this.setState({data:msg})
            this.setState({displayFilters: false});

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
                            lastFetchID = id;
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
                    
                    // Some logic for displaying correct page numbers 
                    // Might look a bit confusing but its a done deal
                    if(scrolledPage < 1)
                        this.setState({currentPage: 1});
                    else
                        this.setState({currentPage: 1 + (this.state.pageEntries * scrolledPage)});

                    if(calledLast)
                    {
                        var numPages = (fetchEntriesAmount / this.state.pageEntries);
                        scrolledPage = Math.floor((lastFetchID / (this.state.pageEntries * numPages) ) );
                        this.setState({currentPage: numPages});
                    }
                    else 
                        this.setState({currentPage: 1});
                    
                    this.props.changeProps({isLoaded: true});
                    this.setState({displayFilters: true});
                }

                // There was no results
                // Return to last page 
                if(obj.hasOwnProperty('null'))
                {
                    calledLast = true;
                    socket.send('[last] ' + fetchEntriesAmount);
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
        {
            // If we are on the first page, just do 1 2 3 4..
            // Otherwise divide entires / pageEntries * how many times we scrolled to get the correct num
            if(scrolledPage < 1)
                pageNumbers.push(i);
            else 
                pageNumbers.push(i + ( (fetchEntriesAmount / pageEntries) * scrolledPage ) );
        }

        const pages = pageNumbers.map(number => 
        {
            return (
                <li className={`${(this.state.currentPage + ((fetchEntriesAmount / pageEntries) * scrolledPage) ) === number ? styles.pageActive : styles.pageIncrement} `}
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
        const { pageEntries } = this.state;
        
        // Logic for calculating current page
        this.setState({
            currentPage: Number(event.target.id) - ((fetchEntriesAmount / pageEntries) * scrolledPage)
        });
    }

    // Handle journey clicks
    handleJourneyExpansion = (num) => { 
        
        // Client clicked an expanded column => close it 
        if(num == this.state.expandJourney)
        {
            this.setState({expandJourney: 0 });
            return; 
        }

        this.setState({expandJourney: num});
    }

    // Client wants to return a page
    previousPages(last)
    {
        // We are on the first page. We can't go back.
        if(scrolledPage == 0)
            return;

        this.setState({currentPage: 1});
        this.setState({IDs: []});
        this.setState({stations: []});
        this.setState({returnStations: []});
        this.setState({distances: []});
        this.setState({durations: []});
        this.setState({departures: []});
        this.setState({displayFilters: false});
        this.props.changeProps({isLoaded: false});

        // If client wants to scroll all the way to beginning
        if(!last)
        {
            calledLast = false;
            scrolledPage -= 1;
            lastFetchID -= fetchEntriesAmount * 2;
        }
        else 
        {
            calledLast = false;
            lastFetchID = 0;
            scrolledPage = 0;
        }

        // Send the command to server
        socket.send('[next] ' + lastFetchID + ' ' + fetchEntriesAmount);
    }

    // Client wants more pages, fetch them 
    nextPages(last)
    {
        // We are on the very last page, don't go further.
        if(calledLast)
            return;

        this.setState({currentPage: 1});
        this.setState({IDs: []});
        this.setState({stations: []});
        this.setState({returnStations: []});
        this.setState({distances: []});
        this.setState({durations: []});
        this.setState({departures: []});
        this.setState({displayFilters: false});
        this.props.changeProps({isLoaded: false});

        if(!last)
        {
            calledLast = false;
            scrolledPage += 1;
            socket.send('[next] ' + lastFetchID + ' ' + fetchEntriesAmount);
        }

        // Client wants to see the very last page 
        else 
        {
            calledLast = true;
            socket.send('[last] ' + fetchEntriesAmount);
        }
    }

    // Render the page 
    // <table className={`${styles.container} ${styles.container}`}>
    render() 
    {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>
                    
                    <div className={styles.list}>
                        
                        {/* Hide filters / search if page is loading */}
                        <div className={`${this.state.displayFilters ? styles.filters : styles.filters_hide} `} >
                            <div className={styles.searchWrap}>
                                <div className={styles.search}>
                                    <input type="text" className={styles.searchTerm} placeholder="search" />
                                    <button type="submit" className={styles.searchButton}>
                                        <FontAwesomeIcon className={styles.icon} icon={faSearch} />
                                    </button>
                                </div>
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
                        <li>
                            <FontAwesomeIcon className={`${scrolledPage === 0 ? styles.pageSkipDeactivated : styles.pageSkip} `}
                            icon={faCaretLeft} onClick = { () => this.previousPages(true)} />
                        </li>
                        <li>
                            <FontAwesomeIcon className={`${scrolledPage === 0 ? styles.pageSkipDeactivated : styles.pageScroller} `}
                            icon={faAngleLeft} onClick = { () => this.previousPages(false)} />
                        </li>
                        {this.renderPages()}
                        <li>
                            <FontAwesomeIcon className={`${calledLast === true ? styles.pageSkipDeactivated : styles.pageScroller} `}
                            icon={faAngleRight} onClick = { () => this.nextPages(false)} />
                        </li>
                        <li>
                            <FontAwesomeIcon className={`${calledLast === true ? styles.pageSkipDeactivated : styles.pageSkip} `}
                            icon={faCaretRight} onClick = { () => this.nextPages(true)} />
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
}