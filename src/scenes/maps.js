import React, { Component } from "react";
import GoogleMapReact from "google-map-react";
import styles from './styles.module.css';

var lastLoaded = 0;


class GoogleMaps extends Component 
{
    constructor(props) 
    {
        super(props);

        this.state = {
            data: {},
            currentLocation: { lat: 60.16582, lng: 24.840319 }
        }
    };

    // Initialization(s) that requires DOM nodes should go here
    componentDidMount() 
    {

    }

    getMapsRoute()
    {
        const { pressed }  = this.props.data;

        const apiIsLoaded = (map) => 
        {
            const google = window.google;
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();

            directionsRenderer.setMap(map);

            var arr = this.props.coordinates;
            var arr_idx = this.props.coord_index;

            var return_lng = arr[8][arr_idx]; // x
            var return_lat = arr[9][arr_idx]; // y
            var departure_lng = arr[6][arr_idx]; // x
            var departure_lat = arr[7][arr_idx]; // y

            const origin = { lat: departure_lat, lng: departure_lng }; 
            const destination = { lat: return_lat, lng: return_lng }; 

            directionsService.route(
            {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.BICYCLING
            },
            (result, status) => 
            {
                if (status === google.maps.DirectionsStatus.OK) 
                {
                    directionsRenderer.setDirections(result);
                    console.log('<< DirectionsStatus OK');
                } else {
                    console.error(`<< Error fetching directions ${result}`);
                    console.log('<< Status: ' + status);
                }
            }
            );
        };
        
        if(!this.props.data.canLoad || lastLoaded === pressed) return;
        lastLoaded = pressed;

        const defaultMapOptions = {
            fullscreenControl: false,
            fullscreenControlOptions: false,
            controlSize: false,
            rotateControl: false, 
            rotateControlOptions: false, 
            scaleControl: false,
            zoomControl: false, 
            zoomControlOptions: false,
            draggableCursor: "default", 
            draggingCursor: "pointer"
        };

        return (
            <div className={styles.maps_outer}>
                <div className={styles.maps}>
                    <GoogleMapReact
                        bootstrapURLKeys={{key: "AIzaSyDVxd62MyhKyEmEIqvsv3R9cPKw6pX5H58"}}
                        defaultCenter={{ lat: 60.16582, lng: 24.840319 }}
                        options={defaultMapOptions}
                        defaultZoom={5}
                        center={this.state.currentLocation}
                        yesIWantToUseGoogleMapApiInternals
                        onGoogleApiLoaded={({ map }) => apiIsLoaded(map)}
                    />
                </div>
            </div>
        );
    }

    render() 
    {
        return (
            <>
                {this.getMapsRoute()}
            </>
        );
    }
}

export default GoogleMaps;