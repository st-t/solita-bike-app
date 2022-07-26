

import React, { Component } from 'react';
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


export default class NewList extends Component {

    constructor(props) 
    {
        super(props);

        // Handle pagination clicks
        this.handlePage = this.handlePage.bind(this);

        // Handle column entry clicks
        this.handleColumnExpansion = this.handleColumnExpansion.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        //console.log('data:' + this.props.data.column_data[0][0] ); 
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
        const { columns } = this.props.data;

        for (let i = 0; i < columns.length; i++)
            titles.push( columns[i] );
        
        const html = titles.map( (string, index)  => 
        {
            // Client wants to sort by column 
            // Change arrow direction on click
            return (
                <li key={index}>{string}
                { this.props.data.sort_columns[index] === true 
                ? <FontAwesomeIcon className={styles.sort_icon_active} icon={faAngleUp} onClick = { e => this.handleSort(e, this.props.data.sort_columns[index], index)} /> 
                : <FontAwesomeIcon className={styles.sort_icon} icon={faAngleDown} onClick = { e => this.handleSort(e, this.props.data.sort_columns[index], index)} /> }
                </li>
            );
        });

        return html;
    }

    // Handle column clicks
    handleColumnExpansion = (num) => 
    { 
        // Client clicked an expanded column => close it 
        if(num === this.props.data.expandJourney)
        {
            this.props.changeProps({expandJourney: 0 });
            return; 
        }

        // Otherwise open the clicked column
        this.props.changeProps({expandJourney: num});
    }

    // Render list columns data
    renderColumnData() 
    {
        const { 
            column_data, 
            currentPage, 
            pageEntries, 
            expandJourney 

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
                    onClick = { () => this.handleColumnExpansion(column_data[0][idx + index], (idx + index))}>
                    
                    {/* When user clicks an entry => expand it */}
                    <li className={`${expandJourney === column_data[0][idx + index] ? styles.entry_ex : styles.entry} `} >

                        #{column_data[0][idx + index]}
                        <p className={styles.journey}></p>

                        {/* Expanded content */}
                        <div className = {`${expandJourney === column_data[0][idx + index] ? styles.entry_visible : styles.entry_hidden} `} >
                            <div className = {`${expandJourney === column_data[0][idx + index] ? styles.entry_content_l : styles.entry_hidden} `}>
                                content_left
                            </div>

                            <div className={`${expandJourney === column_data[0][idx + index] ? styles.entry_content_r : styles.entry_hidden} `}>
                                content_right
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
        const { column_data, columns } = this.props.data;
        
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
            
            return (
                <li className={styles.entry} key={columnNum}>{string}
                    <p>{headers[hIndex]}</p>
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

        if(list_type === 'journey')
            this.prepareJourneyRequest(wentToLast, setFetch, true, scroll);
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
            list_type
        } = this.props.data;

        // We are on the very last page, don't go further.
        if(calledLast) return;

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
        
        if(list_type === 'journey')
            this.prepareJourneyRequest(toLast, lastFetchID, false, scroll);
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
    handleSearchBtn(e)
    {
        this.props.changeProps({displayNoResults: false});
        this.props.searchCallback(this.props.data.search);
    }
    
    // Render the component
    render()
    {
        const { displayFilters, calledLast, scrolledPage } = this.props.data;

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
                        <FontAwesomeIcon className={`${calledLast === true ? styles.pageSkipDeactivated : styles.pageScroller} `}
                        icon={faAngleRight} size="xs" onClick = { () => this.nextPages(false) } />
                    </li>
                    <li>
                        <FontAwesomeIcon className={`${calledLast === true ? styles.pageSkipDeactivated : styles.pageSkip} `}
                        icon={faCaretRight} size="xs" onClick = { () => this.nextPages(true) } />
                    </li>
                </ul>
            </>
        );
    }

}