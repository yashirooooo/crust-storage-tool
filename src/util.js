const request = require('request');
const { ownerListAddr, memberOrdersAddr } = require('./consts');
const { Keyring } = require('@polkadot/keyring');

function withHelper(arg, err, handler) {
    if (!arg) {
        err();
    } else {
        handler();
    }
}

/**
 * Send tx to Crust Network
 * @param tx substrate-style tx
 * @returns tx already been sent
 */
async function sendTx(tx, seeds) {
    const krp = loadKeyringPair(seeds);

    return new Promise((resolve, reject) => {
        tx.signAndSend(krp, ({events = [], status}) => {
            console.log(
                `  ↪ 💸 Transaction status: ${status.type}, nonce: ${tx.nonce}`
            );

            if (
                status.isInvalid ||
                status.isDropped ||
                status.isUsurped ||
                status.isRetracted
            ) {
                reject(new Error('Invalid transaction'));
            } else {
                // Pass it
            }

            if (status.isInBlock) {
                events.forEach(({event: {method, section}}) => {
                if (section === 'system' && method === 'ExtrinsicFailed') {
                    // Error with no detail, just return error
                    console.debug(`  ↪ 💸 ❌ Send transaction(${tx.type}) failed.`);
                    resolve(false);
                } else if (method === 'ExtrinsicSuccess') {
                    console.debug(`  ↪ 💸 ✅ Send transaction(${tx.type}) success.`);
                    resolve(true);
                }
                });
            } else {
                // Pass it
            }
        }).catch(e => {
            reject(e);
        });
    }).catch(console.error);
}

/**
 * Load keyring pair with seeds
 */
function loadKeyringPair(seeds) {
    const kr = new Keyring({
        type: 'sr25519',
    });

    const krp = kr.addFromUri(seeds);
    return krp;
}

let options = {
  'method': 'GET',
  'headers': {
    'Authorization': 'Basic Y3J1c3Q6MTYyNTM0'
  }
};

async function httpGetOwnerMembers(owner) {
    options.url = ownerListAddr + owner;
    return new Promise((resolve, _)=> {
        request(options.url, options, function (error, response) {
            if (error) throw new Error(error);
            resolve(response.body);
        })
    }).catch(e => {throw new Error(e)});
}

function httpGetMembersOrders(member) {
    options.url = memberOrdersAddr + member;
    return new Promise((resolve, _)=> {
        request(options.url, options, function (error, response) {
            if (error) throw new Error(error);
            resolve(response.body);
        })
    });
}

module.exports = {
    withHelper,
    sendTx,
    httpGetOwnerMembers,
    httpGetMembersOrders
}