import { BigNumber, Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { Comptroller } from '../../typechain/Comptroller'
import { VAIController } from '../../typechain/VAIController'
import { Fixture, deployMockContract, MockContract } from 'ethereum-waffle'

export const bigNumber18 = BigNumber.from("1000000000000000000")  // 1e18
export const bigNumber17 = BigNumber.from("100000000000000000")  //1e17
export const dateNow = BigNumber.from("1636429275") // 2021-11-09 11:41:15

export async function getBlockNumber() {
    const blockNumber = await ethers.provider.getBlockNumber()
    console.debug("Current block number: " + blockNumber);
    return blockNumber;
}

interface VAIControllerFixture {
    vaiController: VAIController
}

export const vaiControllerFixture: Fixture<VAIControllerFixture> = async function (): Promise<VAIControllerFixture> {
    const comptrollerFactory = await ethers.getContractFactory('Comptroller');
    const comptroller = (await comptrollerFactory.deploy()) as Comptroller

    // comptroller _setVenusVAIRate  set vai mint rate 

    const vaiControllerFactory = await ethers.getContractFactory('VAIController');
    const vaiController = (await vaiControllerFactory.deploy()) as VAIController

    // vaiController _initializeVenusVAIState set vai mint start block

    // comptroller _setVAIController

    // deploy PriceOracle

    // comptroller _setPriceOracle

    // deploy Vtoken

    // vtoken mint

    // comptroller addToMarketInternal

    await vaiController._setComptroller(comptroller.address);
    return { vaiController };
}