#!/usr/bin/env node

const {colorYellow, loader} = require('./src/helpers')

require('yargs')
    .commandDir('commands')  // Automatyczne ładowanie komend z katalogu 'commands'
    .usage("Use flotiq-codegen-ts generates typescript Fetch API integration for your Flotiq project.")
    .help()
    .alias("help", "h")
    .argv;

/**
 *  SIGINT (ctrl + c) handler
 *  we have to stop the handler, otherwise it causes disappear of console cursor
 */
process.on('SIGINT', function () {
    loader.stop();
    loader.clear();
    console.log(colorYellow("Application terminated !"));
    process.exit(0);
});
