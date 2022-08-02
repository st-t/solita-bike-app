

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GoogleMaps from './maps';
import socket from '../addons/socket';
import styles from './list.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, 
        faAngleDown, 
        faAngleUp, 
        faAngleLeft, 
        faAngleRight, 
        faCaretLeft, 
        faCaretRight } from '@fortawesome/free-solid-svg-icons'; 


var columnNum = 0;
var expandedColumns = [];


export default class NewList extends Component {

    constructor(props) 
    {
        super(props);

        this.state = 
        {
            data:{},
            test: '200 OK',
            pressed: 0,
            canLoad: false,
            mapPreview: false,
        }

        // Handle pagination clicks
        this.handlePage = this.handlePage.bind(this);

        // Handle column entry clicks
        this.handleColumnExpansion = this.handleColumnExpansion.bind(this);
        this.changeProps = this.changeProps.bind(this);
    }

    changeProps = (data) => {
        this.setState(data);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        // Listen the server for messages
        socket.on('message', async (msg) => 
        {
            this.setState({data:msg})
            this.changeProps({displayFilters: false});

            // Message from socketio 
            let json_response = this.state.data; 

            // Pagination handle
            let handlePagination = false;

            // Check if we got some data and not an empty object
            if( String( typeof(json_response) ) === 'string' )
            {
                // Parse the json string 
                const obj = JSON.parse(json_response);

                // We recieved journey data
                if( obj.hasOwnProperty('journeys') )
                {
                    // Display loading message
                    this.props.changeLoading(false);

                    // Handle json data
                    await this.handleJourneyData(obj);
                    handlePagination = true;
                }

                // We recieved stations data
                if( obj.hasOwnProperty('stations') )
                {
                    // Display loading message
                    this.props.changeLoading(false);

                    // Handle json data
                    await this.handleStationData(obj);
                    handlePagination = true;
                }
                
                // Some logic for displaying correct page numbers 
                if(handlePagination)
                {
                    const { 
                        calledLast, scrolledPage, 
                        pageEntries, fetchEntriesAmount,
                        totalRows, pagesToLoad

                    } = this.props.data;
                    
                    if(scrolledPage < 1)
                        this.props.changeProps({currentPage: 1});
                    else
                        this.props.changeProps({ currentPage: 1 + (pageEntries * scrolledPage) });

                    if(calledLast)
                    {
                        let pageFix = (totalRows / pageEntries);
                        let numPages = (fetchEntriesAmount / pageEntries);
                        this.props.changeProps({ scrolledPage:  Math.floor( (totalRows / (pageEntries * numPages) ) ) });

                        if( !(pageFix && pageFix < pagesToLoad) )
                            this.props.changeProps({currentPage: numPages});
                    }
                    else 
                        this.props.changeProps({currentPage: 1});
                }

                // Server returned amount of rows
                // We need this to calculate if client wants to see last page
                if( obj.hasOwnProperty('rows') )
                {
                    this.props.changeProps({totalRows: obj.rows});
                    const { pageEntries, fetchEntriesAmount, scrolledPage } = this.props.data;

                    let numReceived = (obj.rows / pageEntries);
                    let numPages = (fetchEntriesAmount / pageEntries);

                    // Check if there are more pages 
                    // If not, disable further scrolling 
                    if(numReceived < numPages)
                        this.props.changeProps({calledLast: true});
                    if( numReceived < ( numPages + (numPages * scrolledPage) ) )
                        this.props.changeProps({stopScroll: true});
                }

                // Server returned first id result
                // We're using this on pagination
                if( obj.hasOwnProperty('first') )
                {
                    this.props.changeProps({firstRow: obj.first});
                }
                
                // Server response finished 
                if(obj.hasOwnProperty('done'))
                {
                    this.props.changeProps({displayFilters: true});
                    this.props.changeLoading(true);
                }
            }
        });
    }
    
