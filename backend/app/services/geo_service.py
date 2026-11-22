import math
from typing import Dict, Any, List, Optional, Tuple

# Comprehensive Geo-Coordinates for Indian Cities and Technology Sub-Localities
INDIAN_TECH_LOCATIONS: Dict[str, Dict[str, Any]] = {
    # PUNE
    "pune": {
        "city": "Pune",
        "state": "Maharashtra",
        "lat": 18.5204,
        "lng": 73.8567,
        "localities": {
            "hinjewadi": {"lat": 18.5913, "lng": 73.7389, "name": "Hinjewadi Tech Park Phase 1-3"},
            "baner": {"lat": 18.5590, "lng": 73.7868, "name": "Baner IT Corridor"},
            "wakad": {"lat": 18.5987, "lng": 73.7634, "name": "Wakad"},
            "kharadi": {"lat": 18.5516, "lng": 73.9351, "name": "EON Free Zone / Kharadi"},
            "magarpatta": {"lat": 18.5146, "lng": 73.9298, "name": "Magarpatta Cybercity"},
            "pimpri-chinchwad": {"lat": 18.6298, "lng": 73.7997, "name": "Pimpri-Chinchwad / Bhosari"},
            "senapati bapat road": {"lat": 18.5308, "lng": 73.8289, "name": "Senapati Bapat Road"},
            "viman nagar": {"lat": 18.5679, "lng": 73.9143, "name": "Viman Nagar"},
            "kothrud": {"lat": 18.5074, "lng": 73.8077, "name": "Kothrud"}
        }
    },
    # BENGALURU
    "bengaluru": {
        "city": "Bengaluru",
        "state": "Karnataka",
        "lat": 12.9716,
        "lng": 77.5946,
        "localities": {
            "whitefield": {"lat": 12.9698, "lng": 77.7500, "name": "Whitefield / EPIP Zone"},
            "koramangala": {"lat": 12.9352, "lng": 77.6245, "name": "Koramangala Startup Hub"},
            "electronic city": {"lat": 12.8452, "lng": 77.6602, "name": "Electronic City Phase 1 & 2"},
            "hsr layout": {"lat": 12.9121, "lng": 77.6446, "name": "HSR Layout"},
            "indiranagar": {"lat": 12.9784, "lng": 77.6408, "name": "Indiranagar"},
            "bellandur": {"lat": 12.9260, "lng": 77.6762, "name": "Outer Ring Road / Bellandur"},
            "manyata": {"lat": 13.0489, "lng": 77.6213, "name": "Manyata Tech Park / Hebbal"}
        }
    },
    # HYDERABAD
    "hyderabad": {
        "city": "Hyderabad",
        "state": "Telangana",
        "lat": 17.3850,
        "lng": 78.4867,
        "localities": {
            "hitec city": {"lat": 17.4435, "lng": 78.3772, "name": "HITEC City / Cyberabad"},
            "gachibowli": {"lat": 17.4401, "lng": 78.3489, "name": "Gachibowli Financial District"},
            "madhapur": {"lat": 17.4483, "lng": 78.3915, "name": "Madhapur"},
            "kondapur": {"lat": 17.4682, "lng": 78.3615, "name": "Kondapur"},
            "jubilee hills": {"lat": 17.4319, "lng": 78.4073, "name": "Jubilee Hills"}
        }
    },
    # DELHI-NCR (Gurugram / Noida / Delhi)
    "delhi": {
        "city": "Delhi-NCR",
        "state": "Delhi",
        "lat": 28.6139,
        "lng": 77.2090,
        "localities": {
            "gurugram cyber city": {"lat": 28.4907, "lng": 77.0898, "name": "DLF Cyber City / Gurugram"},
            "noida sector 62": {"lat": 28.6280, "lng": 77.3649, "name": "Noida Sector 62 / Electronic City"},
            "connaught place": {"lat": 28.6315, "lng": 77.2167, "name": "Connaught Place / Central Delhi"},
            "okhla": {"lat": 28.5298, "lng": 77.2798, "name": "Okhla Industrial Area Phase 1-3"}
        }
    },
    # MUMBAI
    "mumbai": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "lat": 19.0760,
        "lng": 72.8777,
        "localities": {
            "bkc": {"lat": 19.0657, "lng": 72.8687, "name": "Bandra Kurla Complex (BKC)"},
            "powai": {"lat": 19.1176, "lng": 72.9060, "name": "Powai / Hiranandani Tech Hub"},
            "andheri east": {"lat": 19.1136, "lng": 72.8697, "name": "Andheri East / MIDC / SEEPZ"},
            "navi mumbai": {"lat": 19.0330, "lng": 73.0297, "name": "Navi Mumbai / Airoli Mindspace"}
        }
    },
    # CHENNAI
    "chennai": {
        "city": "Chennai",
        "state": "Tamil Nadu",
        "lat": 13.0827,
        "lng": 80.2707,
        "localities": {
            "omr": {"lat": 12.9249, "lng": 80.2270, "name": "Old Mahabalipuram Road (OMR)"},
            "tidel park": {"lat": 12.9890, "lng": 80.2483, "name": "Tidel Park / Taramani"},
            "guindy": {"lat": 13.0067, "lng": 80.2025, "name": "Guindy Industrial Estate"}
        }
    },
    # AHMEDABAD
    "ahmedabad": {
        "city": "Ahmedabad",
        "state": "Gujarat",
        "lat": 23.0225,
        "lng": 72.5714,
        "localities": {
            "gift city": {"lat": 23.1611, "lng": 72.6841, "name": "GIFT City / Gandhinagar"},
            "sg highway": {"lat": 23.0454, "lng": 72.5188, "name": "SG Highway Tech Corridor"}
        }
    },
    # KOLKATA
    "kolkata": {
        "city": "Kolkata",
        "state": "West Bengal",
        "lat": 22.5726,
        "lng": 88.3639,
        "localities": {
            "salt lake sector v": {"lat": 22.5804, "lng": 88.4347, "name": "Salt Lake Sector V"},
            "new town": {"lat": 22.5937, "lng": 88.4833, "name": "New Town / Rajarhat"}
        }
    }
}

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes exact great-circle distance between two coordinates in kilometers.
    """
    R = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def resolve_location_coordinates(city: str, locality: Optional[str] = None) -> Tuple[Optional[float], Optional[float], str]:
    """
    Returns (lat, lng, normalized_name) for a city/locality.
    """
    city_key = city.lower().strip() if city else ""
    # Normalize aliases
    if city_key in ["bangalore", "bengaluru"]:
        city_key = "bengaluru"
    elif city_key in ["delhi", "gurgaon", "gurugram", "noida", "delhi-ncr"]:
        city_key = "delhi"

    city_data = INDIAN_TECH_LOCATIONS.get(city_key)
    if not city_data:
        # Search in values
        for k, v in INDIAN_TECH_LOCATIONS.items():
            if k in city_key or city_key in k:
                city_data = v
                break

    if not city_data:
        # Default center of India (Nagpur coordinates approx)
        return 20.5937, 78.9629, city or "India"

    if locality:
        loc_key = locality.lower().strip()
        localities = city_data.get("localities", {})
        for l_k, l_v in localities.items():
            if l_k in loc_key or loc_key in l_k:
                return l_v["lat"], l_v["lng"], f"{l_v['name']}, {city_data['city']}"

    return city_data["lat"], city_data["lng"], f"{city_data['city']}, {city_data['state']}"

def is_within_radius(
    user_lat: float, user_lng: float, target_lat: float, target_lng: float, radius_km: float
) -> Tuple[bool, float]:
    dist = haversine_distance_km(user_lat, user_lng, target_lat, target_lng)
    return dist <= radius_km, dist
