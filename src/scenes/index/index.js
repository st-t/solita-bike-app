import React, { Component } from 'react';
import socket from '../../addons/socket';
import styles from './index.module.css';
import anims from '../anims.module.css';
import NewList from '../list_component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'; 


export default class index extends Component 
{  
    constructor(props) 
    {
        super(props);

        // Some states to keep our clients happy
        this.state = 
        {
            data:{},

            // If client wants to sort by a column
            sort_columns: [false, false, false, false, false, false],
            
            // List column titles
            columns: ['#', 'Departure Station', 'Return Station', 'Distance', 'Duration', 'Departure'],
            
            // List column data
            column_data: [ [], [], [], [], [], [] ],

            // How much entries to fetch
            fetchEntriesAmount: 100,

            // Last fetched rowID
            lastFetchID: 0,
            
            // Data for each pages
            currentPage: 1, pageEntries: 20, expandJourney: 0,
            displayFilters: false, expandFilters: false, calledLast: false, scrolledPage: 0
        };

        // Handle props
        this.changeProps = this.changeProps.bind(this);
    }

    changeProps = (data) => {
        this.setState(data);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        // Display loading message
        this.props.changeProps({isLoaded: false});

        this.setState({lastFetchID: 0})
        this.setState({fetchEntriesAmount: 100})
        this.setState({scrolledPage: 0})
        this.setState({calledLast: false})

        // Fetch journeys from database
        // Called everytime client lands on index page but that's fine
        // Queries are very fast since we're showing only 100 at a time and table structure is optimized
        socket.send('[journeys] ' + this.state.fetchEntriesAmount);

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
                if( obj.hasOwnProperty('journeys') )
                {
                    //var i = 0;
                    // Display loading message
                    this.props.changeProps({isLoaded: false});

                    // Handle json data
                    this.handleServerMessage(obj);
                    
                    // Some logic for displaying correct page numbers 
                    if(this.state.scrolledPage < 1)
                        this.setState({currentPage: 1});
                    else
                        this.setState({currentPage: 1 + (this.state.pageEntries * this.state.scrolledPage)});

                    if(this.state.calledLast)
                    {
                        var numPages = (this.state.fetchEntriesAmount / this.state.pageEntries);
                        this.setState( { scrolledPage: Math.floor( (this.state.lastFetchID / (this.state.pageEntries * numPages) ) ) } );
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
                    this.setState({calledLast: true});
                    socket.send('[last] ' + this.state.fetchEntriesAmount);
                }
            }
        });
    }

    // Handle server response
    handleServerMessage = (obj) => 
    {
        for (var key in obj.journeys) 
        {
            if(obj.journeys.hasOwnProperty(key)) 
            {
                //i++;
                var id = key;
                this.setState({lastFetchID: id})
                this.state.column_data[0].push(id);

                for(var attr in obj.journeys[key]) 
                {
                    //console.log(id + " " + attr + " -> " + obj.journeys[key][attr]);

                    switch(attr)
                    {
                        case "dstation": 
                        {
                            this.state.column_data[1].push(obj.journeys[key][attr]);
                            break;
                        }
                        case "rstation": 
                        {
                            this.state.column_data[2].push(obj.journeys[key][attr]);
                            break;
                        }
                        case "distance": 
                        {
                            this.state.column_data[3].push(obj.journeys[key][attr]);
                            break;
                        }
                        case "duration":
                        {
                            this.state.column_data[4].push(obj.journeys[key][attr]);
                            break;
                        }
                        case "departure":
                        {
                            this.state.column_data[5].push(obj.journeys[key][attr]);
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
        console.log('clicked filter expand'); 
    }

    // Render the page 
    // <table className={`${styles.container} ${styles.container}`}>
    render() 
    {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>

                    <div className={styles.filter_list}>
                        
                        {/* Hide filters / search if page is loading */}
                        <div className={`${this.state.displayFilters ? styles.filters : styles.filters_hide} `} >

                            {/* When user clicks cogwheel => expand it */}
                            <div>
                                <FontAwesomeIcon 
                                onClick = {() => this.handleFiltersExpansion()} 
                                className={styles.icon_filters} icon={faCogs} size="2x" />
                            </div>

                            <div className={styles.journey_filters}>

                                {/* Expanded content */}
                                <div className = {`${this.state.expandFilters === false ? styles.filters_visible : styles.filters_hidden} `} >
                                    <div className = {`${this.state.expandFilters === false ? styles.filters_content_l : styles.filters_hidden} `}>

                                        <ul>
                                            <li>
                                                <input className={styles.checkbox} id="styled-checkbox-1" type="checkbox" value="value1"/>
                                                <label htmlFor="styled-checkbox-1">Filter journeys</label> 
                                            </li>
                                            <li>
                                                <div className={anims.toggle_div}>
                                                    <input className={`${anims.tgl} ${anims.tgl_flip}`} id="cb5" type="checkbox"/>
                                                    <label className={anims.tgl_btn} data-tg-off="over" data-tg-on="under" htmlFor="cb5"></label>
                                                </div>
                                            </li>
                                            <li>
                                                <div className={styles.f_searchWrap}>
                                                    <div className={styles.f_search}>
                                                        <input type="text" className={styles.f_searchTerm} placeholder="amount" />
                                                    </div>
                                                </div>
                                            </li>

                                            <li>
                                                <label>meters</label>
                                            </li>
                                        </ul>

                                        <ul>
                                            <li>
                                                <input className={styles.checkbox} id="styled-checkbox-2" type="checkbox" value="value1"/>
                                                <label htmlFor="styled-checkbox-2">Filter journeys</label> 
                                            </li>
                                            <li>
                                                <div className={anims.toggle_div}>
                                                    <input className={`${anims.tgl} ${anims.tgl_flip}`} id="cb6" type="checkbox"/>
                                                    <label className={anims.tgl_btn} data-tg-off="over" data-tg-on="under" htmlFor="cb6"></label>
                                                </div>
                                            </li>
                                            <li>
                                                <div className={styles.f_searchWrap}>
                                                    <div className={styles.f_search}>
                                                        <input type="text" className={styles.f_searchTerm} placeholder="amount" />
                                                    </div>
                                                </div>
                                            </li>

                                            <li>
                                                <label>seconds</label>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Render journeys */}
                    <NewList data = {this.state} changeProps = {this.changeProps}  />
                    
                </div>
            </div>
        )
    }
}