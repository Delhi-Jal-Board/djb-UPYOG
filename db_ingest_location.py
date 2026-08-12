import json
import csv
import uuid
import time
import subprocess
import os

DB_HOST = "localhost"
DB_USER = "postgres"
DB_PASS = "root"
DB_NAME = "postgres"
DATA_FILE = "/home/hp/Desktop/djb-mdms-data/djb-mdms-data/data/dl/egov-location/boundary-data.json"
CSV_FILE = "/tmp/mdms_data.csv"

def get_current_time_ms():
    return int(time.time() * 1000)

def main():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
        
    tenant_boundaries = data.get("TenantBoundary", [])
    print(f"Found {len(tenant_boundaries)} TenantBoundary records.")

    # Write to CSV
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile, delimiter='|', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        
        for item in tenant_boundaries:
            record_id = str(uuid.uuid4())
            tenantid = "dl"
            uniqueidentifier = item.get("hierarchyType", {}).get("code", str(uuid.uuid4()))
            schemacode = "egov-location.TenantBoundary"
            data_json = json.dumps(item)
            isactive = 'true'
            createdby = "5648ebaf-ed87-49f5-b026-637620ccab56"
            lastmodifiedby = createdby
            createdtime = str(get_current_time_ms())
            lastmodifiedtime = createdtime
            
            # The order must match the COPY statement
            writer.writerow([
                record_id, 
                tenantid, 
                uniqueidentifier, 
                schemacode, 
                data_json, 
                isactive, 
                createdby, 
                lastmodifiedby, 
                createdtime, 
                lastmodifiedtime
            ])
            print(f"Prepared {uniqueidentifier} for ingestion.")
            
    # Execute psql COPY
    copy_sql = f"\\copy eg_mdms_data (id, tenantid, uniqueidentifier, schemacode, data, isactive, createdby, lastmodifiedby, createdtime, lastmodifiedtime) FROM '{CSV_FILE}' WITH (FORMAT csv, DELIMITER '|', QUOTE '\"');"
    
    # First, let's delete any existing TenantBoundary records to avoid duplicates
    delete_sql = "DELETE FROM eg_mdms_data WHERE schemacode = 'egov-location.TenantBoundary';"
    
    env = os.environ.copy()
    env["PGPASSWORD"] = DB_PASS
    
    print("Deleting existing TenantBoundary records...")
    subprocess.run(["psql", "-h", DB_HOST, "-U", DB_USER, "-d", DB_NAME, "-c", delete_sql], env=env, check=True)
    
    print("Loading new records via COPY...")
    subprocess.run(["psql", "-h", DB_HOST, "-U", DB_USER, "-d", DB_NAME, "-c", copy_sql], env=env, check=True)
    print("Database ingestion complete!")

if __name__ == "__main__":
    main()
