import json
import math

def get_distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def project_point_on_segment(p, a, b):
    # Project point p onto segment ab
    ap = [p[0] - a[0], p[1] - a[1]]
    ab = [b[0] - a[0], b[1] - a[1]]
    ab2 = ab[0]**2 + ab[1]**2
    if ab2 == 0:
        return a, 0
    
    t = (ap[0] * ab[0] + ap[1] * ab[1]) / ab2
    t = max(0, min(1, t))
    
    projected = [a[0] + t * ab[0], a[1] + t * ab[1]]
    return projected, t

def get_station_distance_on_line(station_coord, line_coords):
    # Find the closest point on the polyline and return distance from start
    min_dist = float('inf')
    best_dist_on_line = 0
    
    current_dist_on_line = 0
    
    # Flatten MultiLineString if necessary
    # We assume the segments are ordered or at least form a path.
    # If disjoint, this is a best-effort projection.
    
    for part in line_coords:
        # Check if part is a list of points (LineString) or list of lists (MultiLineString wrapper)
        # GeoJSON MultiLineString: [ [ [x,y], ... ], ... ]
        # But sometimes coordinates might be just [ [x,y], ... ] if it was a LineString?
        # The input line_coords comes from feature['geometry']['coordinates']
        # If type is MultiLineString, it is [ LineString1, LineString2 ]
        # LineString1 is [ Point1, Point2 ... ]
        
        # We iterate through all parts
        points = part
        if not isinstance(points[0], list):
             # It's a point [x, y], so part is a point? No.
             # If part is [x, y], then line_coords was [ [x,y], ... ] -> LineString
             # But we iterate line_coords.
             pass

        for i in range(len(points) - 1):
            p1 = points[i]
            p2 = points[i+1]
            
            segment_len = get_distance(p1, p2)
            
            proj_point, t = project_point_on_segment(station_coord, p1, p2)
            dist_to_segment = get_distance(station_coord, proj_point)
            
            if dist_to_segment < min_dist:
                min_dist = dist_to_segment
                best_dist_on_line = current_dist_on_line + (t * segment_len)
            
            current_dist_on_line += segment_len
            
    return best_dist_on_line

def process():
    print("Loading data...")
    with open('bj_station.geojson', 'r', encoding='utf-8') as f:
        stations_data = json.load(f)
    
    with open('bjlineTest.geojson', 'r', encoding='utf-8') as f:
        lines_data = json.load(f)

    # 1. Process Stations (Merge by Name)
    print("Processing stations...")
    stations_by_name = {}
    
    for feature in stations_data['features']:
        props = feature['properties']
        raw_id = props.get('si')
        name = props.get('n')
        p_str = props.get('p')
        r_str = props.get('r', '')
        
        # Parse coordinates
        try:
            x, y = map(float, p_str.split())
        except:
            print(f"Warning: Invalid coordinates for {name}: {p_str}")
            continue
            
        # Parse lines
        line_ids = [f"L_{lid}" for lid in r_str.split('|') if lid]
        
        # Geo coordinates
        lon = feature['geometry']['coordinates'][0]
        lat = feature['geometry']['coordinates'][1]

        if name in stations_by_name:
            # Merge into existing
            existing = stations_by_name[name]
            existing['lines'] = list(set(existing['lines'] + line_ids))
            existing['coords_list'].append({'x': x, 'y': y, 'lon': lon, 'lat': lat})
            # We keep the ID of the first one encountered, or maybe we should pick a stable one?
            # Keeping the first one is fine.
        else:
            # Create new
            s_id = f"S_{raw_id}"
            station_obj = {
                "id": s_id,
                "name": name,
                "lines": line_ids,
                "coords_list": [{'x': x, 'y': y, 'lon': lon, 'lat': lat}]
            }
            stations_by_name[name] = station_obj

    # Finalize station coordinates (Average)
    stations_js = {}
    for name, s_obj in stations_by_name.items():
        coords = s_obj['coords_list']
        avg_x = sum(c['x'] for c in coords) / len(coords)
        avg_y = sum(c['y'] for c in coords) / len(coords)
        avg_lon = sum(c['lon'] for c in coords) / len(coords)
        avg_lat = sum(c['lat'] for c in coords) / len(coords)
        
        s_obj['x'] = avg_x
        s_obj['y'] = avg_y
        s_obj['lon'] = avg_lon
        s_obj['lat'] = avg_lat
        del s_obj['coords_list'] # Cleanup
        
        stations_js[s_obj['id']] = s_obj

    # 2. Process Lines
    print("Processing lines...")
    lines_js = {}
    
    for feature in lines_data['features']:
        props = feature['properties']
        raw_line_id = props.get('ls')
        line_name = props.get('ln')
        color = props.get('cl')
        if not color.startswith('#'):
            color = f"#{color}"
            
        l_id = f"L_{raw_line_id}"
        
        # Find stations on this line
        line_stations = []
        for s_id, s_obj in stations_js.items():
            if l_id in s_obj['lines']:
                line_stations.append(s_obj)
        
        # Sort stations
        line_coords = feature['geometry']['coordinates']
        
        # Calculate distance for each station
        stations_with_dist = []
        for s_obj in line_stations:
            s_coord = [s_obj['lon'], s_obj['lat']]
            dist = get_station_distance_on_line(s_coord, line_coords)
            stations_with_dist.append((s_obj, dist))
            
        # Sort by distance
        stations_with_dist.sort(key=lambda x: x[1])
        
        sorted_station_ids = [item[0]['id'] for item in stations_with_dist]
        
        # Loop closure for Line 2 and Line 10
        if l_id in ['L_110100023098', 'L_110100023282']:
             if sorted_station_ids and sorted_station_ids[0] != sorted_station_ids[-1]:
                 sorted_station_ids.append(sorted_station_ids[0])
        
        lines_js[l_id] = {
            "id": l_id,
            "name": line_name,
            "color": color,
            "stations": sorted_station_ids
        }

    # 3. Generate JS Output
    print("Generating JS...")
    
    # Clean up station objects (remove lat/lon)
    final_stations = {}
    for s_id, s_obj in stations_js.items():
        final_stations[s_id] = {
            "id": s_obj['id'],
            "name": s_obj['name'],
            "x": s_obj['x'],
            "y": s_obj['y'],
            "lines": s_obj['lines']
        }
        
    js_content = f"const stations = {json.dumps(final_stations, ensure_ascii=False, indent=2)};\n\n"
    js_content += f"const lines = {json.dumps(lines_js, ensure_ascii=False, indent=2)};\n"
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Done! Saved to data.js")

if __name__ == "__main__":
    process()
