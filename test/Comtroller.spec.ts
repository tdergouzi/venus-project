import { Wallet, BigNumber } from 'ethers'
import { ethers, network, waffle } from 'hardhat'
import { ComptrollerHarness } from '../typechain/ComptrollerHarness'
import { SimplePriceOracle } from '../typechain/SimplePriceOracle'
import { XVS } from '../typechain/XVS'
import { VAIScenario } from '../typechain/VAIScenario'
import { VAIControllerHarness } from '../typechain/VAIControllerHarness'
import { BEP20Harness } from '../typechain/BEP20Harness'
import { VBep20Harness } from '../typechain/VBep20Harness'
import { expect } from './shared/expect'
import { comptrollerFixture, bigNumber18 } from './shared/fixtures'

const createFixtureLoader = waffle.createFixtureLoader

describe('Comptroller', async () => {
    let wallet: Wallet,
        user1: Wallet,
        user2: Wallet,
        treasuryGuardian: Wallet,
        treasuryAddress: Wallet;

    let comptroller: ComptrollerHarness
    let priceOracle: SimplePriceOracle
    let xvs: XVS
    let vai: VAIScenario
    let vaiController: VAIControllerHarness
    let usdt : BEP20Harness
    let vusdt: VBep20Harness

    let loadFixTure: ReturnType<typeof createFixtureLoader>;

    before('create fixture loader', async () => {
        [wallet, user1, user2, treasuryGuardian, treasuryAddress] = await (ethers as any).getSigners()
        loadFixTure = createFixtureLoader([wallet, treasuryGuardian, treasuryAddress])
    })

    beforeEach('deploy Comptroller', async () => {
        ; ({ usdt, comptroller, priceOracle, xvs, vai, vaiController, vusdt } = await loadFixTure(comptrollerFixture));
        await vusdt.harnessSetBalance(user1.address, bigNumber18.mul(100))
        await comptroller.connect(user1).enterMarkets([vusdt.address])
    })

    it('check wallet usdt balance', async () => {
        expect(await usdt.balanceOf(wallet.address)).to.eq(bigNumber18.mul(100000000))
        expect(await vusdt.balanceOf(user1.address)).to.eq(bigNumber18.mul(100))
    })

    describe('#getMintableVAI', async () => {
        it('oracle', async () => {
            expect( await comptroller.oracle()).to.eq(priceOracle.address)
        })

        it('getAssetsIn', async () => {
            let enteredMarkets = await comptroller.getAssetsIn(user1.address)
            expect(enteredMarkets.length).to.eq(1)
        })

        it('getAccountSnapshot', async () => {
            let res = await vusdt.getAccountSnapshot(user1.address)
            expect(res[0]).to.eq(0)
            expect(res[1]).to.eq(bigNumber18.mul(100))
            expect(res[2]).to.eq(BigNumber.from(0))
            expect(res[3]).to.eq(bigNumber18)
        })

        it('getUnderlyingPrice', async () => {
            expect(await priceOracle.getUnderlyingPrice(vusdt.address)).to.eq(bigNumber18)
        })

        it('getComtroller', async () => {
            expect(await vaiController.admin()).to.eq(wallet.address)
            expect(await vaiController.comptroller()).to.eq(comptroller.address)
        })

        it('success', async () => {
            let res = await vaiController.getMintableVAI(user1.address)
            expect(res[1]).to.eq(bigNumber18.mul(100))
        })
    })

    describe('#mintVAI', async () => {
        it('success', async () => {
            await vaiController.connect(user1).mintVAI(bigNumber18.mul(100))
            expect(await vai.balanceOf(user1.address)).to.eq(bigNumber18.mul(100))
            expect(await comptroller.mintedVAIs(user1.address)).to.eq(bigNumber18.mul(100))
        })
    })

    describe('#repayVAI', async () => {
        beforeEach('mintVAI', async () => {
            await vaiController.connect(user1).mintVAI(bigNumber18.mul(100))
            expect(await vai.balanceOf(user1.address)).to.eq(bigNumber18.mul(100))
            await vai.connect(user1).approve(vaiController.address, ethers.constants.MaxUint256)
        })

        it('success', async () => {
            await vaiController.connect(user1).repayVAI(bigNumber18.mul(100))
            expect(await vai.balanceOf(user1.address)).to.eq(BigNumber.from(0))
            expect(await comptroller.mintedVAIs(user1.address)).to.eq(BigNumber.from(0))
        })
    })

    describe('#liquidateVAI', async () => {
        beforeEach('user1 borrow', async () => {
            await vaiController.connect(user1).mintVAI(bigNumber18.mul(100))
            await vai.allocateTo(user2.address, bigNumber18.mul(100))
            expect(await comptroller.mintedVAIs(user1.address)).to.eq(bigNumber18.mul(100))
            expect(await vai.balanceOf(user1.address)).to.eq(bigNumber18.mul(100))
            expect(await vai.balanceOf(user2.address)).to.eq(bigNumber18.mul(100))
        })

        it('vtoken exchangeRateStored', async () => {
            let res = await vusdt.exchangeRateStored()
            expect(res).to.eq(bigNumber18)
        })

        it('liquidateBorrowAllowed', async () => {
            await comptroller.liquidateBorrowAllowed(vaiController.address, vusdt.address, user2.address, user1.address, bigNumber18.mul(60))
        })

        it('liquidationIncentiveMantissa', async () => {
            expect(await comptroller.liquidationIncentiveMantissa()).to.eq(bigNumber18)
        })

        it('success', async () => {
            await vai.connect(user2).approve(vaiController.address, ethers.constants.MaxUint256)
            await vaiController.harnessSetBlockNumber(BigNumber.from(100000))
            await vaiController.connect(user2).liquidateVAI(user1.address, bigNumber18.mul(60), vusdt.address)
            expect(await vai.balanceOf(user2.address)).to.eq(bigNumber18.mul(40))
            expect(await vusdt.balanceOf(user2.address)).to.eq(bigNumber18.mul(60))
        })
    })
})