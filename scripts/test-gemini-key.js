const fetch = require('node-fetch');

const API_KEY = 'AIzaSyAxHdfb3gVr4v8srHkwU6IMiEJg8g4WbBQ';
const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
const versions = ['v1', 'v1beta'];

async function test() {
    for (const model of models) {
        for (const ver of versions) {
            const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${API_KEY}`;
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Hi' }] }]
                    })
                });
                const data = await res.json();
                console.log(`${ver}/${model}: ${res.status} ${res.statusText}`);
                if (res.status !== 200) {
                    console.log('Error:', JSON.stringify(data));
                }
            } catch (e) {
                console.log(`${ver}/${model}: Failed - ${e.message}`);
            }
        }
    }
}

test();
