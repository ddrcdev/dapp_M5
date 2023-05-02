const base_url = 'https://api.football-data.org/v4/competitions/PD/matches';
const headers = {'X-Auth-Token': 'b18ea5efb24e46ca8ee12886104bafab'};

const today = new Date();
const two_weeks = new Date(today.getTime() + (15 * 24 * 60 * 60 * 1000)); // Agrega 15 días a la fecha actual

const params = new URLSearchParams({
  status: 'SCHEDULED',
  dateFrom: today.toISOString().split('T')[0],
  dateTo: two_weeks.toISOString().split('T')[0]
});

const url = `${base_url}?${params.toString()}`;

fetch(url, { headers })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`Error al hacer la solicitud: ${response.status}`);
    }
  })
  .then(data => {
    const match_list = data.matches.map(match => {
      return [`${match.homeTeam.name}-${match.awayTeam.name}`, match.utcDate.replace("T"," (").replace("Z",")")];
    });
    
    console.log(match_list);
  })
  .catch(error => console.error(error));
