import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Loader from './loader/index';
import Index from './index/index';
import Settings from './settings/index';
import Station from './station/index';
import Stations from './stations/index';
import Create from './create/index';
import socket from '../addons/socket';
import anims from './anims.module.css';
import styles from './styles.module.css';
import useMightyMouse from 'react-hook-mighty-mouse';


const Header = ({sqlStatus, sqlConnected}) => 
{
    // Tracks mouse movement to make the graphics move
    const {position: { client },} = useMightyMouse(true, 'trackElement');

    return (
        <>
            <h1 className={anims.logo_head} data-text="City-bike-app">City-bike-app</h1>
            <small className={anims.sig}>Dev Academy pre-assignment ~ Samuli Taskila</small>

            <div className={anims.header_anim} id="trackElement">
                <div className={anims.background}>
                    <div className={anims.bubble} style={{transform: `translate(${client.x && client.x.toFixed(0) / 20}px, ${client.y && client.y.toFixed(0) / 20}px)`}}></div>
                    <div className={anims.bubble_1} style={{transform: `translate(${client.x && client.x.toFixed(0) / 30}px, ${client.y && client.y.toFixed(0) / 30}px)`}}></div>
                        
                    <div className={anims.line} style={{height: `${client.x && client.x.toFixed(0) / 2}px`}}></div>
                    <div className={anims.line_1} style={{height: `${client.x && client.x.toFixed(0) / 3}px`}}></div>
                    <div className={anims.line_2} style={{height: `${client.x && client.x.toFixed(0) / 4}px`}}></div>
                    <div className={anims.line_3} style={{height: `${client.x && client.x.toFixed(0) / 5}px`}}></div>
                </div>
            </div>

            <small className={`${sqlConnected === false ? styles.sql_status : styles.none} `}>{sqlStatus}</small>
        </>
    );
}


const MobileNavLinks = () => 
{
    return (
        <div className={styles.mobile_nav}>
            <input type="checkbox" className={styles.openSidebarMenu} id="openSidebarMenu"/>

            <label htmlFor="openSidebarMenu" className={styles.sidebarIconToggle}>
                <div className={`${styles.spinner} ${styles.diagonal} ${styles.part_1}`}></div>
                <div className={`${styles.spinner} ${styles.horizontal}`}></div>
                <div className={`${styles.spinner} ${styles.diagonal} ${styles.part_2}`}></div>
            </label>

            <div id={styles.sidebarMenu} >
                <ul className={styles.sidebarMenuInner}>
                    <li>City-bike-app<span>Navigation Menu</span></li>
                    
                    <li><Link to="/" className={styles.mobileLink}>Journeys</Link></li>
                    <li><Link to="/stations" className={styles.mobileLink}>Stations</Link></li>
                    <li><Link to="/settings" className={styles.mobileLink}>Settings</Link></li>
                    <li><Link to="/create" className={styles.mobileLink}>Add New</Link></li>
                </ul>
            </div> 
        </div>
    );
}


export default class App extends Component 
{
    constructor(props) 
    {
        super(props);

        this.state = 
        {
            data: {},
            filters: {},
            isLoaded: false,
            sqlStatus: '✗ Database is not set',
            sqlConnected: false,
        }

        this.changeProps = this.changeProps.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        this.checkServer();

        socket.on('message', async (msg) => 
        {
            this.setState({data:msg})

            // Message from socketio 
            let json_response = this.state.data; 

            if( String( typeof(json_response) ) === 'string' )
            {
                const obj = JSON.parse(json_response);

                if( obj.hasOwnProperty('connection') ) 
                    console.log('>> socket response: ' + String(obj.connection) ); 

                if( obj.hasOwnProperty('check') )
                {
                    if(obj.check.connected === 'True')
                        this.setState({sqlConnected: true});

                    console.log('Connected sql: %s', obj.check.connected);
                }
                    
            }
        });

        // Let the server know we're in
        socket.on('connect', function() 
        {
            console.log('>> socket init ~ sending [connection]...');
            socket.send('[connection] ');
        });

        // In case we're dropping => reconnect
        socket.on('disconnect', function() 
        {
            socket.socket.reconnect();
        });
    };

    changeProps = (data) => {
        this.setState(data);
    }

    // Check connection status 
    checkServer()
    {
        const obj = { type: 'check' };
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Sends a request to server
    serverRequest()
    {
        // Change the json to a string and send the request
        const jsonRequest = JSON.stringify(this.state.filters); 
        socket.send(jsonRequest);
    }

    render() 
    {
        const {sqlConnected, sqlStatus} = this.state; 

        return (
            <>
                {/* If we need to load something before we can display the page
                    => use this loading screen                      */}
                
                {!this.state.isLoaded 
                ? this.state.sqlConnected ? <Loader /> : null 
                : null}

                {/* Header */}
                <Header sqlStatus={this.state.sqlStatus} sqlConnected={this.state.sqlConnected}/>

                {/* Let's handle routing */}
                <Router>
                    
                    <Fragment>

                        {/* This (navbar) is always visible */}
                        <div className={styles.header_links}>

                            <li className={styles.navitem}>
                                <Link to="/" className={styles.navlink} >Journeys</Link>
                                <Link to="/stations" className={styles.navlink} >Stations</Link>
                                <Link to="/settings" className={styles.navlink} >Settings</Link>
                                <Link to="/create" className={styles.navlink} >Add New</Link>
                            </li>

                        </div>

                        <MobileNavLinks/>
                        
                        {/* Pages */}
                        <Routes>

                            {/* Journeys (index) */}
                            <Route exact path="/" element = {
                                <Index 
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps} />
                            }/>
                            
                            {/* Data / Settings */}
                            <Route exact path="/settings" element = { 
                                <Settings
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps}/>
                            }/>
                            
                            {/* Stations */}
                            <Route exact path="/stations" element = { 
                                <Stations
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps}/>
                            }/>

                            {/* Single station view */}
                            <Route path="/station/:stationID" element={ 
                                <Station
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps}/>
                            }/>

                            {/* Add new entries */}
                            <Route exact path="/create" element = { 
                                <Create
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps}/>
                            }/>
                            
                        </Routes>
                    </Fragment>
                </Router>
            </>
        )
    }
}