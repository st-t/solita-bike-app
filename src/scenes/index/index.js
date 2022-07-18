import React, { Component } from 'react';
import socket from '../../addons/socket';
import styles from './index.module.css';
import anims from '../anims.module.css';


export default class index extends Component 
{  
    constructor(props) 
    {
        super(props);

        // Some states to keep our clients happy
        this.state = 
        {
            example_state: 5000,
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

    // Render the page <table className={`${styles.container} ${styles.container}`}>
    render() 
    {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>
                    
                    <div className={styles.list}>
                        <ul>
                            <li>Journey#</li>
                            <li>Departure Station</li>
                            <li>Return Station</li>
                            <li>Distance</li>
                            <li>Duration</li>
                            <li>Departure</li>
                        </ul>
                        <ul>
                            <li>010</li>
                            <li>Finland</li>
                            <li>Finland</li>
                            <li>0123456789</li>
                            <li>123</li>
                            <li>
                                <p>Example of a list</p>
                            </li>
                        </ul>
                        <ul>
                            <li>010</li>
                            <li>Finland</li>
                            <li>Finland</li>
                            <li>0123456789</li>
                            <li>123</li>
                            <li>
                                <p>Example of a list</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
}