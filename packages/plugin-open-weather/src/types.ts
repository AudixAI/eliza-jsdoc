/**
 * Interface representing a response from a weather API.
 * @interface WeatherResponse
 * @property {Coordinates} coord - The geographical coordinates of the location
 * @property {Weather[]} weather - An array of weather objects describing the current weather
 * @property {string} base - The source of the weather data
 * @property {MainWeather} main - Details about the main weather conditions
 * @property {number} visibility - The visibility in meters
 * @property {Wind} wind - Details about the wind conditions
 * @property {Precipitation} [rain] - Details about the rain conditions (if present)
 * @property {Precipitation} [snow] - Details about the snow conditions (if present)
 * @property {Clouds} clouds - Details about the cloud conditions
 * @property {number} dt - The time of data calculation
 * @property {System} sys - Details about the system
 * @property {number} timezone - The timezone offset in seconds
 * @property {number} id - The city ID
 * @property {string} name - The name of the city
 * @property {number} cod - The HTTP response code
 */
export interface WeatherResponse {
    coord: Coordinates;
    weather: Weather[];
    base: string;
    main: MainWeather;
    visibility: number;
    wind: Wind;
    rain?: Precipitation;
    snow?: Precipitation;
    clouds: Clouds;
    dt: number;
    sys: System;
    timezone: number;
    id: number;
    name: string;
    cod: number;
}

/**
 * Interface for representing coordinates.
 * @interface Coordinates
 * @property {number} lon - The longitude value.
 * @property {number} lat - The latitude value.
 */
interface Coordinates {
    lon: number;
    lat: number;
}

/**
 * Interface representing weather information.
 * @property {number} id - The ID of the weather.
 * @property {string} main - The main weather description.
 * @property {string} description - A detailed description of the weather.
 * @property {string} icon - An icon representing the weather.
 */
interface Weather {
    id: number;
    main: string;
    description: string;
    icon: string;
}

/**
 * Interface representing main weather information.
 * @typedef {Object} MainWeather
 * @property {number} temp - The temperature.
 * @property {number} feels_like - The temperature it feels like.
 * @property {number} temp_min - The minimum temperature.
 * @property {number} temp_max - The maximum temperature.
 * @property {number} pressure - The atmospheric pressure.
 * @property {number} humidity - The humidity level.
 * @property {number} [sea_level] - The sea level pressure.
 * @property {number} [grnd_level] - The ground level pressure.
 */
interface MainWeather {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
}

/**
 * Interface representing wind information.
 * @typedef {Object} Wind
 * @property {number} speed - The speed of the wind.
 * @property {number} deg - The direction of the wind in degrees.
 * @property {number} [gust] - The gust speed of the wind (optional).
 */
interface Wind {
    speed: number;
    deg: number;
    gust?: number;
}

/**
 * Interface representing precipitation data.
 * @property {number} [1h] - Precipitation amount in the last hour.
 * @property {number} [3h] - Precipitation amount in the last 3 hours.
 */
interface Precipitation {
    "1h"?: number;
    "3h"?: number;
}

/**
 * Interface representing cloud coverage data.
 * @interface Clouds
 * @property {number} all - The percentage of cloud coverage.
 */
interface Clouds {
    all: number;
}

/**
 * Interface representing a system object.
 * @property {number} type - The type of system.
 * @property {number} id - The ID of the system.
 * @property {string} country - The country associated with the system.
 * @property {number} sunrise - The time of sunrise for the system.
 * @property {number} sunset - The time of sunset for the system.
 */
interface System {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
}