    // Handle server response
    async handleJourneyData(obj) 
    {
        var lastID = 0;
        const { column_data, station_ids } = this.props.data;

        for(var key in obj.journeys) 
        {
            if( obj.journeys.hasOwnProperty(key) ) 
            {
                for( var attr in obj.journeys[key] ) 
                {
                    // console.log(id + " " + attr + " -> " + obj.journeys[key][attr]);

                    switch(attr)
                    {
                        case "dstation": column_data[1].push( obj.journeys[key][attr] ); break;
                        case "rstation": column_data[2].push( obj.journeys[key][attr] ); break;
                        case "distance": column_data[3].push( obj.journeys[key][attr] ); break;
                        case "duration": column_data[4].push( obj.journeys[key][attr] ); break;
                        case "departure": column_data[5].push( obj.journeys[key][attr] ); break;

                        case "id":
                        {
                            lastID = obj.journeys[key][attr];
                            column_data[0].push( obj.journeys[key][attr] );
                            break;
                        }

                        // Long and latitude
                        case "d_x": column_data[6].push( obj.journeys[key][attr] ); break;
                        case "d_y": column_data[7].push( obj.journeys[key][attr] ); break;
                        case "r_x": column_data[8].push( obj.journeys[key][attr] ); break;
                        case "r_y": column_data[9].push( obj.journeys[key][attr] ); break;

                        // Station ids to generate a link
                        case "d_id": station_ids[0].push( obj.journeys[key][attr] ); break; // Departure
                        case "r_id": station_ids[1].push( obj.journeys[key][attr] ); break; // Return
                        default: break;
                    }
                }
            }
        }
        if(lastID) this.props.changeProps({lastFetchID: lastID});
    }

    // Handle server response
    async handleStationData(obj) 
    {
        var lastID = 0;
        const { column_data, station_ids } = this.props.data;

        for(var key in obj.stations) 
        {
            if( obj.stations.hasOwnProperty(key) ) 
            {
                for( var attr in obj.stations[key] ) 
                {
                    switch(attr)
                    {
                        case "station": column_data[1].push( obj.stations[key][attr] ); break;
                        case "long": column_data[2].push( obj.stations[key][attr] ); break;
                        case "lat": column_data[3].push( obj.stations[key][attr] ); break;

                        case "id":
                        {
                            lastID = obj.stations[key][attr];
                            station_ids[0].push( obj.stations[key][attr] );
                            column_data[0].push( obj.stations[key][attr] );
                            break;
                        }
                        default: break;
                    }
                }
            }
        }
        if(lastID) this.props.changeProps({lastFetchID: lastID});
    }

    // Clients wants to sort by column
    handleSort(el, state_var, column)
    {
        var arr = [];
        var had_res = false;
        const { columns } = this.props.data;

        // Loop column indexes
        for(let i=0 ; i <= columns.length ; i++)
        {
            // This will set all other columns false
            // If none is true, sort by ID 
            if(!(i===column) && el) arr.push(false);
            else 
            {
                arr.push(!state_var);

                if(!state_var) 
                {
                    had_res = true;
                    this.props.sortCallback(i+1);
                }
            }
        }
        
        // Sort by ID by default
        if(!had_res)
        {
            arr[0] = true;
            this.props.sortCallback(1);
        }

        // Set the state array that we just made 
        this.props.changeProps({sort_columns: arr});
    }

