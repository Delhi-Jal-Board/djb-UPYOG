import json
import uuid
import time
import re

DATA_FILE = "/home/hp/Desktop/djb-mdms-data/djb-mdms-data/data/dl/egov-location/boundary-data.json"
SQL_FILE = "/home/hp/IdeaProjects/djb-UPYOG/dev_tenant_boundary_migration.sql"

def get_current_time_ms():
    return int(time.time() * 1000)

def main():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
        
    tenant_boundaries = data.get("TenantBoundary", [])
    
    with open(SQL_FILE, 'w', encoding='utf-8') as sql:
        sql.write("BEGIN;\n\n")
        sql.write("DELETE FROM eg_mdms_data WHERE schemacode = 'egov-location.TenantBoundary' AND tenantid = 'dl';\n\n")
        
        for item in tenant_boundaries:
            record_id = str(uuid.uuid4())
            tenantid = "dl"
            uniqueidentifier = item.get("hierarchyType", {}).get("code", str(uuid.uuid4()))
            schemacode = "egov-location.TenantBoundary"
            
            # Dump JSON with indentation for readability, and escape single quotes for SQL insertion
            data_json = json.dumps(item, indent=4)
            data_json_escaped = data_json.replace("'", "''")
            
            isactive = 'true'
            createdby = "5648ebaf-ed87-49f5-b026-637620ccab56"
            lastmodifiedby = createdby
            createdtime = str(get_current_time_ms())
            lastmodifiedtime = createdtime
            
            sql.write(f"INSERT INTO eg_mdms_data (id, tenantid, uniqueidentifier, schemacode, data, isactive, createdby, lastmodifiedby, createdtime, lastmodifiedtime)\n")
            sql.write(f"VALUES ('{record_id}', '{tenantid}', '{uniqueidentifier}', '{schemacode}', '{data_json_escaped}'::jsonb, {isactive}, '{createdby}', '{lastmodifiedby}', {createdtime}, {lastmodifiedtime});\n\n")
            
        sql.write("COMMIT;\n")
    print(f"Generated {SQL_FILE}")

if __name__ == "__main__":
    main()
