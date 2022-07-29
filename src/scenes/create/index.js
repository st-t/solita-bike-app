import React, { Component } from 'react'
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
            data:{},
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
                    settings
                </div>

            </div>
        );
    }
}