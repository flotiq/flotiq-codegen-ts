const fce = require('fs-extra');
const {execSync} = require('child_process');
const buildToJs = (outputPath) => {

    // fce.mkdirp('flotiqApiBuildJs').then().catch(err => err && console.error(err));
    execSync('tsc -p ./flotiqApi', {stdio: 'ignore'});
    fce.moveSync('flotiqApi/dist/', 'flotiqApiBuildJs', {overwrite: true});

    fce.removeSync('flotiqApi');
    fce.moveSync("flotiqApiBuildJs", outputPath, {overwrite: true});
}

module.exports = buildToJs;
