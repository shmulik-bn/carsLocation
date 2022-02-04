const fs = require('fs');
const Pool = require('./pool');
const config = require('./config.json')
const csv = require('csv-parse');
const pool = new Pool('./workerThread.js', config.NUMBER_OF_THREADS);
const { stringify } = require('csv-stringify');

async function readFile() {
    const parser = fs.createReadStream('./coordinates_for_node_test.csv')
        .pipe(csv.parse({ columns: true }));

    const logsPerCar = new Map();

    for await (const log of parser) {
        if (!logsPerCar.has(log.vehicle_id)) {
            logsPerCar.set(log.vehicle_id, [log]);
        } else {
            logsPerCar.get(log.vehicle_id).push(log);
        }
    }
    return logsPerCar.values();
}

(async () => {
    const promises = [];
    for (const vehicleLogs of await readFile()) {
        promises.push(pool.runTask(vehicleLogs));
    }

    const flat = (await Promise.all(promises)).flat();
    stringify(flat, {
        header: true,
        columns: Object.keys(flat[0]) 
    }).pipe(
        fs.createWriteStream(__dirname + '/coordinates_after_changes.csv')
    );

    pool.destroy();
})();