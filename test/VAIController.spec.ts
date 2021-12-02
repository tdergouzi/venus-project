import { Wallet, BigNumber } from 'ethers'
import { ethers, network, waffle } from 'hardhat'
import { VAIController } from '../typechain/VAIController'
import { expect } from './shared/expect'
import { vaiControllerFixture, bigNumber18, dateNow } from './shared/fixtures'

const createFixtureLoader = waffle.createFixtureLoader

describe('VAIController', async () => {
    let wallet: Wallet,
        user1: Wallet,
        user2: Wallet,
        user3: Wallet,
        user4: Wallet,
        user5: Wallet;

    let vaiController: VAIController;

    let loadFixTure: ReturnType<typeof createFixtureLoader>;

    before('create fixture loader', async () => {
        [wallet, user1, user2, user3, user4, user5] = await (ethers as any).getSigners()
        loadFixTure = createFixtureLoader()
    })

    beforeEach('deploy VAIController', async () => {
        ; ({ vaiController } = await loadFixTure(vaiControllerFixture));
    })
})