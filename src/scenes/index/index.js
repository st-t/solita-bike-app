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
            displayFilters: false, expandFilters: true, calledLast: false, scrolledPage: 0,
            
            // Dropdowns stuff
            dropdownSecClosed: true, dropdownMeterClosed: true, dropdownPagesClosed: true, dropdownResultsClosed: true,
            timeUnit: 'seconds', meterUnit: 'meters', resultsForPage: '20', metersChecked: false, secondsChecked: false,

            // Filters apply
            needApply: false, lastApplied: [], curApplied: [], 
            filterMeters: 0, filterSeconds: 0, overSeconds: true, overMeters: true,
            resultsPerPage: 20, pagesToLoad: '5'
        };
        
        this.changeProps = this.changeProps.bind(this);
        this.changeLoading = this.changeLoading.bind(this);
        this.createDropdown = this.createDropdown.bind(this);
    }

    changeProps = (data) => {
        this.setState(data);
    }

    changeLoading = (loadingState) => {
        this.props.changeProps({isLoaded: loadingState});
    } 

    // Initialization(s) that requires DOM nodes should go here
    async componentDidMount() 
    {
        // Display loading message
        this.props.changeProps({isLoaded: false});

        this.setState({lastFetchID: 0});
        this.setState({scrolledPage: 0});
        this.setState({calledLast: false});
        this.setState({fetchEntriesAmount: 100});

        let arr = [
            this.state.timeUnit, this.state.meterUnit, 
            this.state.resultsForPage, this.state.pagesToLoad, 
            this.state.filterMeters, this.state.filterSeconds,
            this.state.overSeconds, this.state.overMeters,
            this.state.metersChecked, this.state.secondsChecked
        ];

        this.setState({lastApplied: arr});

        // Fetch journeys from database
        // Called everytime client lands on index page but that's fine
        // Queries are very fast since we're showing only 100 at a time and table structure is optimized
        socket.send('[journeys] ' + this.state.fetchEntriesAmount);

        // Listen the server for messages
        socket.on('message', async (msg) => 
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
                    // Display loading message
                    this.props.changeProps({isLoaded: false});

                    // Handle json data
                    await this.handleServerMessage(obj);
                    
                    // Pull some state data to east the code
                    const { 
                        calledLast, 
                        scrolledPage, 
                        pageEntries,
                        fetchEntriesAmount,
                        lastFetchID
            
                    } = this.state;
                    
                    // Some logic for displaying correct page numbers 
                    if(scrolledPage < 1)
                        this.setState({currentPage: 1});
                    else
                        this.setState({currentPage: 1 + (pageEntries * scrolledPage)});

                    if(calledLast)
                    {
                        var numPages = (fetchEntriesAmount / pageEntries);
                        this.setState({ scrolledPage: Math.floor( (lastFetchID / (pageEntries * numPages) ) ) });
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
    async handleServerMessage(obj) 
    {
        var lastID = 0;
        const { column_data } = this.state;

        for(var key in obj.journeys) 
        {
            if( obj.journeys.hasOwnProperty(key) ) 
            {
                lastID = id;
                var id = key;
                column_data[0].push(id);

                for( var attr in obj.journeys[key] ) 
                {
                    //console.log(id + " " + attr + " -> " + obj.journeys[key][attr]);

                    switch(attr)
                    {
                        case "dstation": 
                        {
                            column_data[1].push( obj.journeys[key][attr] );
                            break;
                        }
                        case "rstation": 
                        {
                            column_data[2].push( obj.journeys[key][attr] );
                            break;
                        }
                        case "distance": 
                        {
                            column_data[3].push( obj.journeys[key][attr] );
                            break;
                        }
                        case "duration":
                        {
                            column_data[4].push( obj.journeys[key][attr] );
                            break;
                        }
                        case "departure":
                        {
                            column_data[5].push( obj.journeys[key][attr] );
                            break;
                        }
                        default: break;
                    }
                }
            }
        }

        if(lastID++) this.setState({lastFetchID: lastID});
    }

    // Client wants to see settings 
    handleFiltersExpansion()
    {
        this.setState({expandFilters: !this.state.expandFilters});
        console.log('clicked filter expand'); 
    }

    // Generates a dropdown for filters
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
                this.setState({fetchEntriesAmount: (val * this.state.pagesToLoad)});
                break;
            }
                
            default: break;
        }
    }

    // Handle if we need to apply filters 
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
        const { curApplied, lastApplied } = this.state;

        let needToApply = false;

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
        this.setState({needApply: false});
        this.setState({lastApplied: this.state.curApplied});
        
        const { 
            filterMeters, filterSeconds,
            pagesToLoad, resultsForPage,
            meterUnit, timeUnit,
            overSeconds, overMeters,
            metersChecked, secondsChecked,
            fetchEntriesAmount
        } = this.state;
        
        this.setState({resultsPerPage: resultsForPage});
        this.setState({fetchEntriesAmount: (pagesToLoad * resultsForPage)});

        const obj = {limit: fetchEntriesAmount, stuff: 30};
        const jsonRequest = JSON.stringify(obj); 
        socket.send(jsonRequest);
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
    // <table className={`${styles.container} ${styles.container}`}>
    render() 
    {
        const { displayFilters, 
                expandFilters, 
                dropdownSecClosed, 
                timeUnit, 
                pagesToLoad, 
                needApply,
                filterMeters,
                filterSeconds,
                dropdownMeterClosed,
                meterUnit,
                dropdownPagesClosed,
                dropdownResultsClosed,
                resultsForPage
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
                                                        <input type="text" data-name="meters" onChange ={this.handleFilterInput.bind(this)} className={styles.f_searchTerm} value={filterMeters} />
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
                                                    <div className={styles.dropdown} data-open={dropdownMeterClosed ? false : true} data-type="2">
                                                        {this.createDropdown(2)}
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
                                                    <div className={styles.dropdown} data-open={dropdownSecClosed ? false : true} data-type="1">
                                                        {this.createDropdown(1)}
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
                                                    <div className={styles.dropdown} data-open={dropdownResultsClosed ? false : true} data-type="4">
                                                        {this.createDropdown(4)}
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
                                                    <div className={styles.dropdown} data-open={dropdownPagesClosed ? false : true} data-type="3">
                                                        {this.createDropdown(3)}
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
                    
                    {/* Render journeys */}
                    <NewList data = {this.state} changeProps = {this.changeProps} changeLoading = {this.changeLoading}  />
                    
                </div>
            </div>
        )
    }
}