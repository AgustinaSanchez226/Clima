const apiKey = 'b5fda9524b3901b12562f2f49d310123';
const unsplashKey = 'lODtQC5e2fSXqQS9l29pcWZC0HS8IepEw3YHRAjZFfU';
const form = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const currentLocationDiv = document.getElementById('currentLocation');
let ubicacionActual = null;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (!city) return;
    weatherResult.innerHTML = 'Buscando...';
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=es`);
        if (!res.ok) throw new Error('Ciudad no encontrada');
        const data = await res.json();
        let distanciaTexto = '';
        if (ubicacionActual) {
            const distancia = calcularDistancia(ubicacionActual.lat, ubicacionActual.lon, data.coord.lat, data.coord.lon);
            distanciaTexto = `<div style='color:#fff; font-weight:bold; margin-bottom:8px; display:flex; align-items:center; justify-content:center; font-size:1.1rem;'>📍 ${distancia.toFixed(2)} km de distancia</div>`;
        }
        mostrarClima(data, distanciaTexto);
        await cambiarFondoReal(city, data.weather[0].main);
    } catch (err) {
        weatherResult.innerHTML = `<span style='color:red;'>${err.message}</span>`;
    }
});

function mostrarClima(data, distanciaTexto = '') {
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const city = data.name;
    const country = data.sys.country;
    let mensaje = '';
    if (temp >= 30) mensaje = '¡Hace mucho calor! Recuerda hidratarte.';
    else if (temp <= 10) mensaje = '¡Hace frío! Abrígate bien.';
    else mensaje = '¡Buen día para salir!';
    weatherResult.innerHTML = `
        <img src="${iconUrl}" alt="icono clima" class="weather-icon">
        <h2>${city}, ${country}</h2>
        ${distanciaTexto}
        <p style="font-size:2rem; margin:8px 0;">${temp}°C</p>
        <p style="text-transform:capitalize;">${desc}</p>
        <p><strong>${mensaje}</strong></p>
    `;
}

async function cambiarFondoReal(city, main) {
    let query = city; // Solo buscar por ciudad
    try {
        const res = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${unsplashKey}`);
        if (!res.ok) throw new Error('No se pudo obtener imagen');
        const data = await res.json();
        const url = data.urls && data.urls.full ? data.urls.full : data.urls.regular;
        document.body.style.backgroundImage = `url('${url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.transition = 'background-image 0.7s';
    } catch (e) {
        // Si falla, no cambia el fondo
    }
}

function traducirClima(main) {
    switch(main) {
        case 'Clear': return 'soleado';
        case 'Clouds': return 'nublado';
        case 'Rain': return 'lluvia';
        case 'Drizzle': return 'llovizna';
        case 'Thunderstorm': return 'tormenta';
        case 'Snow': return 'nieve';
        case 'Mist': return 'niebla';
        case 'Fog': return 'niebla';
        case 'Haze': return 'neblina';
        default: return 'clima';
    }
}

// Intentar obtener la ciudad actual al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            ubicacionActual = { lat, lon };
            try {
                // Usar OpenWeatherMap para obtener la ciudad por lat/lon
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                const ciudad = data.name;
                currentLocationDiv.textContent = `Tu ciudad actual: ${ciudad}`;
                cityInput.placeholder = `Ej: ${ciudad}`;
                // Mostrar automáticamente el clima de la ciudad detectada
                mostrarClima(data);
                await cambiarFondoReal(ciudad, data.weather[0].main);
                // No mostrar distancia aquí
            } catch {
                currentLocationDiv.textContent = '';
            }
        }, () => {
            currentLocationDiv.textContent = '';
        });
    }
});

function mostrarDistancia(destLat, destLon, destName) {
    if (!ubicacionActual) return;
    const distancia = calcularDistancia(ubicacionActual.lat, ubicacionActual.lon, destLat, destLon);
    const distanciaDiv = document.createElement('div');
    distanciaDiv.style.marginTop = '12px';
    distanciaDiv.style.color = '#ffd700';
    distanciaDiv.style.fontWeight = 'bold';
    distanciaDiv.textContent = `Distancia desde tu ubicación hasta ${destName}: ${distancia.toFixed(2)} km`;
    weatherResult.appendChild(distanciaDiv);
}

// Fórmula de Haversine para calcular distancia entre dos puntos geográficos
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
} 