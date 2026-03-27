#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import json
import urllib.parse
import re

class WhoisHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        if 'domain' not in params:
            self.send_error(400, "Missing domain parameter")
            return
            
        domain = params['domain'][0]
        
        try:
            result = subprocess.run(
                ['whois', domain],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            creation_date = self.parse_creation_date(result.stdout)
            
            response = {
                'success': True,
                'domain': domain,
                'creation_date': creation_date
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except subprocess.TimeoutExpired:
            self.send_error(504, "Timeout")
        except Exception as e:
            self.send_error(500, str(e))
    
    def parse_creation_date(self, text):
        patterns = [
            r'Creation Date:?\s*(.+)',
            r'Created On:?\s*(.+)',
            r'created:?\s*(.+)',
            r'Registration Date:?\s*(.+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1).strip().split('T')[0].split(' ')[0]
                return date_str
        return None

def run():
    port = 8080
    server_address = ('0.0.0.0', port) #на все адреса
    httpd = HTTPServer(server_address, WhoisHandler)
    print(f'ScEagle WHOIS proxy running on port {port}')
    print(f'test:   http://sceagle.minbed.ru/?domain=google.com') #тест тут свой доммен указывать
    httpd.serve_forever()

if __name__ == '__main__':
    run()
