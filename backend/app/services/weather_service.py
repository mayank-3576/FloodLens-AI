import os
import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("girirakshak.weather")

class WeatherAdapter:
    """
    Public weather adapter for live / near real-time rainfall observations.
    Integrates with Open-Meteo public meteorology API.
    Does not require API keys for open public queries.
    Gracefully falls back to database records when external connectivity is absent.
    """

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @classmethod
    async def fetch_live_rainfall(cls, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """
        Fetches the latest hourly precipitation and 24h accumulation from Open-Meteo.
        Returns None on timeout/offline to allow caller to use database records.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation",
            "timezone": "auto",
            "past_days": 1,
            "forecast_days": 1
        }
        
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get(cls.BASE_URL, params=params)
                if response.status_code == 200:
                    data = response.json()
                    hourly = data.get("hourly", {})
                    times = hourly.get("time", [])
                    precip = hourly.get("precipitation", [])
                    
                    if times and precip:
                        # Find closest current hour
                        now_str = datetime.now().strftime("%Y-%m-%dT%H:00")
                        idx = len(times) - 1
                        for i, t in enumerate(times):
                            if t >= now_str:
                                idx = max(0, i - 1)
                                break
                        
                        latest_val = float(precip[idx]) if idx < len(precip) else 0.0
                        latest_time = times[idx] if idx < len(times) else now_str

                        # Compute latest 24-hour sum
                        start_24 = max(0, idx - 23)
                        slice_24 = precip[start_24:idx + 1]
                        accum_24h = round(sum(float(p or 0.0) for p in slice_24), 1)

                        return {
                            "rainfall_mm": latest_val,
                            "accumulation_24h_mm": accum_24h,
                            "timestamp": latest_time,
                            "source_type": "LIVE_API",
                            "provider": "Open-Meteo (Live Reanalysis)",
                            "is_live": True
                        }
        except Exception as e:
            logger.info(f"Open-Meteo live API query bypassed or offline ({e}). Using stored dataset.")
        
        return None
