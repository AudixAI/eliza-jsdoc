import { WeatherResponse } from "./types";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Creates a Weather Service object that allows fetching weather data for a specific location.
 * @param {string} apiKey - The API key to access the weather service.
 * @returns {{
 *   getWeather: (city: string, country?: string) => Promise<WeatherResponse>
 * }} The Weather Service object with a method to get weather data for a specific location.
 */
export const createWeatherService = (apiKey: string) => {
    const getWeather = async (
        city: string,
        country?: string
    ): Promise<WeatherResponse> => {
        if (!apiKey || !city) {
            throw new Error("Invalid parameters");
        }

        try {
            const location = country ? `${city},${country}` : city;

            const url = new URL(`${BASE_URL}/weather`);
            url.searchParams.append("q", location);
            url.searchParams.append("appid", apiKey);
            url.searchParams.append("units", "metric");

            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.message || response.statusText);
            }

            const data = await response.json();

            return data;
        } catch (error) {
            console.error("Weather API Error:", error.message);
            throw error;
        }
    };

    return { getWeather };
};
