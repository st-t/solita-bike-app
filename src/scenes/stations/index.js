import React, { Component } from 'react'
import socket from '../../addons/socket';
import styles from './index.module.css';
import anims from '../anims.module.css';
import NewList from '../list_component';


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
            list_type : 'station',

            // Sorting settings (no sorting for this list)
            sortColumn: 1,
            have_sort: [false, false, false, false],
            sort_columns: [false, false, false, false],

            // List column titles
            columns: ['#', 'Station', 'Longitude', 'Latitude'],

            // List column data
            column_data: [ [], [], [], [] ],

            // Station ids
            station_ids: [ [] ],

            // How much entries to fetch
            fetchEntriesAmount: 100,

            // Last fetched rowID
            lastFetchID: 0,

            // Data for each pages
            currentPage: 1, pageEntries: 20, expandJourney: 0, totalRows: 0, firstRow: 0,
            displayFilters: false, expandFilters: false, calledLast: false, scrolledPage: 0,
            wentToLast: false, actualScrolled: 0, linkStations: false,

            // Filters 
            filters: {},
            needApply: false, displayNoResults: false,
            goToLast: false, goingToLast: false,
            lastApplied: [], curApplied: [], 
            pagesToLoad: '5', resultsForPage: '20', search: ''
        };

        this.changeProps = this.changeProps.bind(this);

        //this.sortCallback = this.sortCallback.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.changeLoading = this.changeLoading.bind(this);
        this.searchCallback = this.searchCallback.bind(this);
        //this.createDropdown = this.createDropdown.bind(this);
        this.constructRequest = this.constructRequest.bind(this);
    }

    // Sets loading screen
    changeLoading = (loadingState) => {
        this.props.changeProps({isLoaded: loadingState});
    } 

    changeProps = (data) => {
        this.setState(data);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        // Display loading message
        this.props.changeProps({isLoaded: false});

        this.setState({
            lastFetchID: 0,
            scrolledPage: 0,
            calledLast: false, 
            displayFilters: false,
            fetchEntriesAmount: 100
        });

        // Start by fetching stations from database
        this.formatJsonRequest();
    }

    // Constructs a request for server
    constructRequest(obj)
    {
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Callback for search input
    searchCallback(search)
    {
        this.setState({ 
            search: search
        }, this.applyFilters);
    }

    // Called on this instance when client wants the first page
    applyFilters(last=false)
    {
        const { pagesToLoad, resultsForPage } = this.state;
        
        this.setState({
            pageEntries: resultsForPage,
            fetchEntriesAmount: (pagesToLoad * resultsForPage)
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

    // Callback for creating a request, called also on initialization
    formatJsonRequest()
    {
        const { 
            fetchEntriesAmount, lastFetchID, 
            goToLast, sortColumn, 
            actualScrolled, search

        } = this.state;

        // Filter data for backend query request
        const obj = 
        {
            type: 'stations',
            last: goToLast,
            prev: false,
            limit: fetchEntriesAmount,
            scrolled: actualScrolled,
            lastID: lastFetchID,
            sort: sortColumn,
            search: search
        };

        console.log('entries: %i', fetchEntriesAmount);
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Sends a request to server
    serverRequest()
    {
        // Change the json to a string and send the request
        const jsonRequest = JSON.stringify(this.state.filters); 
        socket.send(jsonRequest);

        // Close cogwheel
        // this.setState({goToLast: false, expandFilters: false});
    }

    render() {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>
                    
                    <NewList 
                    data = {this.state} 
                    changeProps = {this.changeProps} 
                    changeLoading = {this.changeLoading} 
                    constructRequest = {this.constructRequest} 
                    applyFilters = {this.applyFilters} 
                    searchCallback = {this.searchCallback} />

                </div>

            </div>
        );
    }
}