    // Render list header columns 
    renderColumnTitles()
    {
        const titles = [];
        const { columns, sort_columns, have_sort } = this.props.data;

        for (let i = 0; i < columns.length; i++)
            titles.push( columns[i] );
        
        const html = titles.map( (string, index)  => 
        {
            // If we want to have a sort option for this column
            let haveSort = (have_sort[index]);

            // If client wants to sort by column 
            // Change arrow direction on click
            return (
                <li key={index}>{string}
                    { haveSort === true
                    ?
                    <>
                        { sort_columns[index] === true 
                        ? <FontAwesomeIcon className={styles.sort_icon_active} icon={faAngleUp} onClick = { e => this.handleSort(e, this.props.data.sort_columns[index], index)} /> 
                        : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.props.data.sort_columns[index], index)} /> }
                    </>
                    : null }
                </li>
            );
        });

        return html;
    }

    // Handle column clicks
    handleColumnExpansion = (num) => 
    { 
        this.setState({canLoad: true});

        // Client clicked an expanded column => close it 
        if(num === this.props.data.expandJourney || !this.props.data.linkStations)
        {
            this.props.changeProps({expandJourney: 0});
            return; 
        }

        const index = expandedColumns.indexOf(num);
        if(index > -1) expandedColumns.splice(index, 1); 
        expandedColumns.push(num);

        // Otherwise open the clicked column
        this.setState({pressed: num});
        this.props.changeProps({expandJourney: num});
    }

    // Render list columns data
    renderColumnData() 
    {
        const { 
            column_data, 
            currentPage, 
            pageEntries, 
            expandJourney,
            linkStations

        } = this.props.data;

        // Logic for paginating entries
        const indexLast = currentPage * pageEntries;
        const indexFirst = indexLast - pageEntries;
        const currentEntries = column_data[1].slice(indexFirst, indexLast);

        const mapEntries = currentEntries.map( (mappedEntry, index) => 
        {
            let idx = currentPage * pageEntries - pageEntries;
            
            return (
                <ul key={idx + index}
                    id = {column_data[0][idx + index]} 
                    onClick = { () => this.handleColumnExpansion(column_data[0][idx + index], (idx + index)) + 
                    expandedColumns.push((idx + index))}
                    >
                    
                    {/* When user clicks an entry => expand it */}
                    <li className={`${expandJourney === column_data[0][idx + index] ? styles.entry_ex : styles.entry} `} >

                        #{column_data[0][idx + index]}
                        <p className={styles.journey}></p>

                        {/* Expanded content journeys */}
                        <div className = {`${expandJourney === column_data[0][idx + index] ? styles.entry_visible : styles.entry_hidden} `} >

                            <div className = {`${expandJourney === column_data[0][idx + index] ? styles.entry_content_l_j : styles.entry_hidden} `}>
                                {
                                    expandedColumns.indexOf(idx + index) === -1 
                                    ? <div>API error</div> 
                                    : < GoogleMaps 
                                        data = {this.state} 
                                        expanded={expandJourney} 
                                        coordinates={column_data} 
                                        coord_index={(idx+index)}
                                        isJourney={linkStations}
                                        changeProps = {this.props.changeProps} 
                                        />
                                }
                            </div>
                        </div>
                    </li>

                    {/* The column itself */}
                    { this.renderEntry( (idx + index), mappedEntry ) }
                </ul>
            );
        });

        return mapEntries;
    }

    // Render column entry
    renderEntry(index, mappedEntry)
    {
        const titles = [], headers = [];
        const { column_data, columns, linkStations, station_ids } = this.props.data;
        
        // Column data itself
        for (let i = 1; i < columns.length; i++)
            titles.push( column_data[i][index] );

        // We need column headers for mobile version (it displays header title on each column)
        // This will be hidden on the normal screen width 
        for (let i = 1; i < columns.length; i++)
            headers.push( columns[i] );

        const html = titles.map( (string, hIndex)  => 
        {
            // React starts yelling about missing key without this
            if(mappedEntry) columnNum ++;
            
            let stationLink;
            var renderLink = false;
            
            // Create a link for stations
            if(linkStations)
            {
                // We are on journey list, create links for return and departure
                // station_ids[0] = departure
                // station_ids[1] = return
                // [index] being list column index
                if(hIndex === 0 || hIndex === 1)
                {
                    renderLink = true;  
                    stationLink = '/station/' + station_ids[hIndex][index];
                } 
            }
            else 
            {
                // We are on stations list, just create a link for the station
                if(hIndex === 0) 
                {
                    renderLink = true;
                    stationLink = '/station/' + station_ids[hIndex][index];
                }
            }

            return (
                <li className={styles.entry} key={columnNum}>
                    {
                        renderLink === true 
                        ? <Link className={styles.station_link} to={stationLink}>{string}<p>{headers[hIndex]}</p></Link> 
                        : <a>{string}<p>{headers[hIndex]}</p></a>
                    }
                </li>
            );
        });

        return html;
    }

    // Render page numbers (pagination)
    renderPages()
    {
        const pageNumbers = [];

        const { 
            column_data, 
            pageEntries, 
            fetchEntriesAmount, 
            scrolledPage, 
            currentPage

        } = this.props.data;

        for (let i = 1; i <= Math.ceil(column_data[1].length / pageEntries); i++)
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
                <li className={`${( currentPage + ( (fetchEntriesAmount / pageEntries) * scrolledPage ) ) === number ? styles.pageActive : styles.pageIncrement} `}
                    key={number} id={number} onClick={this.handlePage}>
                    {number}
                </li>
            );
        });

        return pages;
    }

    // Client wants to return a page
    previousPages(last)
    {
        const { 
            scrolledPage, 
            firstRow, 
            wentToLast, 
            actualScrolled,
            list_type 
        } = this.props.data;

        // We are on the first page. We can't go back.
        if(scrolledPage === 0) return;

        this.resetListData();
        var setFetch = (firstRow);
        this.props.changeProps({goingToLast: false});

        // Client wants to see previous page
        if(!last)
        {
            if(wentToLast) var scroll = actualScrolled+1;
            else var scroll = actualScrolled-1;
            var var_scrolled = scrolledPage-1;

            this.props.changeLoading(false);
            this.props.changeProps({calledLast: false});
            this.props.changeProps({lastFetchID: setFetch});
            this.props.changeProps({actualScrolled: scroll});
            this.props.changeProps({scrolledPage: var_scrolled});
        }
        else 
        {
            // Client wants to see the first page
            var_scrolled = 0;
            this.props.changeProps({lastFetchID: 0});
            this.props.changeProps({scrolledPage: 0});
            this.props.changeProps({calledLast: false});
            this.props.changeProps({scrolledPage: var_scrolled});
            this.props.changeProps({actualScrolled: var_scrolled});
            this.props.applyFilters();
            return;
        }

        switch(list_type)
        {
            case 'journey':
                this.prepareJourneyRequest(wentToLast, setFetch, true, scroll); break;
            case 'station':
                this.prepareStationRequest(wentToLast, setFetch, true, scroll); break;
            default: break;
        }
    }

    // Client wants more pages, fetch them 
    nextPages(last)
    {
        const { 
            calledLast, 
            scrolledPage, 
            lastFetchID, 
            actualScrolled, 
            wentToLast,
            list_type,
            stopScroll

        } = this.props.data;

        // We are on the very last page, don't go further.
        if(calledLast || stopScroll) return;

        this.resetListData();
        this.props.changeProps({goingToLast: true});

        var toLast = wentToLast;
        var endResults = false;
        
        // Client scrolled to the last pages
        if(wentToLast)
        {
            var scroll = actualScrolled-1;
            if( !(scroll < 0) ) var var_scrolled = scrolledPage+1;
            else 
            {
                // Client wants to go to next page but are on the very last page 
                scroll = 0;
                endResults = true;
                var var_scrolled = scrolledPage;
                this.props.changeProps({calledLast: true});
            }
        }
        else 
        {
            var scroll = actualScrolled+1;
            var var_scrolled = scrolledPage+1;
        }

        // Client wants to see next page 
        if(!last)
        {
            this.props.changeLoading(false);
            this.props.changeProps({actualScrolled: scroll});
            this.props.changeProps({scrolledPage: var_scrolled});
            if(!endResults) this.props.changeProps({calledLast: false});
        }

        // Client wants to see the very last page 
        else 
        {
            toLast = true;
            var scroll = 0;
            var var_scrolled = 0;
            this.props.changeLoading(false);
            this.props.changeProps({calledLast: true});
            this.props.changeProps({wentToLast: true});
            this.props.changeProps({actualScrolled: scroll});
        }
        
        switch(list_type)
        {
            case 'journey':
                this.prepareJourneyRequest(toLast, lastFetchID, false, scroll); break;
            case 'station':
                this.prepareStationRequest(toLast, lastFetchID, false, scroll); break;
            default: break;
        }
    }

    // Sends a request to server 
    prepareStationRequest(val, setFetch, prevPage, var_scrolled=0)
    {
        const { 
            fetchEntriesAmount,
            sortColumn, search

        } = this.props.data;

        const obj = 
        {
            type: 'stations',
            last: val,
            prev: prevPage,
            limit: fetchEntriesAmount,
            scrolled: var_scrolled,
            lastID: setFetch,
            sort: sortColumn,
            search: search
        };
        this.props.constructRequest(obj);
    }

    // Sends a request to server 
    prepareJourneyRequest(val, setFetch, prevPage, var_scrolled=0)
    {
        const { 
            fetchEntriesAmount,
            filterMeters, filterSeconds,
            meterUnit, timeUnit,
            overSeconds, overMeters,
            metersChecked, secondsChecked, 
            sortColumn, search

        } = this.props.data;

        const obj = 
        {
            type: 'journeys',
            last: val,
            prev: prevPage,
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
            scrolled: var_scrolled,
            lastID: setFetch,
            sort: sortColumn,
            search: search
        };
        this.props.constructRequest(obj);
    }

    // Handle page clicks
    handlePage(event) 
    {
        const { pageEntries, fetchEntriesAmount, scrolledPage } = this.props.data;
        
        // Logic for calculating current page
        this.props.changeProps({
            currentPage: Number(event.target.id) - ( (fetchEntriesAmount / pageEntries) * scrolledPage )
        });
    }

    // Clear list data
    resetListData()
    {
        const arraylist = [];
        const { column_data } = this.props.data;
        for (let i = 0; i < column_data.length; i++) arraylist.push( [] );
        
        this.props.changeProps({currentPage: 1});
        this.props.changeProps({displayFilters: false});
        this.props.changeProps({displayNoResults: false});
        this.props.changeProps({column_data: arraylist});
    }

    // Client is writing on search input
    handleSearchInput(e)
    {
        let input;
        input = e.target.value;
        this.props.changeProps({search: input});

        if(e.key === 'Enter') 
        {
            this.props.searchCallback(input);
            this.props.changeProps({displayNoResults: false});
        }
    }

    // Client clicked search button 
    handleSearchBtn()
    {
        this.props.changeProps({displayNoResults: false});
        this.props.searchCallback(this.props.data.search);
    }
    
    // Render the component
    render()
    {
        const { displayFilters, calledLast, scrolledPage, stopScroll } = this.props.data;

        return (
            <>
                <div className={styles.list}>

                    {/* Hide filters / search if page is loading */}
                    <div className={`${displayFilters ? styles.filters : styles.filters_hide} `} >
                        <div className={styles.searchWrap}>
                            <div className={styles.search}>

                                <input type="text" 
                                onKeyDown={this.handleSearchInput.bind(this)} 
                                onChange={this.handleSearchInput.bind(this)} 
                                className={styles.searchTerm} placeholder="search" />

                                <button type="submit" className={styles.searchButton} onClick={this.handleSearchBtn.bind(this)} >
                                    <FontAwesomeIcon className={styles.icon} icon={faSearch} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List titles */}
                    <ul className={styles.list_header}>
                        {this.renderColumnTitles()}
                    </ul>
                    
                    {/* List data */}
                    {this.renderColumnData()}
                </div>

                {/* Pages */}
                <ul className={styles.pages}>
                    <li>
                        <FontAwesomeIcon className={`${scrolledPage === 0 ? styles.pageSkipDeactivated : styles.pageSkip} `}
                        icon={faCaretLeft} size="xs" onClick = { () => this.previousPages(true) } />
                    </li>
                    <li>
                        <FontAwesomeIcon className={`${scrolledPage === 0 ? styles.pageSkipDeactivated : styles.pageScroller} `}
                        icon={faAngleLeft} size="xs" onClick = { () => this.previousPages(false) } />
                    </li>
                    {this.renderPages()}
                    <li>
                        <FontAwesomeIcon className={`${calledLast === true || stopScroll ? styles.pageSkipDeactivated : styles.pageScroller} `}
                        icon={faAngleRight} size="xs" onClick = { () => this.nextPages(false) } />
                    </li>
                    <li>
                        <FontAwesomeIcon className={`${calledLast === true || stopScroll ? styles.pageSkipDeactivated : styles.pageSkip} `}
                        icon={faCaretRight} size="xs" onClick = { () => this.nextPages(true) } />
                    </li>
                </ul>
            </>
        );
    }

}