"""
Official Pan-India Administrative Directory based on Local Government Directory (LGD),
Ministry of Panchayati Raj, Government of India (https://lgdirectory.gov.in/).
Covers all 28 States and 8 Union Territories with verified districts, urban local bodies (ULBs),
and rural tehsils/blocks, along with geographic coordinates, elevations, and river basin associations.
"""

from typing import List, Dict, Any

PAN_INDIA_LOCATIONS: List[Dict[str, Any]] = [
    # =========================================================================
    # 1. ANDHRA PRADESH
    # =========================================================================
    {
        "id": "ap_vsp_rkbeach",
        "name": "Visakhapatnam (Beach Road & Port Corridor)",
        "state": "Andhra Pradesh",
        "district": "Visakhapatnam",
        "town": "Visakhapatnam City",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "elevation_m": 12.0,
        "basin_name": "East Coast Drainage & Meghadrigedda Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Cyclone Warning Centre AWS + Port Gauge Telemetry",
        "description": "Coastal port city bordered by Bay of Bengal and Eastern Ghats hills. Vulnerable to storm surge and flash runoff through Meghadrigedda reservoir channel."
    },
    {
        "id": "ap_vja_prakasam",
        "name": "Vijayawada (Prakasam Barrage & Krishna Riverfront)",
        "state": "Andhra Pradesh",
        "district": "NTR",
        "town": "Vijayawada City",
        "latitude": 16.5062,
        "longitude": 80.6480,
        "elevation_m": 22.0,
        "basin_name": "Lower Krishna River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Prakasam Barrage Hydrological Station",
        "description": "Critical river junction on Krishna River. Experiences river flooding during heavy upstream reservoir discharge from Srisailam and Nagarjuna Sagar."
    },
    {
        "id": "ap_gnt_auto",
        "name": "Guntur (Autonagar & Nallapadu)",
        "state": "Andhra Pradesh",
        "district": "Guntur",
        "town": "Guntur Town",
        "latitude": 16.3067,
        "longitude": 80.4365,
        "elevation_m": 33.0,
        "basin_name": "Krishna-Godavari Inter-Basin",
        "has_dedicated_gauge": False,
        "data_coverage_note": "District-level AWS telemetry applied; municipal ward micro-drainage estimated",
        "description": "Commercial and agricultural trading hub. Prone to road waterlogging during intense depression bursts due to clay-heavy black soils."
    },

    # =========================================================================
    # 2. ARUNACHAL PRADESH
    # =========================================================================
    {
        "id": "ar_itn_ganga",
        "name": "Itanagar (Ganga Lake & Chimpu River)",
        "state": "Arunachal Pradesh",
        "district": "Papum Pare",
        "town": "Itanagar",
        "latitude": 27.0844,
        "longitude": 93.6053,
        "elevation_m": 320.0,
        "basin_name": "Dikrong River Sub-basin (Brahmaputra)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Itanagar Meteorological Observatory",
        "description": "Hilly terrain capital in the Himalayan foothills. Flash floods and slope failure debris flows occur along Chimpu and Pachin river corridors."
    },
    {
        "id": "ar_psg_siang",
        "name": "Pasighat (Siang River Corridor)",
        "state": "Arunachal Pradesh",
        "district": "East Siang",
        "town": "Pasighat",
        "latitude": 28.0667,
        "longitude": 95.3333,
        "elevation_m": 155.0,
        "basin_name": "Siang / Brahmaputra Mainstem Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Pasighat River Gauging Site",
        "description": "Oldest town in Arunachal Pradesh where the mighty Siang exits the Himalayas into the plains. High velocity river discharges threaten embankments."
    },

    # =========================================================================
    # 3. ASSAM
    # =========================================================================
    {
        "id": "guwahati",
        "name": "Pandu & Bharalu River Corridor",
        "state": "Assam",
        "district": "Kamrup Metropolitan",
        "town": "Pandu",
        "latitude": 26.1445,
        "longitude": 91.7362,
        "elevation_m": 55.0,
        "basin_name": "Brahmaputra Valley Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Pandu Brahmaputra Gauge & IMD Borjhar",
        "description": "Gateway to the Northeast situated along the Brahmaputra River. Experiences hill runoff flash floods and severe drainage congestion in Bharalu channel."
    },
    {
        "id": "guwahati_dispur",
        "name": "Dispur & Zoo Road",
        "state": "Assam",
        "district": "Kamrup Metropolitan",
        "town": "Dispur",
        "latitude": 26.1520,
        "longitude": 91.7890,
        "elevation_m": 58.0,
        "basin_name": "Bharalu Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Assam State Disaster Management Authority (ASDMA) Urban Sensor",
        "description": "Administrative capital district prone to swift urban inundation when storm runoff from adjacent Meghalaya hills overwhelms city drains."
    },
    {
        "id": "dibrugarh_town",
        "name": "Dibrugarh Brahmaputra Protection Dike",
        "state": "Assam",
        "district": "Dibrugarh",
        "town": "Dibrugarh Town",
        "latitude": 27.4728,
        "longitude": 94.9120,
        "elevation_m": 108.0,
        "basin_name": "Upper Brahmaputra Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Dibrugarh River Monitoring Station",
        "description": "Historic upper Assam riverfront protected by municipal dikes; highly sensitive to bed river aggradation and bank erosion during monsoon crests."
    },
    {
        "id": "as_slc_barak",
        "name": "Silchar (Barak River Embankment)",
        "state": "Assam",
        "district": "Cachar",
        "town": "Silchar Town",
        "latitude": 24.8333,
        "longitude": 92.7789,
        "elevation_m": 25.0,
        "basin_name": "Barak River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Annapurna Ghat Silchar Hydrological Gauge",
        "description": "Barak Valley commercial center. Chronic flood zone subject to dyke overtopping at Bethukandi and prolonged stagnant waterlogging."
    },

    # =========================================================================
    # 4. BIHAR
    # =========================================================================
    {
        "id": "patna",
        "name": "Rajendra Nagar & Kankarbagh",
        "state": "Bihar",
        "district": "Patna",
        "town": "Rajendra Nagar",
        "latitude": 25.5941,
        "longitude": 85.1376,
        "elevation_m": 53.0,
        "basin_name": "Ganga & Punpun Confluence",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Digha Ghat & Gandhi Ghat Telemetry Gauges",
        "description": "State capital on south bank of Ganga. Saucer-shaped municipal topography makes inner residential colonies vulnerable to multi-day stagnant waterlogging."
    },
    {
        "id": "patna_danapur",
        "name": "Danapur Cantt Riverfront",
        "state": "Bihar",
        "district": "Patna",
        "town": "Danapur",
        "latitude": 25.6330,
        "longitude": 85.0440,
        "elevation_m": 54.0,
        "basin_name": "Ganga River Basin",
        "has_dedicated_gauge": False,
        "data_coverage_note": "District-level telemetry mapped from Digha gauge; local dike alert status active",
        "description": "Upstream riverfront embankment area with high silt deposition and backflow along Sone-Ganga confluence channels."
    },
    {
        "id": "bhagalpur_barari",
        "name": "Barari & Tilka Manjhi",
        "state": "Bihar",
        "district": "Bhagalpur",
        "town": "Barari Ghat",
        "latitude": 25.2425,
        "longitude": 86.9842,
        "elevation_m": 48.0,
        "basin_name": "Ganga Delta Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Bhagalpur River Gauging Station",
        "description": "Silk city riverfront vulnerable during high monsoon discharges combined with Kosi river backwaters."
    },
    {
        "id": "br_mzp_bagmati",
        "name": "Muzaffarpur (Burhi Gandak & Bagmati Basin)",
        "state": "Bihar",
        "district": "Muzaffarpur",
        "town": "Muzaffarpur City",
        "latitude": 26.1209,
        "longitude": 85.3647,
        "elevation_m": 60.0,
        "basin_name": "Burhi Gandak River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Sikandarpur Hydrological Station",
        "description": "North Bihar flood funnel where Burhi Gandak River frequently inundates low-lying urban colonies and rural agricultural chaur areas."
    },

    # =========================================================================
    # 5. CHHATTISGARH
    # =========================================================================
    {
        "id": "cg_rpr_kharun",
        "name": "Raipur (Kharun River Corridor & Telibandha)",
        "state": "Chhattisgarh",
        "district": "Raipur",
        "town": "Raipur City",
        "latitude": 21.2514,
        "longitude": 81.6296,
        "elevation_m": 298.0,
        "basin_name": "Mahanadi Upper Catchment (Kharun Basin)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Raipur Meteorological Centre",
        "description": "Capital city in central Chhattisgarh plain. Kharun river low banks and inner lake drains experience overflow during intense monsoon downpours."
    },
    {
        "id": "cg_bsp_arpa",
        "name": "Bilaspur (Arpa River Basin)",
        "state": "Chhattisgarh",
        "district": "Bilaspur",
        "town": "Bilaspur Town",
        "latitude": 22.0797,
        "longitude": 82.1409,
        "elevation_m": 262.0,
        "basin_name": "Arpa River Sub-basin (Seonath System)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Seonath / Arpa Hydrological Station",
        "description": "River Arpa divides Bilaspur. Sudden rain surges in Khondra hill forests cause swift flash river rises in town embankments."
    },

    # =========================================================================
    # 6. GOA
    # =========================================================================
    {
        "id": "ga_pnj_mandovi",
        "name": "Panaji (Mandovi Estuary & Miramar)",
        "state": "Goa",
        "district": "North Goa",
        "town": "Panaji",
        "latitude": 15.4909,
        "longitude": 73.8278,
        "elevation_m": 7.0,
        "basin_name": "Mandovi Estuary Coastal Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Altinho Panaji Observatory + Ports Tide Gauge",
        "description": "Coastal tidal capital. Vulnerable during concurrent high spring tides and torrential South-West monsoon spells."
    },
    {
        "id": "ga_mrg_sal",
        "name": "Margao (Sal River Lowlands)",
        "state": "Goa",
        "district": "South Goa",
        "town": "Margao",
        "latitude": 15.2832,
        "longitude": 73.9862,
        "elevation_m": 10.0,
        "basin_name": "Sal River Basin",
        "has_dedicated_gauge": False,
        "data_coverage_note": "District-level AWS telemetry applied; tidal backflow monitored via Salcete station",
        "description": "Commercial capital of South Goa. Low-lying paddy fields and Comba residential areas experience seasonal flood ingress."
    },

    # =========================================================================
    # 7. GUJARAT
    # =========================================================================
    {
        "id": "gj_ahd_sabarmati",
        "name": "Ahmedabad (Sabarmati Riverfront & Vasna)",
        "state": "Gujarat",
        "district": "Ahmedabad",
        "town": "Ahmedabad City",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "elevation_m": 53.0,
        "basin_name": "Sabarmati River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Subhash Bridge & Vasna Barrage Gauge Telemetry",
        "description": "Industrial metropolis bisected by Sabarmati River. Regulated by Dharoi Dam; heavy release creates flash flooding in western and eastern underpasses."
    },
    {
        "id": "gj_srt_tapi",
        "name": "Surat (Tapi River & Rander Corridor)",
        "state": "Gujarat",
        "district": "Surat",
        "town": "Surat City",
        "latitude": 21.1702,
        "longitude": 72.8311,
        "elevation_m": 13.0,
        "basin_name": "Tapi River Delta",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Ukai Dam Discharge & Surat Hope Bridge Gauge",
        "description": "High-risk delta city historically affected by catastrophic floods when Ukai Dam releases exceed 500,000 cusecs coinciding with high tides."
    },
    {
        "id": "gj_vdr_vishwamitri",
        "name": "Vadodara (Vishwamitri River Corridor)",
        "state": "Gujarat",
        "district": "Vadodara",
        "town": "Vadodara City",
        "latitude": 22.3072,
        "longitude": 73.1812,
        "elevation_m": 39.0,
        "basin_name": "Vishwamitri Catchment (Dhadhar Basin)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Vadodara Municipal Corporation (VMC) Flood Alert Sensors",
        "description": "Meandering river Vishwamitri cuts through city center with high silted banks. Heavy rainfall in Pavagadh hills triggers overflow and reptile displacement."
    },

    # =========================================================================
    # 8. HARYANA
    # =========================================================================
    {
        "id": "gurugram",
        "name": "Cyber City & Hero Honda Chowk",
        "state": "Haryana",
        "district": "Gurugram",
        "town": "Cyber City",
        "latitude": 28.4595,
        "longitude": 77.0266,
        "elevation_m": 220.0,
        "basin_name": "Najafgarh & Badshahpur Drain Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "GMDA Urban Flood Sensor Network & IMD Gurugram",
        "description": "Commercial IT hub with heavy paving. Natural drainage depressions and Aravalli foothills runoff concentrate in Badshahpur drain corridor during monsoon downpours."
    },
    {
        "id": "gurugram_sohna",
        "name": "Sohna Road Sub-basin",
        "state": "Haryana",
        "district": "Gurugram",
        "town": "Sohna Road",
        "latitude": 28.3840,
        "longitude": 77.0420,
        "elevation_m": 225.0,
        "basin_name": "Badshahpur Tributary Drain",
        "has_dedicated_gauge": False,
        "data_coverage_note": "Sub-catchment mapped from Gurugram district AWS",
        "description": "Suburban residential corridor vulnerable to runoff backflow when Najafgarh drain is swollen."
    },
    {
        "id": "faridabad_old",
        "name": "Old Faridabad & Badkhal",
        "state": "Haryana",
        "district": "Faridabad",
        "town": "Old Faridabad",
        "latitude": 28.4089,
        "longitude": 77.3178,
        "elevation_m": 210.0,
        "basin_name": "Yamuna Western Floodplain",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Faridabad AWS + Irrigation Department Telemetry",
        "description": "Industrial town bordered by Aravalli ridges to west and Yamuna dikes to east. Prone to localized drainage stalling."
    },
    {
        "id": "hr_amb_tangri",
        "name": "Ambala (Tangri River & Cantt)",
        "state": "Haryana",
        "district": "Ambala",
        "town": "Ambala Cantt",
        "latitude": 30.3782,
        "longitude": 76.7767,
        "elevation_m": 264.0,
        "basin_name": "Ghaggar-Tangri River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Ghaggar Hydrological Station",
        "description": "Traversed by monsoon-fed Tangri river originating in Shivalik hills. Sudden torrent breaches submerge army cantt and GT Road underpasses."
    },

    # =========================================================================
    # 9. HIMACHAL PRADESH
    # =========================================================================
    {
        "id": "hp_sml_mall",
        "name": "Shimla (Tutikandi & Dhalli Slopes)",
        "state": "Himachal Pradesh",
        "district": "Shimla",
        "town": "Shimla Urban",
        "latitude": 31.1048,
        "longitude": 77.1734,
        "elevation_m": 2206.0,
        "basin_name": "Sutlej-Yamuna Water Divide",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Shimla Meteorological Centre (Doppler Weather Radar)",
        "description": "Steep hillside capital prone to extreme cloudburst runoff, mudslides, and urban drainage gulley scouring along circular road corridors."
    },
    {
        "id": "hp_klu_beas",
        "name": "Kullu & Manali (Beas River Basin)",
        "state": "Himachal Pradesh",
        "district": "Kullu",
        "town": "Kullu Town",
        "latitude": 31.9579,
        "longitude": 77.1095,
        "elevation_m": 1279.0,
        "basin_name": "Upper Beas River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Bhuntar Beas River Gauging Station",
        "description": "Glaciated alpine river corridor. Extreme flash floods (such as July 2023) cause boulder transport and destruction of riverside highways."
    },

    # =========================================================================
    # 10. JHARKHAND
    # =========================================================================
    {
        "id": "jh_rnc_subarnarekha",
        "name": "Ranchi (Subarnarekha & Harmu River)",
        "state": "Jharkhand",
        "district": "Ranchi",
        "town": "Ranchi City",
        "latitude": 23.3441,
        "longitude": 85.3096,
        "elevation_m": 651.0,
        "basin_name": "Subarnarekha River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Ranchi Observatory + Getalsud Dam Sensor",
        "description": "Chota Nagpur plateau capital. Convective downpours cause swift localized inundation along encroached Harmu river nullah."
    },
    {
        "id": "jh_jsr_kharkai",
        "name": "Jamshedpur (Kharkai & Subarnarekha Confluence)",
        "state": "Jharkhand",
        "district": "East Singhbhum",
        "town": "Jamshedpur",
        "latitude": 22.8046,
        "longitude": 86.2029,
        "elevation_m": 135.0,
        "basin_name": "Subarnarekha & Kharkai Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Jamshedpur River Gauge",
        "description": "Steel city at the meeting point of Kharkai and Subarnarekha. Low-lying areas like Mango, Kadma, and Bagbera experience river spillover."
    },

    # =========================================================================
    # 11. KARNATAKA
    # =========================================================================
    {
        "id": "ka_blr_bellandur",
        "name": "Bengaluru (Bellandur & Varthur Catchment)",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "town": "Bengaluru East (Mahadevapura)",
        "latitude": 12.9352,
        "longitude": 77.6744,
        "elevation_m": 880.0,
        "basin_name": "Dakshina Pinakini (South Pennar) Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Karnataka State Natural Disaster Monitoring Centre (KSNDMC) Rain Gauges",
        "description": "Major tech corridor with chain of urban lakes. Encroachment of secondary stormwater storm-drains (rajakaluves) causes swift street inundation."
    },
    {
        "id": "ka_mng_netravati",
        "name": "Mangaluru (Netravati & Gurupura Estuary)",
        "state": "Karnataka",
        "district": "Dakshina Kannada",
        "town": "Mangaluru City",
        "latitude": 12.9141,
        "longitude": 74.8560,
        "elevation_m": 22.0,
        "basin_name": "Netravati-Gurupura Coastal Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Bantwal Netravati Station & IMD Panambur",
        "description": "West coast port city. High intensity monsoon bursts (>100mm/day) trigger flash floods and slope movements along coastal hills."
    },

    # =========================================================================
    # 12. KERALA
    # =========================================================================
    {
        "id": "kl_kch_periyar",
        "name": "Kochi (Periyar Delta & Kalamassery)",
        "state": "Kerala",
        "district": "Ernakulam",
        "town": "Kochi City",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "elevation_m": 3.0,
        "basin_name": "Periyar River Basin & Vembanad Lake",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Neeleswaram / Aluva Gauge + KSDMA Telemetry",
        "description": "Coastal port and backwater estuary. High sensitivity to Idukki and Idamalayar dam releases coinciding with Arabian Sea spring tides."
    },
    {
        "id": "kl_alp_kuttanad",
        "name": "Alappuzha & Kuttanad Delta",
        "state": "Kerala",
        "district": "Alappuzha",
        "town": "Kuttanad (Below Sea Level)",
        "latitude": 9.4981,
        "longitude": 76.3388,
        "elevation_m": -1.5,
        "basin_name": "Pamba & Meenachil Delta into Vembanad",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Chengannur / Thottappally Spillway Gauges",
        "description": "Below-sea-level agricultural delta known as the Rice Bowl of Kerala. Prolonged monsoon stagnation occurs when spillway outflow is impeded."
    },

    # =========================================================================
    # 13. MADHYA PRADESH
    # =========================================================================
    {
        "id": "mp_bpl_upperlake",
        "name": "Bhopal (Upper Lake Catchment & Kaliasot)",
        "state": "Madhya Pradesh",
        "district": "Bhopal",
        "town": "Bhopal City",
        "latitude": 23.2599,
        "longitude": 77.4126,
        "elevation_m": 500.0,
        "basin_name": "Betwa River Basin (Kaliasot Sub-basin)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Bhopal Meteorological Centre + Bhadbhada Dam Telemetry",
        "description": "City of Lakes in central India. Sluice gate releases from Bhadbhada Dam cause localized flooding along Kaliasot river downstream colonies."
    },
    {
        "id": "mp_hsh_narmada",
        "name": "Narmadapuram / Hoshangabad (Sethani Ghat)",
        "state": "Madhya Pradesh",
        "district": "Narmadapuram",
        "town": "Narmadapuram Town",
        "latitude": 22.7519,
        "longitude": 77.7289,
        "elevation_m": 294.0,
        "basin_name": "Narmada River Mainstem",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Sethani Ghat Primary Hydrological Station",
        "description": "Benchmark river gauging site on Narmada. Rapidly crosses danger mark (964 ft) during synchronous releases from Bargi and Tawa dams."
    },

    # =========================================================================
    # 14. MAHARASHTRA
    # =========================================================================
    {
        "id": "mumbai_kurla",
        "name": "Kurla & Mithi River Basin",
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "town": "Kurla",
        "latitude": 19.0726,
        "longitude": 72.8797,
        "elevation_m": 8.0,
        "basin_name": "Mithi River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "MCGM Automatic Weather Station + Mithi Water Level Sensor",
        "description": "Critical urban drainage bottleneck where Mithi River discharges into Mahim Creek. Vulnerable during concurrent high tide (>4.5m) and extreme rainfall."
    },
    {
        "id": "mumbai_andheri",
        "name": "Andheri Subway & Milan Subway",
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "town": "Andheri",
        "latitude": 19.1136,
        "longitude": 72.8697,
        "elevation_m": 11.0,
        "basin_name": "Mogara Nallah Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "MCGM Urban Drainage Flood Gauge",
        "description": "Chronic urban depression prone to rapid road closure during cloudburst precipitation."
    },
    {
        "id": "mumbai_dadar",
        "name": "Dadar TT & Hindmata",
        "state": "Maharashtra",
        "district": "Mumbai City",
        "town": "Dadar",
        "latitude": 19.0178,
        "longitude": 72.8478,
        "elevation_m": 6.0,
        "basin_name": "Central Mumbai Storm Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "MCGM Hindmata Underground Tank Sensor",
        "description": "Saucer-shaped low-elevation depression in central Mumbai historically prone to waterlogging."
    },
    {
        "id": "thane_city",
        "name": "Thane Ghodbunder Road",
        "state": "Maharashtra",
        "district": "Thane",
        "town": "Thane City",
        "latitude": 19.2183,
        "longitude": 72.9781,
        "elevation_m": 14.0,
        "basin_name": "Ulhas River & Thane Creek",
        "has_dedicated_gauge": False,
        "data_coverage_note": "District-level telemetry mapped from Thane Collectorate AWS",
        "description": "Foothill runoff from Sanjay Gandhi National Park meets coastal tidal creek."
    },
    {
        "id": "mh_pne_mutha",
        "name": "Pune (Mutha Riverfront & Sinhagad Road)",
        "state": "Maharashtra",
        "district": "Pune",
        "town": "Pune City",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "elevation_m": 560.0,
        "basin_name": "Mula-Mutha (Krishna Basin)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Bund Garden & Khadakwasla Dam Discharge Telemetry",
        "description": "Traversed by Mutha river. High outflow from Khadakwasla dam into city channels causes riverbank submergence along Baba Bhide bridge."
    },

    # =========================================================================
    # 15. MANIPUR
    # =========================================================================
    {
        "id": "mn_imp_nambul",
        "name": "Imphal (Nambul & Imphal River Basin)",
        "state": "Manipur",
        "district": "Imphal West",
        "town": "Imphal City",
        "latitude": 24.8170,
        "longitude": 93.9368,
        "elevation_m": 786.0,
        "basin_name": "Manipur River Basin (Chindwin-Irrawaddy)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Imphal River Gauge Station + State Relief Control",
        "description": "Intermontane valley capital. River embankment breaches at Khuman Lampak and Sagolband cause sudden citywide inundation."
    },

    # =========================================================================
    # 16. MEGHALAYA
    # =========================================================================
    {
        "id": "ml_shl_wahumkhrah",
        "name": "Shillong (Wah Umkhrah & Polo Ground)",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "town": "Shillong",
        "latitude": 25.5788,
        "longitude": 91.8933,
        "elevation_m": 1525.0,
        "basin_name": "Umiam River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Shillong Central Observatory",
        "description": "Pine-covered plateau capital. Heavy orographic rain causes swift valley flash flooding along Wah Umkhrah and Polo ground lowlands."
    },
    {
        "id": "ml_chr_sohra",
        "name": "Cherrapunji / Sohra (Southern Escarpment)",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "town": "Sohra",
        "latitude": 25.2702,
        "longitude": 91.7323,
        "elevation_m": 1430.0,
        "basin_name": "Surma-Meghna Basin Escarpment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Cherrapunji Historic Meteorological Station",
        "description": "One of the wettest places on Earth. Extreme precipitation causes torrent flash floods rushing into the plains of Sylhet (Bangladesh)."
    },

    # =========================================================================
    # 17. MIZORAM
    # =========================================================================
    {
        "id": "mz_azl_tlawng",
        "name": "Aizawl (Tlawng River Sub-catchment)",
        "state": "Mizoram",
        "district": "Aizawl",
        "town": "Aizawl City",
        "latitude": 23.7271,
        "longitude": 92.7176,
        "elevation_m": 1132.0,
        "basin_name": "Tlawng River Basin (Barak System)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Lengpui / Aizawl AWS",
        "description": "Ridge-top capital. Vulnerable to landslide dams along valleys and heavy runoff inundating water pump facilities along Tlawng river."
    },

    # =========================================================================
    # 18. NAGALAND
    # =========================================================================
    {
        "id": "nl_dmp_dhansiri",
        "name": "Dimapur (Dhansiri River Plains)",
        "state": "Nagaland",
        "district": "Dimapur",
        "town": "Dimapur Town",
        "latitude": 25.9094,
        "longitude": 93.7266,
        "elevation_m": 145.0,
        "basin_name": "Dhansiri River Basin (Brahmaputra)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Dhansiri Hydrological Station",
        "description": "Plains commercial capital of Nagaland. Swelling Dhansiri river causes extensive residential flooding in low-elevation colonies."
    },

    # =========================================================================
    # 19. ODISHA
    # =========================================================================
    {
        "id": "cuttack",
        "name": "Badambadi & Mahanadi Ring Road",
        "state": "Odisha",
        "district": "Cuttack",
        "town": "Badambadi",
        "latitude": 20.4625,
        "longitude": 85.8828,
        "elevation_m": 30.0,
        "basin_name": "Mahanadi & Kathajodi Delta",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Mahanadi Delta Division Telemetry",
        "description": "Millennium city positioned on a narrow spit between Mahanadi and Kathajodi rivers. Embankment ring roads protect against river rise, while internal waterlogging occurs during heavy monsoon depressions."
    },
    {
        "id": "bhubaneswar_patia",
        "name": "Jayadev Vihar & Rasulgarh",
        "state": "Odisha",
        "district": "Khordha",
        "town": "Bhubaneswar",
        "latitude": 20.2961,
        "longitude": 85.8245,
        "elevation_m": 45.0,
        "basin_name": "Kuakhai River Sub-basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Bhubaneswar Meteorological Centre",
        "description": "Modern capital city experiencing localized water congestion along NH16 drainage crossings."
    },

    # =========================================================================
    # 20. PUNJAB
    # =========================================================================
    {
        "id": "pb_ldh_buddhanullah",
        "name": "Ludhiana (Buddha Nullah Corridor)",
        "state": "Punjab",
        "district": "Ludhiana",
        "town": "Ludhiana City",
        "latitude": 30.9010,
        "longitude": 75.8573,
        "elevation_m": 244.0,
        "basin_name": "Sutlej River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Ludhiana Meteorological Station",
        "description": "Industrial hub traversed by Buddha Nullah. Overflow during monsoon breaches dikes and floods residential colonies along Chandar Nagar."
    },
    {
        "id": "pb_rpr_sutlej",
        "name": "Rupnagar / Ropar (Sutlej & Swan Confluence)",
        "state": "Punjab",
        "district": "Rupnagar",
        "town": "Ropar Town",
        "latitude": 30.9664,
        "longitude": 76.5331,
        "elevation_m": 260.0,
        "basin_name": "Upper Sutlej Basin (Ropar Barrage)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Ropar Barrage Hydrological Station",
        "description": "Downstream of Bhakra Nangal Dam. High barrage spillway releases cause inundation of floodplain villages and riparian farmlands."
    },

    # =========================================================================
    # 21. RAJASTHAN
    # =========================================================================
    {
        "id": "rj_jpr_dravyavati",
        "name": "Jaipur (Dravyavati River & Sanganer)",
        "state": "Rajasthan",
        "district": "Jaipur",
        "town": "Jaipur City",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "elevation_m": 431.0,
        "basin_name": "Dravyavati River (Banas-Chambal Basin)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Jaipur Meteorological Centre",
        "description": "Desert capital prone to high-intensity cloudbursts that fill dry riverbeds and create flash street waterlogging in walled city bazaars."
    },
    {
        "id": "rj_kta_chambal",
        "name": "Kota (Chambal Barrage Downstream)",
        "state": "Rajasthan",
        "district": "Kota",
        "town": "Kota City",
        "latitude": 25.1800,
        "longitude": 75.8300,
        "elevation_m": 271.0,
        "basin_name": "Chambal River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Kota Barrage Primary Discharge Station",
        "description": "Crucial river junction on Chambal. Sluice gate releases (>300,000 cusecs) flood downstream heritage monuments and low-lying settlements."
    },

    # =========================================================================
    # 22. SIKKIM
    # =========================================================================
    {
        "id": "sk_gtk_ranipool",
        "name": "Gangtok (Ranipool & Teesta Tributaries)",
        "state": "Sikkim",
        "district": "East Sikkim",
        "town": "Gangtok",
        "latitude": 27.3389,
        "longitude": 88.6065,
        "elevation_m": 1650.0,
        "basin_name": "Teesta River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Teesta Division & IMD Gangtok",
        "description": "Himalayan mountain capital. Glacial lake outburst floods (GLOF) and torrential monsoons cause extreme Teesta surge (e.g. Oct 2023 Chungthang event)."
    },

    # =========================================================================
    # 23. TAMIL NADU
    # =========================================================================
    {
        "id": "chennai_adyar",
        "name": "Adyar & Saidapet Basin",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "town": "Adyar",
        "latitude": 13.0012,
        "longitude": 80.2565,
        "elevation_m": 6.0,
        "basin_name": "Adyar & Buckingham Canal Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Greater Chennai Corporation Sensor + IMD Meenambakkam",
        "description": "Coastal plain city with low elevation. Prone to northeast monsoon cyclone inundations, urban wetland encroachment, and river spillover from Chembarambakkam reservoir."
    },
    {
        "id": "chennai_velachery",
        "name": "Velachery & Madipakkam",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "town": "Velachery",
        "latitude": 12.9790,
        "longitude": 80.2180,
        "elevation_m": 5.0,
        "basin_name": "Pallikaranai Marshland Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "GCC Smart City Flood Telemetry Station",
        "description": "Former marshland basin with chronic water pooling during severe depression rainfalls."
    },
    {
        "id": "kanchipuram_town",
        "name": "Sriperumbudur Industrial Sub-basin",
        "state": "Tamil Nadu",
        "district": "Kanchipuram",
        "town": "Sriperumbudur",
        "latitude": 12.9675,
        "longitude": 79.9442,
        "elevation_m": 37.0,
        "basin_name": "Palar River Basin",
        "has_dedicated_gauge": False,
        "data_coverage_note": "District-level AWS telemetry applied; tank cascade overflow monitored",
        "description": "Industrial corridor with seasonal tank cascades and lake overflows."
    },

    # =========================================================================
    # 24. TELANGANA
    # =========================================================================
    {
        "id": "tg_hyd_musi",
        "name": "Hyderabad (Musi River & Osman Sagar)",
        "state": "Telangana",
        "district": "Hyderabad",
        "town": "Hyderabad Old City",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "elevation_m": 505.0,
        "basin_name": "Musi River Basin (Krishna Basin)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "GHMC Urban Flood Early Warning Sensors + IMD Begumpet",
        "description": "Historic plateau metropolis. High-intensity downbursts cause rapid swelling of Musi river and inundation of causeways and low colonies."
    },
    {
        "id": "tg_bdc_godavari",
        "name": "Bhadrachalam (Godavari River Ghats)",
        "state": "Telangana",
        "district": "Bhadradri Kothagudem",
        "town": "Bhadrachalam",
        "latitude": 17.6689,
        "longitude": 80.8936,
        "elevation_m": 48.0,
        "basin_name": "Lower Godavari River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Bhadrachalam Hydrological Gauging Station",
        "description": "Prominent temple town on the banks of Godavari. Frequently reaches 3rd danger warning level (>53 ft) during intense catchment rainfall in Maharashtra and Chhattisgarh."
    },

    # =========================================================================
    # 25. TRIPURA
    # =========================================================================
    {
        "id": "tr_agt_howrah",
        "name": "Agartala (Howrah River Embankment)",
        "state": "Tripura",
        "district": "West Tripura",
        "town": "Agartala City",
        "latitude": 23.8315,
        "longitude": 91.2868,
        "elevation_m": 15.0,
        "basin_name": "Howrah River Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Howrah River Gauge + IMD Agartala",
        "description": "Border capital bordered by river Howrah and Katakhal canal. River rise exceeds danger mark when upstream Baramura hill rain is intense."
    },

    # =========================================================================
    # 26. UTTAR PRADESH
    # =========================================================================
    {
        "id": "noida",
        "name": "Noida Sector 62 & Electronic City",
        "state": "Uttar Pradesh",
        "district": "Gautam Buddha Nagar",
        "town": "Noida Sector 62",
        "latitude": 28.5355,
        "longitude": 77.3910,
        "elevation_m": 198.0,
        "basin_name": "Yamuna & Hindon River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Noida Authority Water & Sewerage Department Telemetry",
        "description": "Dense urban center bordered by the Yamuna River to the west and Hindon River to the east. Prone to river overflow in floodplains and urban waterlogging during high-intensity rain bursts."
    },
    {
        "id": "greater_noida",
        "name": "Greater Noida Alpha 1 & Pari Chowk",
        "state": "Uttar Pradesh",
        "district": "Gautam Buddha Nagar",
        "town": "Greater Noida",
        "latitude": 28.4744,
        "longitude": 77.5040,
        "elevation_m": 200.0,
        "basin_name": "Hindon Catchment",
        "has_dedicated_gauge": False,
        "data_coverage_note": "District-level AWS telemetry applied; local underpass monitoring",
        "description": "Planned urban sub-center with wide arterial roads but localized underpass pooling."
    },
    {
        "id": "ghaziabad",
        "name": "Sahibabad & Karhera Corridor",
        "state": "Uttar Pradesh",
        "district": "Ghaziabad",
        "town": "Sahibabad",
        "latitude": 28.6692,
        "longitude": 77.4538,
        "elevation_m": 214.0,
        "basin_name": "Hindon River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Ghaziabad Nagar Nigam Sanitation & Drainage Cell",
        "description": "Industrial and residential corridor traversed by the Hindon River. Low-lying areas like Karhera and Sahibabad experience localized flood ingress during barrage discharge."
    },
    {
        "id": "ghaziabad_indirapuram",
        "name": "Indirapuram & Vasundhara",
        "state": "Uttar Pradesh",
        "district": "Ghaziabad",
        "town": "Indirapuram",
        "latitude": 28.6410,
        "longitude": 77.3750,
        "elevation_m": 210.0,
        "basin_name": "Hindon River Basin",
        "has_dedicated_gauge": False,
        "data_coverage_note": "Mapped from Ghaziabad district sensor",
        "description": "High-density residential township. Micro-drainage overflows into Cis-Hindon canal during monsoon."
    },
    {
        "id": "prayagraj_sangam",
        "name": "Sangam & Daraganj",
        "state": "Uttar Pradesh",
        "district": "Prayagraj",
        "town": "Sangam Area",
        "latitude": 25.4358,
        "longitude": 81.8463,
        "elevation_m": 98.0,
        "basin_name": "Ganga-Yamuna Confluence",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Sangam / Phaphamau Hydrological Telemetry",
        "description": "Historic religious confluence where combined discharge causes inundation of low ghat settlements."
    },
    {
        "id": "varanasi_ghats",
        "name": "Dashashwamedh & Rajghat",
        "state": "Uttar Pradesh",
        "district": "Varanasi",
        "town": "Varanasi City",
        "latitude": 25.3176,
        "longitude": 82.9739,
        "elevation_m": 80.0,
        "basin_name": "Ganga River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Varanasi River Gauge Station",
        "description": "Riverfront ghats and ancient gullies experience backwater rise when Ganga crosses danger mark (71.26m)."
    },

    # =========================================================================
    # 27. UTTARAKHAND
    # =========================================================================
    {
        "id": "uk_hrd_ganga",
        "name": "Haridwar (Har Ki Pauri & Bheemgoda Barrage)",
        "state": "Uttarakhand",
        "district": "Haridwar",
        "town": "Haridwar Town",
        "latitude": 29.9457,
        "longitude": 78.1642,
        "elevation_m": 314.0,
        "basin_name": "Upper Ganga Basin (Foothills Exit)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Bheemgoda Barrage Hydrological Station",
        "description": "Point where Ganga exits the Shivalik hills onto the plains. Intense cloudbursts in Chamoli and Tehri cause massive volume crests through Haridwar."
    },
    {
        "id": "uk_ddn_bindal",
        "name": "Dehradun (Bindal & Rispana River Basins)",
        "state": "Uttarakhand",
        "district": "Dehradun",
        "town": "Dehradun City",
        "latitude": 30.3165,
        "longitude": 78.0322,
        "elevation_m": 640.0,
        "basin_name": "Song & Asan Basin (Yamuna-Ganga Divide)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Dehradun Meteorological Centre",
        "description": "Doon Valley capital. Seasonal monsoon torrents Rispana and Bindal swell in minutes during heavy cloudbursts, inundating slum encroachments."
    },

    # =========================================================================
    # 28. WEST BENGAL
    # =========================================================================
    {
        "id": "wb_kol_hooghly",
        "name": "Kolkata (Hooghly Riverfront & Kalighat)",
        "state": "West Bengal",
        "district": "Kolkata",
        "town": "Kolkata City",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "elevation_m": 9.0,
        "basin_name": "Lower Ganga-Hooghly Estuary",
        "has_dedicated_gauge": True,
        "data_coverage_note": "KMC Drainage Telemetry + CWC Garden Reach Tide Gauge",
        "description": "Megacity dependent on lock gates along Hooghly river and East Kolkata Wetlands. Extreme monsoon bursts during high tide cause widespread street flooding."
    },
    {
        "id": "wb_slg_mahananda",
        "name": "Siliguri (Mahananda River Basin)",
        "state": "West Bengal",
        "district": "Darjeeling",
        "town": "Siliguri Town",
        "latitude": 26.7271,
        "longitude": 88.3953,
        "elevation_m": 122.0,
        "basin_name": "Mahananda River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Mahananda Hydrological Station",
        "description": "Strategic chicken's neck corridor. Flash river rises from Darjeeling hills submerge riverside slum colonies."
    },

    # =========================================================================
    # 29. ANDAMAN AND NICOBAR ISLANDS (UT)
    # =========================================================================
    {
        "id": "an_ptb_phoenix",
        "name": "Port Blair (Phoenix Bay & Aberdeen)",
        "state": "Andaman and Nicobar Islands",
        "district": "South Andaman",
        "town": "Port Blair Town",
        "latitude": 11.6234,
        "longitude": 92.7265,
        "elevation_m": 16.0,
        "basin_name": "Bay of Bengal Island Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Port Blair Meteorological Centre + Tide Gauge",
        "description": "Island territory capital subject to extreme tropical depressions, coastal surge, and intense equatorial monsoon squalls."
    },

    # =========================================================================
    # 30. CHANDIGARH (UT)
    # =========================================================================
    {
        "id": "ch_chd_sukhna",
        "name": "Chandigarh (Sukhna Lake & Choe Corridor)",
        "state": "Chandigarh",
        "district": "Chandigarh",
        "town": "Chandigarh City",
        "latitude": 30.7333,
        "longitude": 76.7794,
        "elevation_m": 321.0,
        "basin_name": "Sukhna Choe & Patiali Rao (Ghaggar Catchment)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Chandigarh Centre + Sukhna Flood Gates Sensor",
        "description": "Union territory capital with planned grid stormwater system. Floodgates of Sukhna Lake open into seasonal choe during cloudburst downpours."
    },

    # =========================================================================
    # 31. DADRA AND NAGAR HAVELI AND DAMAN AND DIU (UT)
    # =========================================================================
    {
        "id": "dd_dmn_damanganga",
        "name": "Daman (Daman Ganga Estuary & Nani Daman)",
        "state": "Dadra and Nagar Haveli and Daman and Diu",
        "district": "Daman",
        "town": "Daman Town",
        "latitude": 20.3974,
        "longitude": 72.8328,
        "elevation_m": 5.0,
        "basin_name": "Daman Ganga River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Daman Ganga Gauging Site",
        "description": "Coastal enclave where Daman Ganga empties into Arabian Sea. Tidal surges combined with Madhuban Dam discharge flood fishing settlements."
    },

    # =========================================================================
    # 32. DELHI (UT / NCT)
    # =========================================================================
    {
        "id": "delhi_yamuna",
        "name": "Kashmere Gate / Yamuna Bazar",
        "state": "Delhi",
        "district": "Central Delhi",
        "town": "Kashmere Gate",
        "latitude": 28.6562,
        "longitude": 77.2410,
        "elevation_m": 216.0,
        "basin_name": "Yamuna River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Old Delhi Railway Bridge (LGD Benchmark Station)",
        "description": "Historic capital riverfront corridor. Key sites include Old Railway Bridge (warning 204.5m, danger 205.33m), Ring Road, and Monastery Market."
    },
    {
        "id": "delhi_ito",
        "name": "ITO & Vikas Marg Corridor",
        "state": "Delhi",
        "district": "Central Delhi",
        "town": "ITO",
        "latitude": 28.6289,
        "longitude": 77.2425,
        "elevation_m": 214.0,
        "basin_name": "Yamuna River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Delhi Jal Board Drain 12 Regulator Sensor",
        "description": "Major government and traffic artery. Prone to drain backflow from Drain No. 12 during high Yamuna water levels."
    },
    {
        "id": "delhi_civil_lines",
        "name": "Civil Lines & Monastery Market",
        "state": "Delhi",
        "district": "North Delhi",
        "town": "Civil Lines",
        "latitude": 28.6812,
        "longitude": 77.2228,
        "elevation_m": 218.0,
        "basin_name": "Yamuna River Basin",
        "has_dedicated_gauge": False,
        "data_coverage_note": "Mapped from Central Delhi Old Railway Bridge CWC gauge",
        "description": "Low-lying residential and diplomatic sector situated adjacent to Western Yamuna Canal escape routes."
    },
    {
        "id": "delhi_burari",
        "name": "Burari Floodplain",
        "state": "Delhi",
        "district": "North Delhi",
        "town": "Burari",
        "latitude": 28.7540,
        "longitude": 77.2020,
        "elevation_m": 212.0,
        "basin_name": "Yamuna Active Floodplain",
        "has_dedicated_gauge": False,
        "data_coverage_note": "District telemetry applied; flood plain zone",
        "description": "Agricultural and unauthorized resettlement belt within the active river inundation zone."
    },
    {
        "id": "delhi_mayur_vihar",
        "name": "Mayur Vihar & Akshardham",
        "state": "Delhi",
        "district": "East Delhi",
        "town": "Mayur Vihar",
        "latitude": 28.6080,
        "longitude": 77.2960,
        "elevation_m": 210.0,
        "basin_name": "Hindon-Yamuna Doab",
        "has_dedicated_gauge": False,
        "data_coverage_note": "East Delhi sub-catchment telemetry",
        "description": "Dense trans-Yamuna residential hub with localized stormwater congestion near subways."
    },
    {
        "id": "delhi_okhla",
        "name": "Okhla Industrial Area & Barrage",
        "state": "Delhi",
        "district": "South Delhi",
        "town": "Okhla",
        "latitude": 28.5355,
        "longitude": 77.2840,
        "elevation_m": 205.0,
        "basin_name": "Yamuna Downstream",
        "has_dedicated_gauge": True,
        "data_coverage_note": "UP Irrigation Okhla Barrage Hydrological Station",
        "description": "Downstream hydrological bottleneck where Yamuna water is regulated towards Agra Canal."
    },

    # =========================================================================
    # 33. JAMMU AND KASHMIR (UT)
    # =========================================================================
    {
        "id": "jk_srn_jhelum",
        "name": "Srinagar (Jhelum River & Ram Munshi Bagh)",
        "state": "Jammu and Kashmir",
        "district": "Srinagar",
        "town": "Srinagar City",
        "latitude": 34.0837,
        "longitude": 74.7973,
        "elevation_m": 1585.0,
        "basin_name": "Jhelum River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Ram Munshi Bagh Primary Hydrological Station",
        "description": "Kashmir valley capital along the meandering Jhelum. Embankment breaches (as in September 2014) cause catastrophic multi-meter valley inundation."
    },
    {
        "id": "jk_jmu_tawi",
        "name": "Jammu (Tawi River & Gujjar Nagar)",
        "state": "Jammu and Kashmir",
        "district": "Jammu",
        "town": "Jammu City",
        "latitude": 32.7266,
        "longitude": 74.8570,
        "elevation_m": 327.0,
        "basin_name": "Tawi River Basin (Chenab Tributary)",
        "has_dedicated_gauge": True,
        "data_coverage_note": "CWC Tawi River Bridge Hydrological Site",
        "description": "Foothill city traversed by the flashy Tawi river. High rainfall in Udhampur hills causes sudden crests eroding city bridge abutments."
    },

    # =========================================================================
    # 34. LADAKH (UT)
    # =========================================================================
    {
        "id": "la_leh_indus",
        "name": "Leh (Indus Valley & Choglamsar)",
        "state": "Ladakh",
        "district": "Leh",
        "town": "Leh Town",
        "latitude": 34.1526,
        "longitude": 77.5771,
        "elevation_m": 3524.0,
        "basin_name": "Upper Indus River Basin",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD High Altitude Observatory Leh",
        "description": "High altitude cold desert. Extremely vulnerable to sudden cloudburst flash floods and debris flows through dry alluvial fans (as in August 2010)."
    },

    # =========================================================================
    # 35. LAKSHADWEEP (UT)
    # =========================================================================
    {
        "id": "ld_kvr_lagoon",
        "name": "Kavaratti (Coral Lagoon Island)",
        "state": "Lakshadweep",
        "district": "Lakshadweep",
        "town": "Kavaratti",
        "latitude": 10.5667,
        "longitude": 72.6417,
        "elevation_m": 2.0,
        "basin_name": "Arabian Sea Coral Atoll Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "IMD Kavaratti Coastal Station + INCOIS Wave Sensor",
        "description": "Narrow atoll island with maximum elevation under 3 meters. Highly vulnerable to sea surge flooding and cyclone wave overtopping."
    },

    # =========================================================================
    # 36. PUDUCHERRY (UT)
    # =========================================================================
    {
        "id": "py_pud_promenade",
        "name": "Puducherry (Gingee River & Goubert Beach)",
        "state": "Puducherry",
        "district": "Puducherry",
        "town": "Puducherry Town",
        "latitude": 11.9416,
        "longitude": 79.8083,
        "elevation_m": 3.0,
        "basin_name": "Gingee (Varahanadi) River Catchment",
        "has_dedicated_gauge": True,
        "data_coverage_note": "Puducherry PWD Hydrographic Telemetry + IMD Observatory",
        "description": "Coastal union territory on Coromandel Coast. Vulnerable to Bay of Bengal cyclonic depression rainfalls and low-lying coastal lagoon stagnation."
    }
]

def get_pan_india_states() -> List[str]:
    """Returns sorted list of all 36 States and Union Territories."""
    return sorted(list(set(loc["state"] for loc in PAN_INDIA_LOCATIONS)))

def get_districts_by_state(state: str) -> List[str]:
    """Returns sorted list of districts in a given State or UT."""
    return sorted(list(set(loc["district"] for loc in PAN_INDIA_LOCATIONS if loc["state"].lower() == state.lower())))

def get_towns_by_district(district: str) -> List[Dict[str, Any]]:
    """Returns list of towns/localities in a given district."""
    return [loc for loc in PAN_INDIA_LOCATIONS if loc["district"].lower() == district.lower()]
