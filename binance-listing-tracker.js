const axios = require('axios');

/*
  ===== СКРИПТ: Отслеживание новых листингов на Binance =====
  
  Что делает:
  1. Запрашивает списки всех торговых пар на Spot и Futures.
  2. При первом запуске сохраняет их в Set (база).
  3. Каждые 5 секунд делает новый запрос и сравнивает с базой.
  4. Если появляются новые монеты (baseAsset), выводит их в консоль.
  
  Запуск: node binance-listing-tracker.js
*/

const binanceSpotApi = 'https://api.binance.com/api/v3/exchangeInfo';
const binanceFuturesApi = 'https://fapi.binance.com/fapi/v3/exchangeInfo';

let knownsSpotTokens = new Set();
let knownsFuturesTokens = new Set();

async function checkNewSpotListing() {
  // Запрашиваем данные по споту
  const response = await axios(binanceSpotApi)
    .catch(error => {
      console.log('Ошибка: ', error);
      return null;
    });

  // Достаем массив базовых активов (токенов)
  const tokensList = response.data.symbols.map(s => s.baseAsset);

  // Если база пустая (первый запуск) — заполняем её и выходим
  if (knownsSpotTokens.size === 0) {
    knownsSpotTokens = new Set(tokensList);
    console.log('База спотовых активов загружена. Следим за новинками...');
    return null;
  }

  // Ищем токены, которых нет в нашей базе
  // new Set убирает дубликаты при листинге разных пар одного токена
  // Например BTC/USDT, BTC/USD1, BTC/USDC
  const newListings = [...new Set(tokensList.filter(s => !knownsSpotTokens.has(s)))];
  
  // Если есть новые — выводим и добавляем в базу
  if (newListings.length > 0) {
    console.log('Новый спотовый листинг: ', newListings);
    newListings.forEach(s => knownsSpotTokens.add(s));   
  }
}

async function checkNewFuturesListing() {
  // Запрашиваем данные по фьючерсам
  const response = await axios(binanceFuturesApi)
    .catch(error => {
      console.log('Ошибка:', error);
      return null;
    });

  // Достаем массив базовых активов (токенов)
  const tokensList = response.data.symbols.map(s => s.baseAsset);

  // Если база пустая (первый запуск) — заполняем её и выходим
  if (knownsFuturesTokens.size === 0) {
    knownsFuturesTokens = new Set(tokensList);
    console.log('База фьючерсных контрактов загружена. Следим за новинками...');
    return null;
  }

  // Ищем новые контракты
  // new Set убирает дубликаты при листинге разных контрактов одного токена
  // Например BTCUSDT, BTCUSD1, BTCUSDC
  const newListings = [...new Set(tokensList.filter(s => !knownsFuturesTokens.has(s)))];

  // Если есть новые — выводим и добавляем в базу
  if (newListings.length > 0) {
    console.log('Добавлен новый фьючерсный контракт: ', newListings);
    newListings.forEach(s => knownsFuturesTokens.add(s));
  }
}

console.log('Парсер Binance запущен. Ожидание данных...');
setInterval(checkNewSpotListing, 5000);
setInterval(checkNewFuturesListing, 5000);
