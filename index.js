const cp = require('child_process');
const pino = require('pino')();

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const history = {};

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


}

const SLEEP_DELAY_MS = 2 * 1000;

async function main() {
    while (true) {
        const startTime = Date.now();
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
