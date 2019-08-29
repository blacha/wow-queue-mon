const cp = require('child_process');
const pino = require('pino')();
const fs = require('fs');

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const history = [];
const HISTORY_FILE = './history.json'

try {
    const old = JSON.parse(fs.readFileSync(HISTORY_FILE));
    for (const o of old) {
        history.push(o)
    }
    pino.info({
        history: history.length
    }, 'HistoryRead');
} catch (e) {
    console.log(e)
}

function getLargestNumbers(text) {
    const matches = text.match(/(\d+)/g)

    let largest = -1;
    for (const match of matches) {
        const num = parseInt(match, 10);
        if (num > largest) {
            largest = num;
        }
    }
    if (largest == -1) {
        return null;
    }
    return largest;
}

/**
 * Extract the position and eta from the string
 */
async function getTextData() {
    const resp = cp.spawnSync('./get-text.sh');
    const rawText = resp.stdout.toString().trim()

    const [positionLine, estimatedLine] = rawText.split('\n')

    if (positionLine == null || positionLine == '' ||
        estimatedLine == null || estimatedLine == '') {
        pino.error({
                rawText
            },
            'Failed to parse')
        throw 'Failed to parse image'
    }

    const position = getLargestNumbers(positionLine);
    const eta = getLargestNumbers(estimatedLine);

    pino.info({
        position,
        eta
    }, 'Image');

    history.push({
        time: new Date().toISOString(),
        position,
        eta
    })

    if (history.length > 1000) {
        history.shift();
    }

    await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function printStats() {
    const currentTime = Date.now()

    const TIME_LIST = [1, 5, 10, 30, 60].map(c => c * 60)
    const times = {}
    const CURRENT = history[history.length - 1]
    for (let i = history.length - 1; i >= 0; i--) {
        const obj = history[i];
        const timeStamp = new Date(obj.time);
        const timeAgo = Math.floor((currentTime - timeStamp) / 1000);
        if (obj.position < CURRENT.position) {
            continue;
        }

        for (const t of TIME_LIST) {
            if (times[t] != null) {
                continue;
            }
            if (timeAgo > t) {
                times[t] = {
                    diff: obj.position - CURRENT.position,
                    position: obj.position
                }
            }
        }
    }

    pino.info(
        times, 'Changes'
    )
}

const SLEEP_DELAY_MS = 2 * 1000;

async function main() {
    while (true) {
        const startTime = Date.now();
        printStats();

        try {
            await getTextData();
        } catch (e) {
            pino.error({
                e
            }, 'Failed')
        } finally {
            pino.trace({
                duration: Date.now() - startTime,
                sleep: SLEEP_DELAY_MS
            }, 'Sleep')
            await sleep(SLEEP_DELAY_MS);
        }

    }
}


main();
