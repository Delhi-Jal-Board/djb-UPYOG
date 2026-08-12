import os
import json
import urllib.request
import uuid
import time

MDMS_HOST = 'http://localhost:8072'
SCHEMA_CREATE_URL = f'{MDMS_HOST}/mdms-v2/schema/v1/_create'

TENANT_ID = 'dl'
DATA_DIR = '/home/hp/Desktop/djb-mdms-data/djb-mdms-data/data/dl/egov-location'
AUTH_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3VDNZYmxFNkxVZG5WQnpPX3BRdVBhcUhwMFIyZkp6andRU1d1UTQ5NGxvIn0.eyJleHAiOjE3ODUzNTY2NzYsImlhdCI6MTc4NTMyMDkzOSwiYXV0aF90aW1lIjoxNzg1MzIwNjc2LCJqdGkiOiJiYzZkMzgyMi1lZDYzLTRhZWQtOWJiNS1hNzQxZjVmMWU1MGQiLCJpc3MiOiJodHRwczovL2Rldi1kamJlcnAubml0Y29uLmluL2tleWNsb2FrL3JlYWxtcy9ETCIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmOmVjNDFhZjczLWE3MTktNGExOC05MjBmLTljNDdhMzc3NzcyZDo1NjQ4ZWJhZi1lZDg3LTQ5ZjUtYjAyNi02Mzc2MjBjY2FiNTYiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJsb2NhbC11cHlvZyIsInNpZCI6IjIwYThiYmY5LTRjMDAtNDE3Ny04MDNhLTRiMWQxNjFjZjNjYiIsImFjciI6IjAiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm1vYmlsZU51bWJlciI6IjI2NjgyM3xpUkh0R3FmOHZTQTZMemxsWGNvbW1VQjE3cHVmdkovY3FTQT0iLCJ0ZW5hbnRJZCI6ImRsLmRqYiIsIm5hbWUiOiIyNjY4MjN8KzBlalNQQ3IrWGJzMXcyc3NPMVRBYTdYL2hwWG4zOG8gMiIsInByZWZlcnJlZF91c2VybmFtZSI6ImRldmExMjMiLCJnaXZlbl9uYW1lIjoiRGV2ZW5kcmEiLCJsb2NhbGUiOiJlbl9JTiIsInR5cGUiOiJFTVBMT1lFRSIsImZhbWlseV9uYW1lIjoiUGF0ZWwiLCJ1c2VySWQiOiIxMDMiLCJlbWFpbCI6ImRldmVuZHJhLnBhdGVsQHNwYXJyb3dzb2Z0ZWNoLm5ldCJ9.N4EXzM2ddAVbHhJDTbUiYqz8iWyvLiJUUwFoAQxLOqUcme3rMm4-QeCmAz6hzHBBTuyJcQakRrzmsFaEWf3QT-uhyKQ7kWIGZo0acEE2BO2FD4PG7Zmr6KRt4npXaLs3tHzeFBrXFjghTrNb3t1KyILt92ehz-MOkXwecUt9rDwFJCXZKAaH2yl0FpERK9OhuZ3Di9xdA0xUwc4hF_u3REIJCRW785E2tVYZBmPYHG5wAC28EHJ1gkI7ar5RnhGfvIQPxxT4iN7j-lztzjtymmxFN5-RzXkKmoiJ_ZnjDVjUxD7G_Mdux2jyGN_0qqVr7-1evBbuuIKu43VgYHsUxg'

def post(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {AUTH_TOKEN}'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} for URL {url}: {e.read().decode('utf-8')}")
        return None

def ingest_master(module_name, master_name, data):
    for item in data:
        # Generate unique identifier correctly
        uid = str(uuid.uuid4())
        if "hierarchyType" in item and isinstance(item["hierarchyType"], dict) and "code" in item["hierarchyType"]:
            uid = item["hierarchyType"]["code"]
            
        item["id"] = uid
            
        payload = {
            "RequestInfo": {
                "apiId": "Rainmaker",
                "authToken": AUTH_TOKEN,
                "msgId": "1689060000000|en_IN",
                "plainAccessRequest": {},
                "userInfo": {
                    "id": 103,
                    "uuid": "5648ebaf-ed87-49f5-b026-637620ccab56",
                    "userName": "deva123",
                    "name": "Devendra",
                    "type": "EMPLOYEE",
                    "tenantId": "dl.djb",
                    "active": True
                }
            },
            "Mdms": {
                "tenantId": TENANT_ID,
                "schemaCode": f"{module_name}.{master_name}",
                "uniqueIdentifier": uid,
                "data": item,
                "isActive": item.get("active", item.get("isActive", True))
            }
        }
        create_url = f'{MDMS_HOST}/mdms-v2/v2/_create/{module_name}.{master_name}'
        post(create_url, payload)

def main():
    module_name = "egov-location"
    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".json") and "boundary-data" in filename:
            filepath = os.path.join(DATA_DIR, filename)
            with open(filepath, 'r') as f:
                try:
                    data = json.load(f)
                    
                    if "TenantBoundary" in data:
                        tenant_boundaries = data["TenantBoundary"]
                    else:
                        continue
                        
                    print(f"Ingesting TenantBoundary from {filename} ({len(tenant_boundaries)} items)...")
                    ingest_master(module_name, "TenantBoundary", tenant_boundaries)
                except Exception as e:
                    print(f"Error reading {filename}: {e}")

if __name__ == "__main__":
    main()

