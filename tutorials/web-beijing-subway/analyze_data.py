import json
import sys

def analyze():
    try:
        with open('bj_station.geojson', 'r', encoding='utf-8') as f:
            stations_data = json.load(f)
        
        with open('bjlineTest.geojson', 'r', encoding='utf-8') as f:
            lines_data = json.load(f)
            
        # 1. Identify Line IDs
        line_name_to_id = {}
        for feature in lines_data['features']:
            props = feature['properties']
            line_name_to_id[props.get('ln')] = props.get('ls')
            
        print("Line IDs:")
        for name, lid in line_name_to_id.items():
            print(f"  {name}: {lid}")
            
        target_line_name = "13号线"
        target_line_id = line_name_to_id.get(target_line_name)
        
        if not target_line_id:
            print(f"Could not find ID for {target_line_name}")
            return

        print(f"\nStations for {target_line_name} (ID: {target_line_id}):")
        
        # 2. Find stations for Line 13
        stations_on_line = []
        for feature in stations_data['features']:
            props = feature['properties']
            r_prop = props.get('r', '')
            # r is pipe separated IDs
            related_lines = r_prop.split('|')
            
            if target_line_id in related_lines:
                stations_on_line.append(props.get('n'))
                
        print(f"Found {len(stations_on_line)} stations: {stations_on_line}")
        
        if "芍药居" in stations_on_line:
            print("SUCCESS: '芍药居' is identified as being on Line 13.")
        else:
            print("FAILURE: '芍药居' NOT found on Line 13.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze()
