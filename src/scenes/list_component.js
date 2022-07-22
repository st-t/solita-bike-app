

import React, { Component } from 'react';
import socket from '../addons/socket';
import styles from './index/index.module.css';
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

        // Loop column indexes
        for(let i=0 ; i <= this.props.data.columns.length ; i++)
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

        this.props.changeProps({expandJourney: num});
    }

    // Render list columns data
    renderColumnData()
    {
        const { column_data, currentPage, pageEntries } = this.props.data;

        // Logic for paginating entries
        const indexLast = currentPage * pageEntries;
        const indexFirst = indexLast - pageEntries;
        const currentEntries = column_data[1].slice(indexFirst, indexLast);

        const mapEntries = currentEntries.map((mappedEntry, index) => 
        {
            let idx = currentPage * pageEntries - pageEntries;
            
            return (
                <ul key={idx + index}
                    id = {this.props.data.column_data[0][idx + index]} 
                    onClick = { () => this.handleColumnExpansion(this.props.data.column_data[0][idx + index], (idx + index))}>
                    
                    {/* When user clicks an entry => expand it */}
                    <li className={`${this.props.data.expandJourney === this.props.data.column_data[0][idx + index] ? styles.entry_ex : styles.entry} `} >

                        #{this.props.data.column_data[0][idx + index]}
                        <p className={styles.journey}></p>

                        {/* Expanded content */}
                        <div className = {`${this.props.data.expandJourney === this.props.data.column_data[0][idx + index] ? styles.entry_visible : styles.entry_hidden} `} >
                            <div className = {`${this.props.data.expandJourney === this.props.data.column_data[0][idx + index] ? styles.entry_content_l : styles.entry_hidden} `}>
                                content_left
                            </div>

                            <div className={`${this.props.data.expandJourney === this.props.data.column_data[0][idx + index] ? styles.entry_content_r : styles.entry_hidden} `}>
                                content_right
                            </div>
                        </div>
                    </li>

                    {this.renderEntry((idx + index), mappedEntry)}
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
        
        for (let i = 1; i < columns.length; i++)
            titles.push( column_data[i][index] );

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
        const { column_data, pageEntries, fetchEntriesAmount, scrolledPage } = this.props.data;

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
                <li className={`${(this.props.data.currentPage + ((fetchEntriesAmount / pageEntries) * scrolledPage) ) === number ? styles.pageActive : styles.pageIncrement} `}
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
        // We are on the first page. We can't go back.
        if(this.props.data.scrolledPage === 0) return;

        this.resetListData();
        var setFetch = (this.props.data.lastFetchID - this.props.data.fetchEntriesAmount * 2);

        // If client wants to scroll all the way to beginning
        if(!last)
        {
            this.props.changeProps({calledLast: false});
            this.props.changeProps({scrolledPage: (this.props.data.scrolledPage-1)});
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
        socket.send('[next] ' + setFetch + ' ' + this.props.data.fetchEntriesAmount);
    }

    // Client wants more pages, fetch them 
    nextPages(last)
    {
        // We are on the very last page, don't go further.
        if(this.props.data.calledLast) return;
        this.resetListData();

        if(!last)
        {
            this.props.changeProps({calledLast: false});
            this.props.changeProps({scrolledPage: this.props.data.scrolledPage+1});
            socket.send('[next] ' + this.props.data.lastFetchID + ' ' + this.props.data.fetchEntriesAmount);
        }

        // Client wants to see the very last page 
        else 
        {
            this.props.changeProps({calledLast: true});
            socket.send('[last] ' + this.props.data.fetchEntriesAmount);
        }
    }

    // Handle page clicks
    handlePage(event) 
    {
        const { pageEntries, fetchEntriesAmount, scrolledPage } = this.props.data;
        
        // Logic for calculating current page
        this.props.changeProps({
            currentPage: Number(event.target.id) - ((fetchEntriesAmount / pageEntries) * scrolledPage)
        });
    }

    // Clear list data
    resetListData()
    {
        const { column_data } = this.props.data;
        
        const arraylist = [];
        for (let i = 0; i < column_data.length; i++) arraylist.push( [] );
        this.props.changeProps({column_data: arraylist});

        this.props.changeProps({currentPage: 1});
        this.props.changeProps({displayFilters: false});

        //this.props.changeProps({isLoaded: false}); ?
    }
    
    // Render the component
    render() 
    {
        return (
            <>
                <div className={styles.list}>

                    {/* Hide filters / search if page is loading */}
                    <div className={`${this.props.data.displayFilters ? styles.filters : styles.filters_hide} `} >
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
                    
                    {/* List data & Pagination*/}
                    {this.renderColumnData()}
                </div>

                <ul className={styles.pages}>
                    <li>
                        <FontAwesomeIcon className={`${this.props.data.scrolledPage === 0 ? styles.pageSkipDeactivated : styles.pageSkip} `}
                        icon={faCaretLeft} onClick = { () => this.previousPages(true) } />
                    </li>
                    <li>
                        <FontAwesomeIcon className={`${this.props.data.scrolledPage === 0 ? styles.pageSkipDeactivated : styles.pageScroller} `}
                        icon={faAngleLeft} onClick = { () => this.previousPages(false) } />
                    </li>
                    {this.renderPages()}
                    <li>
                        <FontAwesomeIcon className={`${this.props.data.calledLast === true ? styles.pageSkipDeactivated : styles.pageScroller} `}
                        icon={faAngleRight} onClick = { () => this.nextPages(false) } />
                    </li>
                    <li>
                        <FontAwesomeIcon className={`${this.props.data.calledLast === true ? styles.pageSkipDeactivated : styles.pageSkip} `}
                        icon={faCaretRight} onClick = { () => this.nextPages(true) } />
                    </li>
                </ul>
            </>
        );
    }

}