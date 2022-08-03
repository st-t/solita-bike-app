import React, { Component } from 'react'
import styles from './index.module.css';
import anims from '../anims.module.css';
import socket from '../../addons/socket';


let lastStatus = 0;

export default class index extends Component 
{
    constructor(props) 
    {
        super(props);

        // Some states to keep our clients happy
        this.state = 
        {
            data:{},
            filters: {},
            connect: false,
            connected: false,
            database: ['', '', '', ''],
            input: 'Connect',

            okMsg: '',
            errMsg: '',
            displayOK: false,
            displayErr: false,
            status_msg: ['', '', '', '', ''],
            importing: true,
        };

        this.changeProps = this.changeProps.bind(this);
    }

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {
        this.checkServer();
        this.props.changeProps({isLoaded: false});
        
        // Listen the server for messages
        socket.on('message', (msg) => 
        {
            this.setState({data:msg});

            // Message from socketio 
            let json_response = this.state.data; 

            // Check if we got some data and not an empty object
            if( String( typeof(json_response) ) === 'string' )
            {
                // Parse the json string 
                const obj = JSON.parse(json_response);
                
                // Query went through
                if( obj.hasOwnProperty('OK') )
                {
                    this.setState({
                        connected: true, 
                        input: 'OK!',
                        displayOK: true,
                        displayErr: false,
                        okMsg: 'Connected OK!'
                    });
                    
                    this.checkServer();
                    window.scrollTo(0, 700);
                    this.props.changeProps({isLoaded: true});
                }
                
                // There was an error in query 
                if( obj.hasOwnProperty('error') )
                {
                    this.setState({
                        displayOK: false,
                        displayErr: true,
                        errMsg: 'Error: ' + obj.error + ' - Check for whitespace & credentials',
                        input: 'Connect'
                    });

                    this.props.changeProps({isLoaded: true});
                }

                if( obj.hasOwnProperty('check') )
                {
                    if(obj.check.check === 'True')
                    {
                        let items = ['Import running...', 'Please wait...', '', '', ''];
                        this.setState( {status_msg: items} );

                        console.log('currenty importing');
                        this.props.changeProps({isLoaded: true});
                        this.setState({connected: true, importing: true});
                    }
                    else 
                    {
                        console.log('currenty not importing %s', obj.check);
                        this.setState({importing: false});
                        this.props.changeProps({isLoaded: true});
                    }

                    if(obj.check.connected === 'True')
                    {
                        this.setState({connected: true, input: 'OK!'});
                    }
                    else 
                    {

                    }
                }
                
                // Scroll status message if client has started data import 
                if( obj.hasOwnProperty('status') )
                {
                    window.scrollTo(0, 1700);
                    let items = [...this.state.status_msg];
                    let item = {...items[lastStatus]};
                    var now = new Date();

                    now.toString('yyyy-MM-dd - h:m:s');
                    now = String(now);
                    now = now.split(' ')

                    let date = now[2] + '/' + now[3] + ' ' + now[4];

                    item = date + ' - ' + obj.status;
                    
                    // Status scroller 
                    if(lastStatus < 4)
                    {
                        items[lastStatus] = item;
                        this.setState( {status_msg: items} );
                        lastStatus++;
                    }
                    else 
                    {
                        items[4] = items[3];
                        items[3] = items[2];
                        items[2] = items[1];
                        items[1] = items[0];
                        items[0] = item;
                        this.setState( {status_msg: items} );
                    }
                }
            }
        });
    }

    changeProps = (data) => {
        this.setState(data);
    }

    // Check if we are importing datasets
    checkServer()
    {
        const obj = { type: 'check' };
        this.setState( {filters: obj}, this.serverRequest );
    }

    // Sends a request to server
    serverRequest()
    {
        // Scroll user to top when we're loading the page
        window.scrollTo(0, 0);
        this.props.changeProps({isLoaded: false});

        // Change the json to a string and send the request
        const jsonRequest = JSON.stringify(this.state.filters); 
        socket.send(jsonRequest);
    }

