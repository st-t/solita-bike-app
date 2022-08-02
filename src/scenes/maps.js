import React, { Component } from "react";
import GoogleMapReact from "google-map-react";
import styles from './styles.module.css';

let mapsObj = null;
var mapInit = false;
let isApiLoaded = false;

var directionsService;
var directionsRenderer;

const defaultMapOptions = 
{
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


const Marker = () => {
    return <>
        <div className={styles.pin}></div>
        <div className={styles.pulse}></div>
    </>
}


class GoogleMaps extends Component 
{
    constructor(props) 
    {
        super(props);

        this.state = {
            data: {},
            lat: 0, lng: 0,
            currentLocation: { lat: 60.16582, lng: 24.840319 },
        }
    };

    // Map route called from journey list (index page)
    getMapsRoute()
    {
        const apiIsLoaded = (map) => 
        {
            const google = window.google;

            mapInit = true;
            const directionsServ = new google.maps.DirectionsService();
            const directionsRender = new google.maps.DirectionsRenderer();
            directionsService = directionsServ;
            directionsRenderer = directionsRender;

            directionsRender.setMap(map);

            var arr = this.props.coordinates;
            var arr_idx = this.props.coord_index;

            var return_lng = arr[8][arr_idx]; // x
            var return_lat = arr[9][arr_idx]; // y
            var departure_lng = arr[6][arr_idx]; // x
            var departure_lat = arr[7][arr_idx]; // y

            const origin = { lat: departure_lat, lng: departure_lng }; 
            const destination = { lat: return_lat, lng: return_lng }; 

            directionsServ.route(
            {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.BICYCLING
            },
            (result, status) => 
            {
                if (status === google.maps.DirectionsStatus.OK) 
                {
                    console.log('<< Status: ' + status);
                    directionsRender.setDirections(result);
                }
                else 
                {
                    console.log('<< Status: ' + status);
                    console.error(`<< Error fetching directions ${result}`);
                }
            });
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

    // Map route from create journey page
    // (Route between journey stations)
    getCreateMapsRoute()
    {
        const apiIsLoaded = (map) => 
        {
            var return_lng = null; // x
            var return_lat = null; // y
            var departure_lng = null; // x
            var departure_lat = null; // y

            const { stations_data, d_station, r_station } = this.props.data;
            
            // If stations data contains searched term
            for(let i = 0; i < stations_data[1].length; i++)   
            {
                if(!stations_data[1][i])
                    break;
                
                let str = String( stations_data[0][i] );
                let c_with = d_station.toLowerCase();
                let compare = str.toLowerCase();

                if( compare.indexOf(c_with) > -1 || compare === c_with )
                {
                    departure_lat = stations_data[3][i]; // y
                    departure_lng = stations_data[2][i]; // x
                }

                c_with = r_station.toLowerCase();

                if( compare.indexOf(c_with) > -1 || compare === c_with )
                {
                    return_lat = stations_data[3][i]; // y
                    return_lng = stations_data[2][i]; // x
                }
            }

            if(!return_lat || !return_lng || !departure_lng || !departure_lat)
            {
                console.log(' << Route error: Coordinates data null');
                return 0;
            }

            const google = window.google;

            // Use only one instance, otherwise we might get multiple routes
            if(!mapInit)
            {
                mapInit = true;
                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer();
            }
            
            directionsRenderer.setMap(map);

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
                    this.props.changeProps({distance: result.routes[0].legs[0].distance.value});
                    this.props.changeProps({distance_text: result.routes[0].legs[0].distance.text});
                } 
                else 
                {
                    console.log('<< Status: ' + status);
                    console.error(`<< Error fetching directions ${result}`);
                }
            });
        };

        const apiAlreadyLoaded = () =>
        {
            if(isApiLoaded) apiIsLoaded(mapsObj);
        }

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
                    {apiAlreadyLoaded()}
                </div>
            </div>
        );
    }

    // Map location called from single station view or create journey
    getMapLocation()
    {
        const {isCreate, mapPreview, clickOnCoord} = this.props;

        // Client is in creation page and has set both stations to get the route 
        if(isCreate && !mapPreview) return this.getCreateMapsRoute();

        // Client is in creation page and hasn't set stations yet
        if(isCreate && mapPreview) return this.renderMaps(false);

        // Client is creating a new station
        if(clickOnCoord) return this.getCoordsOnClick();

        // Client is in single station view
        return this.renderMaps(true);
    }

    // Client is creating a new station
    getCoordsOnClick()
    {
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
                        onClick={(key) => this.handleClick(key)}
                    >
                    <Marker lat={this.state.lat} lng={this.state.lng} />
                    </GoogleMapReact>
                </div>
            </div>
        );
    }

    // Renders a marker on the map
    // (When client is creating a new station)
    handleClick(event)
    {
        let coord = {lat: event.lat, lng: event.lng};
        
        this.props.changeProps({station_lat: event.lat});
        this.props.changeProps({station_long: event.lng});

        this.setState({
            lat: event.lat,
            lng: event.lng,
            currentLocation: coord
        })

        const { station_name, station_address, station_city } = this.props.data;
        this.props.checkNewStation(event.lng, event.lat, station_name, station_address, station_city, true);
    }

    // Called from creation page and single station view
    // Renders a marker when client is on station view 
    renderMaps(markers=false)
    {
        const renderMarkers = (map, maps) => 
        {
            mapsObj = map;
            isApiLoaded = true;

            if(markers)
                new maps.Marker({position: this.state.currentLocation, map}); 
        }

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
                        onGoogleApiLoaded={({ map, maps }) => renderMarkers(map, maps)}
                    />
                </div>
            </div>
        );
    }

    render() 
    {
        const { isJourney } = this.props;

        return (
            <>{ isJourney === true ? this.getMapsRoute() : this.getMapLocation() }</>
        );
    }
}


export default GoogleMaps;