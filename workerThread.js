
// const distanceCalculation = require('./workerThreads/distanceCalculation');
const { parentPort, threadId } = require('worker_threads');

parentPort.on('message', logs => {
    parentPort.postMessage(calculate(logs));
});

function calculate(logs) {
    if (!logs.length) {
        return [];
    }
    
    let prev = logs[0];
    const results = [{
        ...prev,
        threadId,
        distance: 0
    }];
    for (let index = 1; index < logs.length; index++) {
        const log = logs[index];
        results.push({
            ...log,
            threadId,
            distance: getDistanceFromLatLonInKm(
                log.latitude,
                log.longitude,
                prev.latitude,
                prev.longitude
            )
        });
        prev = log;
    }

    return results;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad function below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}
  
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
