import React, { Component } from 'react';
import socket from '../../addons/socket';
import styles from './index.module.css';
import anims from '../anims.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp } from '@fortawesome/free-solid-svg-icons';


export default class index extends Component 
{  
    constructor(props) 
    {
        super(props);

        // Some states to keep our clients happy
        this.state = 
        {
            example_state: 5000,
            sort_columns: [false, false, false, false, false, false]
        };
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        // Set loaded true
        this.props.changeProps({isLoaded: true});

        // Listen the server for messages
        socket.on('message', (msg) => 
        {
            this.setState({data:msg})

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

    // Render the page <table className={`${styles.container} ${styles.container}`}>
    render() 
    {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>
                    
                    <div className={styles.list}>
                        
                        <div className={styles.searchWrap}>
                            <div className={styles.search}>
                                <input type="text" className={styles.searchTerm} placeholder="search" />
                                <button type="submit" className={styles.searchButton}>
                                    <FontAwesomeIcon className={styles.icon} icon={faSearch} />
                                </button>
                            </div>
                        </div>

                        <ul className={styles.list_header}>
                            <li>Journey#
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

                        <ul>
                            <li>010<p className={styles.journey}>Journey#</p></li>
                            <li>Finland<p>Departure Station</p></li>
                            <li>Finland<p>Return Station</p></li>
                            <li>0123456789<p>Distance</p></li>
                            <li>123<p>Duration</p></li>
                            <li> Example of a list<p>Departure</p></li>
                        </ul>

                        <ul>
                            <li>010<p className={styles.journey}>Journey#</p></li>
                            <li>Finland<p>Departure Station</p></li>
                            <li>Finland<p>Return Station</p></li>
                            <li>0123456789<p>Distance</p></li>
                            <li>123<p>Duration</p></li>
                            <li> Example of a list<p>Departure</p></li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}