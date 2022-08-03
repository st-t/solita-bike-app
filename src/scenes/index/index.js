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
            
            // List type
            list_type : 'journey',

            // If client wants to sort by a column
            sortColumn: 1,
            have_sort: [true, true, true, true, true, false],
            sort_columns: [true, false, false, false, false, false],

            // List column titles
            columns: ['#', 'Departure Station', 'Return Station', 'Distance', 'Duration', 'Departure'],
            
            // List column data
            column_data: [ [], [], [], [], [], [], [], [], [], [] ],

            // How much entries to fetch
            fetchEntriesAmount: 100,

            // Last fetched rowID
            lastFetchID: 0,
            
            // Data for each pages
            station_ids: [ [], [] ],
            currentPage: 1, pageEntries: 20, 
            expandJourney: 0, totalRows: 0, 
            firstRow: 0, scrolledPage: 0, actualScrolled: 0,
            displayFilters: false, expandFilters: false, 
            calledLast: false, wentToLast: false, 
            linkStations: true, stopScroll: false,
            
            // Dropdowns stuff
            dropdownSecClosed: true, dropdownMeterClosed: true, 
            dropdownPagesClosed: true, dropdownResultsClosed: true, 
            metersChecked: false, secondsChecked: false,
            timeUnit: 'seconds', meterUnit: 'meters', resultsForPage: '20',

            // Filters 
            filters: {},
            needApply: false, displayNoResults: false,
            overSeconds: true, overMeters: true,
            goToLast: false, goingToLast: false,
            lastApplied: [], curApplied: [], 
            filterMeters: 0, filterSeconds: 0,
            pagesToLoad: '5', search: '',

            sqlConnected: false,
        };
        
        this.changeProps = this.changeProps.bind(this);
        this.sortCallback = this.sortCallback.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.changeLoading = this.changeLoading.bind(this);
        this.searchCallback = this.searchCallback.bind(this);
        this.createDropdown = this.createDropdown.bind(this);
        this.constructRequest = this.constructRequest.bind(this);
    }

    changeProps = (data) => {
        this.setState(data);
    }

    // Sets loading screen
    changeLoading = (loadingState) => {
        this.props.changeProps({isLoaded: loadingState});
    } 

    // Initialization(s) that requires DOM nodes should go here
    async componentDidMount() 
    {
        // Display loading message
        this.props.changeProps({isLoaded: false});

        this.setState({
            lastFetchID: 0,
            scrolledPage: 0,
            calledLast: false, 
            fetchEntriesAmount: 100
        });

        let arr = [
            this.state.timeUnit, this.state.meterUnit, 
            this.state.resultsForPage, this.state.pagesToLoad, 
            this.state.filterMeters, this.state.filterSeconds,
            this.state.overSeconds, this.state.overMeters,
            this.state.metersChecked, this.state.secondsChecked
        ];

        this.setState({lastApplied: arr});
        this.checkServer();

        // Listen the server for messages
        socket.on('message', async (msg) => 
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

                        // Start by fetching journeys from database
                        this.formatJsonRequest();
                    }
                }

                // There was no results
                if( obj.hasOwnProperty('null') )
                {
                    this.props.changeProps({isLoaded: true});
                        
                    if(this.state.goingToLast) 
                        this.setState( {goToLast: true, goingToLast: false} );
                    else 
                    {
                        this.setState( {
                            search: '',
                            metersChecked: false, 
                            secondsChecked: false, 
                            displayNoResults: true,
                            displayFilters: true
                        } );
                    } 
                }
            }
        });
    }

    // Check sql status 
    checkServer()
    {
        const obj = { type: 'check' };
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Client wants to see settings 
    handleFiltersExpansion()
    {
        this.setState({expandFilters: !this.state.expandFilters});
    }

    // Generates a dropdown(s) for filters
    createDropdown = (type) => 
    {
        let all = [];
        let values;
        
        // Specify which dropdown was clicked
        switch(type)
        {
            case 1: values = ['seconds ', 'minutes ', 'hours ']; break;
            case 2: values = ['meters ', 'kilometers ']; break;
            case 3: values = ['5', '10']; break;
            case 4: values = ['5', '10', '20', '50']; break;
            default: break;
        }

        for(let i = 0; i < values.length; i++) 
        {
            all.push(
                <span className={styles.item} onClick ={() => this.handleDropdown(values[i], type)} key={i}>
                    <p>{values[i]}</p>
                </span>
            )
        }
        return(all);
    }

    // Dropdown pressed handler
    handleDropdown(val, type)
    {
        // Specify which dropdown was clicked
        switch(type)
        {
            case 1:  
            {
                this.setState( {timeUnit: val}, this.handleApply );
                this.setState({dropdownSecClosed: false}); 
                break;
            }
            case 2:  
            {
                this.setState( {meterUnit: val}, this.handleApply );
                this.setState({dropdownMeterClosed: false}); 
                break;
            }
            case 3:  
            {
                this.setState( {pagesToLoad: val}, this.handleApply );
                this.setState({dropdownPagesClosed: false}); 
                break;
            }
            case 4:  
            {
                this.setState( {resultsForPage: val}, this.handleApply );
                this.setState({dropdownResultsClosed: false}); 
                this.setState({ fetchEntriesAmount: (val * this.state.pagesToLoad) });
                break;
            }
            default: break;
        }
    }

    // Check if we need to apply filters 
    handleApply()
    {
        const { 
            filterMeters, filterSeconds,
            pagesToLoad, resultsForPage,
            meterUnit, timeUnit,
            overSeconds, overMeters,
            metersChecked, secondsChecked
        } = this.state;

        let arr = [
            timeUnit, meterUnit, 
            resultsForPage, pagesToLoad, 
            filterMeters, filterSeconds,
            overSeconds, overMeters,
            metersChecked, secondsChecked
        ];

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
        this.setState({needApply: needToApply, displayNoResults: false});
    }

    // Client wants to apply filters 
    // Also called on occasions to refresh the results
    applyFilters(last=false)
    {
        const { pagesToLoad, resultsForPage, curApplied } = this.state;
        
        this.setState({
            pageEntries: resultsForPage,
            fetchEntriesAmount: (pagesToLoad * resultsForPage),
            needApply: false,
            lastApplied: curApplied,
            stopScroll: false,
        });

        // First reset our page
        const { column_data } = this.state;
        
        const arraylist = [];
        for (let i = 0; i < column_data.length; i++) arraylist.push( [] );
        
        // Set loading screen and callback request
        this.changeLoading(false);
        
        this.setState
        ({
            currentPage: 1,
            actualScrolled: 0,
            scrolledPage: 0,
            lastFetchID: 0,
            displayFilters: false,
            calledLast: last,
            column_data: arraylist,
            wentToLast: false
        }, this.formatJsonRequest );
    }

    // Callback for sorting columns
    sortCallback(sort)
    {
        this.setState({ 
            sortColumn: sort,
            scrolledPage: 0,
            actualScrolled: 0
        }, this.applyFilters);
    }

    // Callback for search input
    searchCallback(search)
    {
        this.setState({ 
            search: search
        }, this.applyFilters);
    }

    // Callback for creating a request, called also on initialization
    formatJsonRequest()
    {
        const { 
            filterMeters, filterSeconds,
            meterUnit, timeUnit,
            overSeconds, overMeters,
            metersChecked, secondsChecked,
            fetchEntriesAmount, lastFetchID, 
            goToLast, sortColumn, 
            actualScrolled, search,
            pageEntries

        } = this.state;

        // Filter data for backend query request
        const obj = 
        {
            type: 'journeys',
            last: goToLast,
            prev: false,
            distance: 
            {
                metersFilter: metersChecked, 
                over: overMeters,
                unit: meterUnit,
                amount: filterMeters
            },
            duration: 
            {
                secondsFilter: secondsChecked,
                over: overSeconds,
                unit: timeUnit,
                amount: filterSeconds
            },
            limit: fetchEntriesAmount,
            perPage: pageEntries,
            scrolled: actualScrolled,
            lastID: lastFetchID,
            sort: sortColumn,
            search: search
        };
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Constructs a request for server
    constructRequest(obj)
    {
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Sends a request to server
    serverRequest()
    {
        // Change the json to a string and send the request
        const jsonRequest = JSON.stringify(this.state.filters); 
        socket.send(jsonRequest);

        // Close cogwheel
        this.setState({goToLast: false, expandFilters: false, stopScroll: false});
    }

    // Handles filter clicks
    isOverMeters()
    {
        this.setState( {overMeters: !this.state.overMeters}, this.handleApply );
    }

    isOverSeconds()
    {
        this.setState( {overSeconds: !this.state.overSeconds}, this.handleApply );
    }

    // Client is writing a filter 
    handleFilterInput(e)
    {
        let input, attr;
        input = e.target.value;
        attr = e.target.attributes.getNamedItem('data-name').value;
        
        // Check if typed input is a valid number, and not text
        if( !isNaN(input) && !isNaN( parseFloat(input) ) )
        {
            // Limit the input lenght
            if(input.length > 6) return;

            // Input is valid => set state
            switch(attr)
            {
                case 'meters': this.setState( {filterMeters: input}, this.handleApply ); break;
                case 'seconds': this.setState( {filterSeconds: input}, this.handleApply ); break;
                default: break;
            }
        } 
        // Input wasn't a valid number 
        else
            return;
    }

    // Handles checkbox clicks
    handleChecked = e => 
    {
        const name = e.target.name;
        const checked = e.target.checked;

        // Set checkbox state and call a callback 
        this.setState( {[name]: checked}, this.handleApply );
    };

    // Render the page 
    render() 
    {
        const { displayFilters, expandFilters, 
                dropdownSecClosed, timeUnit, 
                pagesToLoad, needApply,
                filterMeters,filterSeconds,
                dropdownMeterClosed, meterUnit,
                dropdownPagesClosed, dropdownResultsClosed,
                resultsForPage, displayNoResults

            } = this.state;

        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>

                    <div className={styles.filter_list}>
                        
                        {/* Hide filters / search if page is loading */}
                        <div className={`${displayFilters ? styles.filters : styles.filters_hide} `} >

                            {/* When user clicks cogwheel => expand it */}
                            <div>
                                <FontAwesomeIcon 
                                onClick = {() => this.handleFiltersExpansion()} 
                                className={`${expandFilters === true ? styles.icon_filters_open : styles.icon_filters} `} icon={faCogs} size="2x" />
                            </div>

                            <div className={styles.journey_filters}>

                                {/* Expanded content */}
                                <div className = {`${expandFilters === true ? styles.filters_visible : styles.filters_hidden} `} >
                                    <div className = {`${expandFilters === true ? styles.filters_content_l : styles.filters_hidden} `} >

                                        <ul>
                                            <li>
                                                <input 
                                                className={styles.checkbox} 
                                                onChange={this.handleChecked} 
                                                name="metersChecked" 
                                                checked={this.state.metersChecked} 
                                                id="checkbox-1" 
                                                type="checkbox" 
                                                value="value1"/>
                                                <label htmlFor="checkbox-1">Filter journeys</label> 
                                            </li>
                                            <li>
                                                <div className={anims.toggle_div}>
                                                    <input className={`${anims.tgl} ${anims.tgl_flip}`} id="cb5" type="checkbox"/>
                                                    <label onClick={() => this.isOverMeters()} className={anims.tgl_btn} data-tg-off="over" data-tg-on="under" htmlFor="cb5"></label>
                                                </div>
                                            </li>
                                            <li>
                                                <div className={styles.f_searchWrap}>
                                                    <div className={styles.f_search}>
                                                        <input type="text" data-name="meters" onChange={this.handleFilterInput.bind(this)} className={styles.f_searchTerm} value={filterMeters} />
                                                    </div>
                                                </div>
                                            </li>

                                            <li>
                                                <label>
                                                    <button className={styles.input_pr} onClick={() => this.setState({dropdownMeterClosed: !dropdownMeterClosed})}>
                                                        {meterUnit}
                                                        <div className={styles.drop_arrow}>
                                                            <svg width="10" height="5"  fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0L5 5L10 0H0Z" fill="#AEAEAE"/>
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    <div className={styles.drop_abs_2}>
                                                        <div className={styles.dropdown} data-open={dropdownMeterClosed ? false : true} data-type="2">
                                                            {this.createDropdown(2)}
                                                        </div>
                                                    </div>
                                                </label>
                                            </li>
                                        </ul>

                                        <ul>
                                            <li>
                                                <input 
                                                className={styles.checkbox} 
                                                onChange={this.handleChecked} 
                                                name="secondsChecked" 
                                                checked={this.state.secondsChecked} 
                                                id="checkbox-2" 
                                                type="checkbox" 
                                                value="value1"/>
                                                <label htmlFor="checkbox-2">Filter journeys</label> 
                                            </li>
                                            <li>
                                                <div className={anims.toggle_div}>
                                                    <input className={`${anims.tgl} ${anims.tgl_flip}`} id="cb6" type="checkbox"/>
                                                    <label onClick={() => this.isOverSeconds()} className={anims.tgl_btn} data-tg-off="over" data-tg-on="under" htmlFor="cb6"></label>
                                                </div>
                                            </li>
                                            <li>
                                                <div className={styles.f_searchWrap}>
                                                    <div className={styles.f_search}>
                                                        <input type="text" data-name="seconds" onChange ={this.handleFilterInput.bind(this)} className={styles.f_searchTerm} value={filterSeconds} />
                                                    </div>
                                                </div>
                                            </li>

                                            <li>
                                                <label className = {`${dropdownMeterClosed === true ? styles.null : styles.hide} `}>
                                                    <button className={styles.input_pr} onClick={() => this.setState({dropdownSecClosed: !dropdownSecClosed})}>
                                                        {timeUnit}
                                                        <div className={styles.drop_arrow}>
                                                            <svg width="10" height="5"  fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0L5 5L10 0H0Z" fill="#AEAEAE"/>
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    <div className={styles.drop_abs_1}>
                                                        <div className={styles.dropdown} data-open={dropdownSecClosed ? false : true} data-type="1">
                                                            {this.createDropdown(1)}
                                                        </div>
                                                    </div>
                                                </label>
                                            </li>

                                        </ul>

                                        <ul>
                                            <li>
                                                <label htmlFor="styled-checkbox-1">Results per page:</label> 
                                            </li>

                                            <li>
                                                <label>
                                                    <button className={styles.input_pr} onClick={() => this.setState({dropdownResultsClosed: !dropdownResultsClosed})}>
                                                        {resultsForPage}
                                                        <div className={styles.drop_arrow}>
                                                            <svg width="10" height="5"  fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0L5 5L10 0H0Z" fill="#AEAEAE"/>
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    <div className={styles.drop_abs_4}>
                                                        <div className={styles.dropdown} data-open={dropdownResultsClosed ? false : true} data-type="4">
                                                            {this.createDropdown(4)}
                                                        </div>
                                                    </div>
                                                </label>
                                            </li>
                                        </ul>

                                        <ul>
                                            <li>
                                                <label htmlFor="styled-checkbox-1">Pages to load:</label> 
                                            </li>
                                            <li>
                                                <label>
                                                    <button className={styles.input_pr} onClick={() => this.setState({dropdownPagesClosed: !dropdownPagesClosed})}>
                                                        {pagesToLoad}
                                                        <div className={styles.drop_arrow}>
                                                            <svg width="10" height="5"  fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M0 0L5 5L10 0H0Z" fill="#AEAEAE"/>
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    <div className={styles.drop_abs_3}>
                                                        <div className={styles.dropdown} data-open={dropdownPagesClosed ? false : true} data-type="3">
                                                            {this.createDropdown(3)}
                                                        </div>
                                                    </div>
                                                </label>
                                            </li>
                                            <li></li>
                                            <li>
                                                <button onClick={() => this.applyFilters()} className={`${needApply === true ? styles.f_apply : styles.f_applyDark} `}>Apply</button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Search has failed */}
                    <div className={`${displayNoResults === true ? styles.no_results : styles.hide_res} `}>
                        No results. Check your search filters.
                    </div>
                    
                    {/* Render journeys */}
                    <NewList data = {this.state} 
                    changeProps = {this.changeProps} 
                    applyFilters = {this.applyFilters}
                    sortCallback = {this.sortCallback}
                    changeLoading = {this.changeLoading}  
                    constructRequest = {this.constructRequest}
                    searchCallback = {this.searchCallback}
                    />
                    
                </div>
            </div>
        )
    }
}