    // Client is writing inputs
    handleInput(e, t)
    {
        let input;
        input = e.target.value;

        let items = [...this.state.database];
        let item = {...items[t]};
        item = input;
        items[t] = item;
        this.setState( {database: items}, this.checkInputs );
    }

    // Check inputs 
    checkInputs()
    {
        let set = true;
        const { database, connected } = this.state;
        
        if(connected) return; 

        for(let i = 0 ; i < database.length ; i++)
        {
            if(!database[i]) 
            {
                set = database[i];
                break;
            }
        }

        this.setState({connect: set});
    }

    // Attempt to connect to MySQL
    connectToDatabase()
    {
        const {database, connect, connected} = this.state;
        if(!connect || connected) return;

        const obj = { 
            type: 'connect',
            host: database[0],
            db: database[1],
            user: database[2],
            p: database[3]
        };

        this.setState( {filters: obj, connect: false, input: 'Connecting..'}, this.serverRequest );
    }

    // Client wants to start dataset importing 
    initializeDatasets()
    {
        const {importing} = this.state;
        if(importing) return;

        this.setState( {importing: true}, this.startImport );
    }

    // Starts dataset import 
    startImport()
    {
        const obj = { type: 'start_import' };
        this.setState( {filters: obj}, this.serverRequest );
    }
   
    render() {
        const { 
            connect, connected, 
            input, okMsg,
            errMsg, displayErr,
            displayOK, status_msg,
            importing

        } = this.state;

        return (
            <div className={anims.fade_class}>
                <div className={styles.container}>

                    <p className={`${displayErr === true ? styles.error : styles.none} `}>{errMsg}</p>
                    <p className={`${displayOK === true ? styles.ok : styles.none} `}>{okMsg}</p>

                    <div className={styles.settings_header}>
                        <p className={styles.settings_title}>MySQL Database</p>
                        <p className={styles.settings_low}>Configure your database</p>
                        <p className={styles.settings_low}>Please make sure your db user has full access</p>

                        <div className={styles.cred}>
                            <p className={styles.input_title}>Host</p>
                            <input onChange={(e) => {this.handleInput(e, 0)}} type="text" data-name="departure" className={styles.input}  />
                            <p className={styles.input_title}>Database</p>
                            <input onChange={(e) => {this.handleInput(e, 1)}} type="text" data-name="departure" className={styles.input}  />
                            <p className={styles.input_title}>User</p>
                            <input onChange={(e) => {this.handleInput(e, 2)}} type="text" data-name="departure" className={styles.input}  />
                            <p className={styles.input_title}>Password</p>
                            <input onChange={(e) => {this.handleInput(e, 3)}} type="password" data-name="departure" className={styles.input}  />
                        </div>

                        <button onClick={() => this.connectToDatabase()} 
                                className={`${connect === true ? styles.connect : styles.connectDark} `}>
                            {input}
                        </button>
                    </div>

                    <div className={`${connected === true ? styles.settings_footer : styles.settings_off} `}>

                        <p className={styles.settings_title}>Dataset import</p>
                        <p className={styles.settings_low}>Imports datasets into your database</p>
                        <p className={styles.settings_low}>Please make sure your db is empty</p>
                        <p className={styles.settings_low}>Run this only once</p>

                        <div className={styles.init}>
                            <button onClick={() => this.initializeDatasets()} 
                                    className={`${importing === false ? styles.import : styles.importDark} `}>
                                Initialize import
                            </button>

                            <ul className={`${importing === true ? styles.status_list : styles.none} `}>
                                <li>{status_msg[0]}</li>
                                <li>{status_msg[1]}</li>
                                <li>{status_msg[2]}</li>
                                <li>{status_msg[3]}</li>
                                <li>{status_msg[4]}</li>
                            </ul>
                        </div>


                    </div>
                </div>
            </div>
        );
    }
}