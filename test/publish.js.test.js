const { expect } = require('chai');
const Publish = require('../lib/publish');
describe('publish test', function () {

    it('should publish success', async function () {
        this.timeout(100 *1000);

        const config = require('../test.json');
        const pub = new Publish(config);
        await pub.publish();
    });
});
