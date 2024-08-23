const fs = require('fs');
const path = require('path');
const glob = require('glob');

const filePatterns = ['src/models/*WithoutInternal.ts', 'src/models/*WithoutRequired.ts', 'src/models/*WithoutInternalAllOf*.ts'];
const deleteLine = "import { DataSource, DataSourceFromJSON } from './DataSource';";

const cleanDuplicateImport = (cwd) => {
    filePatterns.forEach((pattern) => {
        const files = glob.sync(pattern, {cwd: cwd});
        files.forEach(file => {
            const filePath = path.join(cwd, file);
            const data = fs.readFileSync(filePath, 'utf8');
            if (data.includes(deleteLine)) {
                const newData = data.replace(deleteLine, '');
                fs.writeFileSync(filePath, newData, 'utf8');
            }
        });
    })
}
module.exports = cleanDuplicateImport;
