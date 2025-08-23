import httpx
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

class LinkedInSearchService:
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_KEY")
        if not self.api_key:
            raise ValueError("SERPAPI_KEY environment variable is required")
        self.base_url = "https://serpapi.com/search"
        logger.info("Initialized LinkedInSearchService")

    async def search_linked_in_profiles(self, location: str, role: str = "", page: int = 1) -> Dict:
        logger.info(f"Searching LinkedIn profiles: location={location}, role={role}, page={page}")
        query = f'site:linkedin.com/in/ "{role}" "{location}"' if role else f'site:linkedin.com/in/ "{location}"'
        params = {
            "engine": "google",
            "q": query,
            "api_key": self.api_key,
            "start": (page - 1) * 10,
            "num": 10,
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()
            profiles = self._transform_results(data.get("organic_results", []))
            logger.info(f"Found {len(profiles)} LinkedIn profiles")
            return {
                "profiles": profiles,
                "totalResults": len(profiles) * 10,
                "currentPage": page,
                "hasNextPage": bool(data.get("pagination", {}).get("next") and len(profiles) == 10),
            }
        except Exception as e:
            logger.error(f"LinkedIn search failed: {e}")
            raise

    def _transform_results(self, results: List[Dict]) -> List[Dict]:
        profiles = []
        for result in results:
            if not (result.get("link") and "linkedin.com/in/" in result["link"]):
                continue
            title_parts = result["title"].split(" - ")
            name = title_parts[0].strip()
            headline = ""
            if len(title_parts) > 1:
                headline = title_parts[1].replace(" | LinkedIn", "").strip()
            elif result.get("snippet"):
                headline = result["snippet"].split(".")[0].strip()
            profiles.append({
                "name": name,
                "headline": headline,
                "link": result["link"],
                "position": headline,
                "thumbnail": result.get("thumbnail", ""),
            })
        return profiles[:10]

linkedin_service = LinkedInSearchService()