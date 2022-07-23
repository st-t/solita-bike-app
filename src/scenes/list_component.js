

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

    componentDidMount() 
    {
        //console.log('data:' + this.props.data.column_data[0][0] ); 
    }

    // Clients wants to sort by column
    handleSort(el, state_var, column)
    {
        var arr = [];
        const { columns } = this.props.data;

        // Loop column indexes
        for(let i=0 ; i <= columns.length ; i++)
        {
            // This will set all other columns false (except the one client clicked)
            // since we are not sorting 2 columns at the same time 
            if(!(i===column) && el) arr.push(false);
            else arr.push(!state_var);
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
                ? <FontAwesomeIcon className={styles.sort_icon} icon={faAngleUp} onClick = { e => this.handleSort(e, this.props.data.sort_columns[index], index)} /> 
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
        const { fetchEntriesAmount, scrolledPage, lastFetchID } = this.props.data;

        // We are on the first page. We can't go back.
        if(scrolledPage === 0) return;

        this.resetListData();
        var setFetch = (lastFetchID - fetchEntriesAmount * 2);

        // Client wants to see previous page
        if(!last)
        {
            this.props.changeProps({calledLast: false});
            this.props.changeProps({scrolledPage: (scrolledPage-1)});
            this.props.changeProps({lastFetchID: setFetch});
        }
        else 
        {
            // Client wants to see the first page so set lastFetch to 0 and call next
            setFetch = 0 
            this.props.changeProps({lastFetchID: 0});
            this.props.changeProps({scrolledPage: 0});
            this.props.changeProps({calledLast: false});
        }

        // Send the command to server
        socket.send('[next] ' + setFetch + ' ' + fetchEntriesAmount);
    }

    // Client wants more pages, fetch them 
    nextPages(last)
    {
        const { 
            calledLast, 
            scrolledPage, 
            lastFetchID,
            fetchEntriesAmount

        } = this.props.data;

        // We are on the very last page, don't go further.
        if(calledLast) return;

        this.resetListData();

        // Client wants to see next page 
        if(!last)
        {
            this.props.changeProps({calledLast: false});
            this.props.changeProps({scrolledPage: scrolledPage+1});
            socket.send('[next] ' + lastFetchID + ' ' + fetchEntriesAmount);
        }

        // Client wants to see the very last page 
        else 
        {
            this.props.changeProps({calledLast: true});
            socket.send('[last] ' + fetchEntriesAmount);
        }
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

    // Clear list data, set loading screen true
    resetListData()
    {
        const { column_data } = this.props.data;
        
        const arraylist = [];
        for (let i = 0; i < column_data.length; i++) arraylist.push( [] );

        this.props.changeProps({column_data: arraylist});
        this.props.changeProps({currentPage: 1});
        this.props.changeProps({displayFilters: false});
        this.props.changeLoading(false);
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
                                <input type="text" className={styles.searchTerm} placeholder="search" />
                                <button type="submit" className={styles.searchButton}>
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
                        icon={faCaretLeft} onClick = { () => this.previousPages(true) } />
                    </li>
                    <li>
                        <FontAwesomeIcon className={`${scrolledPage === 0 ? styles.pageSkipDeactivated : styles.pageScroller} `}
                        icon={faAngleLeft} onClick = { () => this.previousPages(false) } />
                    </li>
                    {this.renderPages()}
                    <li>
                        <FontAwesomeIcon className={`${calledLast === true ? styles.pageSkipDeactivated : styles.pageScroller} `}
                        icon={faAngleRight} onClick = { () => this.nextPages(false) } />
                    </li>
                    <li>
                        <FontAwesomeIcon className={`${calledLast === true ? styles.pageSkipDeactivated : styles.pageSkip} `}
                        icon={faCaretRight} onClick = { () => this.nextPages(true) } />
                    </li>
                </ul>
            </>
        );
    }

}