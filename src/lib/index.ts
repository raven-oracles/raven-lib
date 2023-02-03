import { mnemonicNew, KeyPair, mnemonicToPrivateKey } from "ton-crypto";
import BN from 'bn.js'
import {
  Address,
  TonClient,
  StateInit,
  Cell,
  toNano,
  beginCell,
  CellMessage,
  WalletV3R2Source,
  WalletContract,
  InternalMessage,
  CommonMessageInfo,
} from 'ton';
import fs from 'fs'
import CoinGecko from "coingecko-api";
import * as helpers from './helpers'
import { uploadWallet, getMasterAddress } from './requests'

export type OracleParameters = {
  oracleKey?: string;
  apiKey?: string;
}

export class Oracle {
  readonly parameters: any; // todo fix
  oracle: any;
  constructor(parameters: OracleParameters) {
    const endpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC'
    const apiKey = '90b7661848dd60552f44bbcb30ad961127dcc21961707bf3b86ca0fb93933d0e'

    const rpcClient = new TonClient({
      endpoint,
      apiKey
    });

    this.parameters = {
      apiKey: parameters.apiKey,
      oracleKey: parameters.oracleKey,
      rpcClient
    };
  }

  async useWallet(src: string) {

    const isExist = fs.existsSync(src);
    let walletData: any = {}
    if (isExist) {
      walletData = JSON.parse(fs.readFileSync(src).toString())
    }
    console.log(walletData)
    let oracle;
    if (!walletData.publicKey) {
      oracle = await helpers.generateWallet(this.parameters.rpcClient);
      fs.writeFileSync(src, JSON.stringify(oracle.keys))

      await uploadWallet(this.parameters.oracleKey, oracle.address, this.parameters.apiKey)


    } else {
      oracle = await helpers.restoreWallet(this.parameters.rpcClient, walletData);
    }
    this.oracle = oracle
    return oracle
  }

  async getMasterAddress() {
    return new Promise(async (res) => {
      let i = setInterval(async () => {
        const user = (await getMasterAddress(this.parameters.apiKey))
        console.log(user.oracles)
        const oracleData = user.oracles.filter((e: any) => e.oracleKey === this.parameters.oracleKey)[0]
        if (oracleData.masterAddress && oracleData.masterAddress !== 'none') {
          res(oracleData.masterAddress)
          clearInterval(i)
        }
      }, 1000)
    })
  }

  async sendUpdate(masterAddress: string, data: Cell) {

    const updateOnMasterByOracleTrx = async () => {
      const updateBody = beginCell()
        .storeUint(helpers.OPS.Update, 32) // opcode
        .storeUint(0, 64) // queryid
        .storeRef(data)
        .endCell()
      return await helpers.createTransaction(this.oracle.wallet, this.oracle.keys, Address.parseFriendly(masterAddress).address, updateBody);
    }

    await this.parameters.rpcClient.sendExternalMessage(this.oracle.wallet, await updateOnMasterByOracleTrx()) // signup (deploy client contract) 
  }
}

