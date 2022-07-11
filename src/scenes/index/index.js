import React, { Component } from 'react';
import socket from '../../addons/socket';
import styles from './index.module.css';
import anims from '../anims.module.css';


export default class index extends Component 
{
    constructor(props) 
    {
        super(props);

        this.updateRange = this.updateRange.bind(this);

        // Some states to keep our clients happy
        this.state = 
        {
            example_state: 5000
        };
    }

    updateRange(e) {
        this.props.updateRange(e.target.value);
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

    // Render the page
    render() 
    {
        return (
            <div className={anims.fade_class}>

                <div className={styles.container}>
                    content
                </div>

            </div>
        )
    }
}