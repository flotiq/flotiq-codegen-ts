const fs = require('fs');
const os = require('os');
const path = require('path');
const loading = require('loading-cli');
const axios = require('axios');
const inquirer = require('inquirer');

const colorYellow = (str) => {
    return `\x1b[33m${str}\x1b[0m`;
}

const getWorkingPath = () => fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);

const loader = loading({
    text: colorYellow("Watching for changes ..."), color: "yellow"
});

async function makeRequest(apiKey, orderBy) {
    const FILTERS_URL = "https://api.flotiq.com/api/v1/internal/contenttype"

    try {
        const response = await axios.get(FILTERS_URL, {
            params: {
                order_by: orderBy, limit: 1, order_direction: 'desc'
            }, headers: {
                ['X-AUTH-TOKEN']: apiKey
            }
        });

        return response.data;
    } catch (error) {
        loader.stop();
        loader.clear();
        console.error('An error occurred in listening for changes. Details: ', error.response.data);
        process.exit(1);
    }
}

async function lambdaInvoke(url) {

    try {
        const response = await axios.get(url, {responseType: 'arraybuffer'})
        return Buffer.from(response.data, 'base64');
    } catch (error) {
        if (error.response) {
            const decoder = new TextDecoder('utf-8')
            const errorData = JSON.parse(decoder.decode(error.response.data))

            console.error('Error fetching data: ', errorData.message);
            process.exit(1);
        } else {
            console.error('Error fetching data: unknown error');
            process.exit(1);
        }
    }
}

async function confirm(msg) {
    const response = await inquirer.prompt([{
        name: 'confirmation', type: 'confirm', message: msg
    }]);
    return response.confirmation;
}

async function checkForChanges(apiKey) {
    const updatedAtResult = await makeRequest(apiKey, 'updatedAt');
    const createdAtResult = await makeRequest(apiKey, 'createdAt');

    return {
        updatedAt: updatedAtResult.data[0].updatedAt, createdAt: createdAtResult.data[0].createdAt,
    }
}

module.exports = {
    getWorkingPath,
    loader,
    lambdaInvoke,
    confirm,
    checkForChanges,
    colorYellow
}
