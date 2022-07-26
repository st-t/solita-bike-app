import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Loader from './loader/index';
import Index from './index/index';
import Settings from './settings/index';
import Stations from './stations/index';
import socket from '../addons/socket';
import anims from './anims.module.css';
import styles from './styles.module.css';
import useMightyMouse from 'react-hook-mighty-mouse';


const Header = ({sqlStatus}) => 
{
    // Tracks mouse movement to make the graphics move
    const {position: { client },} = useMightyMouse(true, 'trackElement');

    return (
    <>
        <h1 className={anims.logo_head} data-text="City-bike-app">City-bike-app</h1>
        <small className={anims.sig}>Dev Academy pre-assignment ~ Samuli Taskila</small>

        <div className={anims.header_anim} id="trackElement">

            {/*  Background graphics 
            Man enough to say I ctrl+v'd this :-D */}
            <div className={anims.background}>
                <div className={anims.bubble} style={{transform: `translate(${client.x && client.x.toFixed(0) / 20}px, ${client.y && client.y.toFixed(0) / 20}px)`}}></div>
                <div className={anims.bubble_1} style={{transform: `translate(${client.x && client.x.toFixed(0) / 30}px, ${client.y && client.y.toFixed(0) / 30}px)`}}></div>
                    
                <div className={anims.line} style={{height: `${client.x && client.x.toFixed(0) / 2}px`}}></div>
                <div className={anims.line_1} style={{height: `${client.x && client.x.toFixed(0) / 3}px`}}></div>
                <div className={anims.line_2} style={{height: `${client.x && client.x.toFixed(0) / 4}px`}}></div>
                <div className={anims.line_3} style={{height: `${client.x && client.x.toFixed(0) / 5}px`}}></div>
            </div>
        </div>

        <small className={styles.sql_status}>{sqlStatus}</small>
    </>
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
            isLoaded: false,
            sqlStatus: '✗ Database is not set'
        }

        this.changeProps = this.changeProps.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
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

    render() 
    {
        return (
            <>
                {/* If we need to load something before we can display the page
                    => use this loading screen                      */}
                {!this.state.isLoaded ? <Loader /> : null}

                <Header sqlStatus={this.state.sqlStatus}/>

                {/* Let's handle routing */}
                <Router>
                    
                    <Fragment>

                        {/* This (navbar) is always visible */}
                        <div className={styles.header_links}>

                            <li className={styles.navitem}>
                                <Link to="/" className={styles.navlink} >Journeys</Link>
                                <Link to="/stations" className={styles.navlink} >Stations</Link>
                                <Link to="/settings" className={styles.navlink} >Settings</Link>
                            </li>
                        </div>
                        
                        {/* Pages */}
                        <Routes>

                            {/* Index */}
                            <Route exact path="/" element = {
                                <Index 
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps} />
                            }>
                            </Route>
                            
                            {/* Data / Settings */}
                            <Route exact path="/settings" element = { 
                                <Settings
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps}/>
                            }>
                            </Route>
                            
                            {/* Stations */}
                            <Route exact path="/stations" element = { 
                                <Stations
                                    data = {this.state.data} 
                                    changeProps = {this.changeProps}/>
                            }>
                            </Route>

                        </Routes>
                    </Fragment>
                </Router>
            </>
        )
    }
}