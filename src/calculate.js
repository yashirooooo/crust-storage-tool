const { ApiPromise, WsProvider } = require('@polkadot/api');
const { typesBundleForPolkadot } = require('@crustio/type-definitions');
const { httpGetOwnerMembers, httpGetMembersOrders, sendTx } = require('./util');
const { chainAddr } = require('./consts');
const _ = require('lodash');

module.exports = {
    default: async (owner, seeds) => {
        const ownerMembers = JSON.parse(await httpGetOwnerMembers(owner));
        const fileOrders = [];
        if (ownerMembers.data.data.length == 1) {
            const members = _.map(ownerMembers.data.data[0].member, 'nodeId');
            for (const member of members) {
                const memberOrder = JSON.parse(await httpGetMembersOrders(member));
                const orderCids = _.map(memberOrder.data.files, 'cid');
                fileOrders.push(...orderCids);
            }
        }

        const uniqOrders = _.unionWith(fileOrders, _.isEqual);

        // TODO: Filter settled orders
        console.log(`The order will be settled:`, uniqOrders)
        
        // 1. Judge legality of the seeds
        const seedsVec = seeds.split(' ');
        if (seedsVec.length !== 12) {
            console.error('Seeds illegal, check it again');
            return;
        }   
        
        // 2. Get chain api connection
        let chain = new ApiPromise({
            provider: new WsProvider(chainAddr),
            typesBundle: typesBundleForPolkadot
        });

        await chain.isReadyOrError;

        const txs = _.map(uniqOrders, e => chain.tx.market.claimReward(e));

        // TODO: Merchants whose reward pool is full stop clearing orders
        const batchTx = chain.tx.utility.batch(txs);

        const res = await sendTx(batchTx, seeds);
        if (res) {
            console.log(`Calculate owner ${owner} orders success`)
        } else {
            console.error('Calculate failed with \'Send transaction failed\'')
        }

        // 6. Disconnect with chain
        chain.disconnect();

    }
}