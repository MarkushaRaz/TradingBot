const TelegramBot = require('node-telegram-bot-api');
const ccxt = require('ccxt');

require('dotenv').config();

const Id = process.env.id;
const Token = process.env.token;

const bot = new TelegramBot(Token, { polling: true });

const Currency = 'BTC/USDT';
const Drop = 0.2;
const Gain = 0.5;
const Amount = 0.0001;

let LastPrice = null;

async function Main() {
    const Binance = new ccxt.binance({
        apiKey: process.env.key,
        secret: process.env.secret_key,
        options: { defaultType: 'spot' }
    });

    /////////////////////////////
    Binance.setSandboxMode(true);
    /////////////////////////////

    console.log('> Successful start');

    const FirstTicker = await Binance.fetchTicker(Currency);

    let Price = FirstTicker.last;
    let BuyPrice = Price * (1 - Drop / 100);

    while (true) {
        const Ticker = await Binance.fetchTicker(Currency);

        Price = Ticker.last;

        if (!LastPrice) {
            if (Price <= BuyPrice) {
                const Order = await Binance.createMarketBuyOrder(Currency, Amount);

                LastPrice = Price;

                console.log(`Куплено!\nЦена: ${Price}`);
                bot.sendMessage(Id, `Куплено!\nЦена: ${Price}`);
            }
        }
        else {
            const TargetPrice = LastPrice * (1 + Gain / 100);

            if (Price >= TargetPrice) {
                let TimeData;
                const Order = await Binance.createMarketSellOrder(Currency, Amount)

                console.log(`💰 Продано! 💰\nЦена покупки:${LastPrice}\nЦена продажи: ${Price}\n\nПрибыль: ${Price - LastPrice}`);
                bot.sendMessage(Id, `💰 Продано! 💰\nЦена покупки:${LastPrice}\nЦена продажи: ${Price}\n\nПрибыль: ${Price - LastPrice}`)
                    .then((sentMessage) => TimeData = sentMessage.message_id);

                bot.pinChatMessage(Id, TimeData, {
                    disable_notification: true
                });

                LastPrice = null;
            }
        }

        await new Promise(t => setTimeout(t, 10_000));
    }
}

Main();