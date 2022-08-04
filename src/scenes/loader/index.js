import React, { Component } from 'react'
import styles from './index.module.css';
import  {loadingMessages} from './loading_messages.js';


export default class index extends Component {
    render() {
        return (
            <div className={styles.wrap}>
                <div className={styles.content}>

                    <div className={styles.loader}>
                        <span className={styles.inner}></span>
                    </div>
                    <h1 className={styles.message}>{loadingMessages[Math.floor(Math.random()*loadingMessages.length)]}</h1>
                    
                </div>
            </div>
        )
    }
}