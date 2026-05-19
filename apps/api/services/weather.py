"""Weather lookup helpers backed by Open-Meteo's public APIs."""

from __future__ import annotations

from typing import Literal, TypedDict

import httpx


class WeatherServiceError(RuntimeError):
    """Raised when the weather API cannot satisfy a lookup."""

    status_code = 502


class WeatherLocationNotFoundError(WeatherServiceError):
    """Raised when geocoding cannot resolve the requested place."""

    status_code = 404


class WeatherDataDict(TypedDict):
    location: str
    country: str
    latitude: float
    longitude: float
    temperature: float
    apparent_temperature: float
    temperature_unit: str
    humidity: int
    precipitation: float
    wind_speed: float
    wind_speed_unit: str
    condition: str
    observed_at: str


WeatherUnit = Literal["celsius", "fahrenheit"]


WEATHER_CODE_LABELS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _format_location(place: dict) -> tuple[str, str]:
    parts = [place.get("name")]
    admin = place.get("admin1")
    if admin:
        parts.append(admin)

    country = place.get("country") or ""
    return ", ".join(part for part in parts if part), country


def get_current_weather(
    location: str,
    unit: WeatherUnit = "celsius",
) -> WeatherDataDict:
    """Resolve a place name and return current weather conditions."""
    try:
        with httpx.Client(timeout=10.0) as client:
            geocode_response = client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={
                    "name": location,
                    "count": 1,
                    "language": "en",
                    "format": "json",
                },
            )
            geocode_response.raise_for_status()
            geocode_payload = geocode_response.json()

            results = geocode_payload.get("results") or []
            if not results:
                raise WeatherLocationNotFoundError(
                    f"No weather location found for {location!r}."
                )

            place = results[0]
            display_location, country = _format_location(place)
            latitude = float(place["latitude"])
            longitude = float(place["longitude"])

            forecast_response = client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": ",".join(
                        [
                            "temperature_2m",
                            "relative_humidity_2m",
                            "apparent_temperature",
                            "precipitation",
                            "weather_code",
                            "wind_speed_10m",
                        ]
                    ),
                    "temperature_unit": (
                        "fahrenheit" if unit == "fahrenheit" else "celsius"
                    ),
                    "wind_speed_unit": "mph" if unit == "fahrenheit" else "kmh",
                },
            )
            forecast_response.raise_for_status()
            forecast_payload = forecast_response.json()
    except WeatherServiceError:
        raise
    except (KeyError, TypeError, ValueError, httpx.HTTPError) as exc:
        raise WeatherServiceError("Weather lookup failed. Please try again.") from exc

    current = forecast_payload.get("current") or {}
    units = forecast_payload.get("current_units") or {}
    weather_code = int(current.get("weather_code", -1))

    return {
        "location": display_location,
        "country": country,
        "latitude": latitude,
        "longitude": longitude,
        "temperature": float(current["temperature_2m"]),
        "apparent_temperature": float(current["apparent_temperature"]),
        "temperature_unit": units.get("temperature_2m", "°C"),
        "humidity": int(current["relative_humidity_2m"]),
        "precipitation": float(current["precipitation"]),
        "wind_speed": float(current["wind_speed_10m"]),
        "wind_speed_unit": units.get("wind_speed_10m", "km/h"),
        "condition": WEATHER_CODE_LABELS.get(weather_code, "Unknown conditions"),
        "observed_at": str(current["time"]),
    }
