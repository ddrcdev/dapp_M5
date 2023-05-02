import requests
from datetime import date, timedelta


def callAPI():
    base_url = 'https://api.football-data.org/v4/competitions/PD/matches'
    headers = {'X-Auth-Token': 'b18ea5efb24e46ca8ee12886104bafab'}


    today = date.today()
    two_week = str(today + timedelta(days=15))

    params = {'status': 'SCHEDULED',
            'dateFrom': str(today),
            'dateTo': two_week}


    response = requests.get(base_url, headers=headers, params=params)

    if response.status_code == 200: # Si la solicitud es exitosa (código de estado 200)

        data = response.json() # Convierte la respuesta de la API en formato JSON a un diccionario de Python  

        match_list = [[key['homeTeam']['name']+'-'+key['awayTeam']['name'],key['utcDate'].replace("T"," (").replace("Z",")")]for key in data['matches']]
        
        print(match_list)
    else:
        print(f"Error al hacer la solicitud: {response.status_code}")




