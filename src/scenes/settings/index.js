import React, { Component } from 'react'
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

            // If client wants to sort by a column
            sort_columns: [false, false, false, false, false, false],
            
            // List column titles
            columns: ['#', 'Station', 'x', 'y'],
            
            // List column data
            column_data: [ ['3'], ['Test station'], ['123'], ['456'] ],

            // How much entries to fetch
            fetchEntriesAmount: 100,

            // Last fetched rowID
            lastFetchID: 0,
            
            // Data for each pages
            currentPage: 1, pageEntries: 20, expandJourney: 0,
            displayFilters: false, expandFilters: false, calledLast: false, scrolledPage: 0
        };
        this.changeProps = this.changeProps.bind(this);
    }

    changeProps = (data) => {
        this.setState(data);
    }

    componentDidMount() 
    {
        
    }

    render() {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>
                    
                    <NewList data = {this.state} changeProps = {this.changeProps} />


                </div>

            </div>
        );
    }
}