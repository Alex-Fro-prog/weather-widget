import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WeatherWidget.css';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState(''); // Изначально выбранный город
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null); // Хранит координаты пользователя
  const [requestType, setRequestType] = useState('вручную'); // Тип запроса
  const [forecast, setForecast] = useState([]);
  const [geoError, setGeoError] = useState(null); // Для обработки ошибок геолокации

  const API_KEY = 'e11b318488b533f2ebfc2be8401f98fd';
  const UNITS = 'metric';

  // Функция для получения погоды по названию города или координатам
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=${UNITS}&appid=${API_KEY}&lang=ru`;

        if (coords) {
          // Если координаты есть, используем их для запроса
          url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&units=${UNITS}&appid=${API_KEY}&lang=ru`;
        }

        const response = await axios.get(url);
        setWeather(response.data);
        setCity(response.data.name); // Сохраняем название города для использования в прогнозе
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [API_KEY, query, coords, UNITS]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `https://api.openweathermap.org/data/2.5/forecast?q=${query}&units=${UNITS}&appid=${API_KEY}&lang=ru`;

      if (coords) {
        // Если координаты есть, используем их для запроса прогноза
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.latitude}&lon=${coords.longitude}&units=${UNITS}&appid=${API_KEY}&lang=ru`;
      }

      const response = await axios.get(url);

      // Группируем данные по дате
      const dailyForecast = response.data.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString('ru-RU');

        if (!acc[date]) {
          acc[date] = item;
        }

        return acc;
      }, {});

      setForecast(Object.values(dailyForecast)); // Сохраняем только ежедневный прогноз
      setWeather(null); // Сбрасываем текущую погоду, если выполняется запрос на прогноз
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Обработка формы для поиска по городу
  const handleSubmit = (e) => {
    e.preventDefault();
    setCoords(null); // Сбрасываем координаты, чтобы искать по названию города
    setQuery(city); // Обновляем город для поиска
    setForecast([]); // Сбрасываем прогноз на 5 дней при поиске текущей погоды
    setRequestType('вручную'); // Обновляем тип запроса
    setGeoError(null); // Сбрасываем ошибки геолокации при ручном вводе
  };

  // Получение текущей геолокации пользователя
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setForecast([]); // Сбрасываем прогноз на 5 дней при использовании геолокации
          setRequestType('по геопозиции'); // Обновляем тип запроса
          setGeoError(null); // Сбрасываем ошибки геолокации при успешном получении
        },
        (error) => {
          // Обработка ошибки при отказе в доступе к геолокации
          setGeoError('Невозможно получить доступ к геолокации. Введите город вручную.');
        }
      );
    } else {
      setGeoError('Геолокация не поддерживается вашим браузером.');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="weather-widget">
      <h2>Погода</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Введите город"
        />
        <button type="submit">Показать текущую погоду</button>
      </form>
      <button className="geo-button" onClick={getLocation}>
        Получить текущую геолокацию
      </button>
      <button className="forecast-button" onClick={fetchForecast}>
        Показать прогноз на 5 дней
      </button>

      {geoError && <div className="geo-error">{geoError}</div>}
      {loading && <div>Загрузка...</div>}
      {error && <div>Ошибка: {error.response ? error.response.data.message : error.message}</div>}
      {weather && !loading && !error && (
        <div className="weather-info">
          <h3>{weather.name}</h3>
          <p>Ответ получен {requestType}</p>
          <img
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
          />
          <div>
            <p>{Math.round(weather.main.temp)}°C</p>
            <p>{weather.weather[0].description}</p>
          </div>
          <div>
            <p>Влажность: {weather.main.humidity}%</p>
            <p>Давление: {weather.main.pressure} мм рт. ст.</p>
            <p>Ветер: {weather.wind.speed} м/с</p>
            <p>Восход: {formatTime(weather.sys.sunrise)}</p>
            <p>Закат: {formatTime(weather.sys.sunset)}</p>
          </div>
        </div>
      )}

      {forecast.length > 0 && !loading && !error && (
        <div className="forecast-info">
          <h3>Прогноз на 5 дней для {city}</h3>
          <p>Ответ получен {requestType}</p>
          <div className="forecast-list">
            {forecast.map((item) => (
              <div key={item.dt} className="forecast-item">
                <p>{new Date(item.dt * 1000).toLocaleDateString('ru-RU')}</p>
                <img
                  src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                  alt={item.weather[0].description}
                />
                <p>{Math.round(item.main.temp)}°C</p>
                <p>{item.weather[0].description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;