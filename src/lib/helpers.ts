import { mnemonicNew, KeyPair, mnemonicToPrivateKey } from "ton-crypto";
import BN from 'bn.js'
import {
  Address,
  TonClient,
  StateInit,
  Cell,
  toNano,
  CellMessage,
  WalletV3R2Source,
  WalletContract,
  InternalMessage,
  CommonMessageInfo,
} from 'ton';
import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export const getTonToUsdPrice = async () => {
  return new BN((await CoinGeckoClient.coins.fetch("the-open-network", {})).data
    .market_data.current_price.usd * 100);
}

enum SendMode {
  CARRRY_ALL_REMAINING_BALANCE = 128,
  CARRRY_ALL_REMAINING_INCOMING_VALUE = 64,
  DESTROY_ACCOUNT_IF_ZERO = 32,
  PAY_GAS_SEPARATLY = 1,
  IGNORE_ERRORS = 2,
}


export enum OPS {
  // Excesses = 0xd53276db,
  Signup = 0x4ea31eef,
  CreateAccount = 0x2f2067c2,
  Fetch = 0x82e96343,
  Update = 0x98253578,
  Withdrawal = 0x6d2d3b45,
  NewValue = 0xe5e11be9,
}

export enum MODES {
  OnDemand = 0x8660a9dc,
  Subscription = 0xa3c664d3,
}
export const deploySmartContract = async (wallet: WalletContract, keyPair: KeyPair, toAddress: Address, code: Cell, data: Cell) => {
  let seqno: number = await wallet.getSeqNo();

  const trx = wallet.createTransfer({
    secretKey: keyPair.secretKey,
    seqno: seqno,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    order: new InternalMessage({
      to: toAddress,
      value: toNano(0.1),
      bounce: false,
      body: new CommonMessageInfo({
        stateInit: new StateInit({
          code,
          data,
        }),
        body: null,
      })
    })
  });

  return trx;
}

export const createTransaction = async (wallet: WalletContract, keyPair: KeyPair, toAddress: Address, body: Cell, value?: BN) => {
  let seqno: number = await wallet.getSeqNo();
  console.log(keyPair.secretKey)
  const trx = wallet.createTransfer({
    secretKey: keyPair.secretKey,
    seqno: seqno,
    sendMode: SendMode.CARRRY_ALL_REMAINING_INCOMING_VALUE,
    order: new InternalMessage({
      to: toAddress,
      value: value ? value : toNano(0.05),
      bounce: false,
      body: new CommonMessageInfo({
        body: new CellMessage(body),
      })
    })
  });

  return trx;
}

export const seqnoWaiter = async (client: TonClient, wallet: WalletContract) => new Promise((res, _) => {
  let oldSeqno = -1;
  let counter = 0
  let i = setInterval(async () => {
    counter++;
    if (counter > 61) {
      console.log('Something went wrong, check balance of wallet ', wallet.address)
    }
    const seqno: number = await wallet.getSeqNo();
    if ((oldSeqno !== -1) && seqno !== oldSeqno) {
      clearInterval(i);
      res(true)
    } else {
      oldSeqno = seqno
    }
  }, 1000)
})

export const transactionWaiter = async (client: TonClient, address: Address) => new Promise((res, _) => {
  let oldHash = '';
  let i = setInterval(async () => {
    const transactions = await client.getTransactions(address, { limit: 1 });
    if (transactions.length > 0) {
      if (oldHash) {
        clearInterval(i);
        res(true)
      } else {
        oldHash = transactions[0].id.hash
      }
    } else {
      oldHash = 'execute'
    }
  }, 2000)
})

export const depositWaiter: any = async (client: TonClient, address: Address) => new Promise((res, _) => {
  let i = setInterval(async () => {
    const transactions = await client.getTransactions(address, { limit: 1 });
    if (transactions.length > 0) {
      const depositer = transactions[0].inMessage?.source
      if (depositer) {
        clearInterval(i);
        res(depositer)
      }
    }
  }, 1000)
})

export const generateWallet = async (client: TonClient) => {
  const mnemonic = await mnemonicNew()
  const keys = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContract.create(
    client,
    WalletV3R2Source.create({ publicKey: keys.publicKey, workchain: 0 })
  );
  const address = wallet.address.toFriendly();
  return { mnemonic, keys, wallet, address }
}

export const restoreWallet = async (client: TonClient, mnemonic: string[]) => {
  const keys = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContract.create(
    client,
    WalletV3R2Source.create({ publicKey: keys.publicKey, workchain: 0 })
  );
  const address = wallet.address.toFriendly();
  return { mnemonic, keys, wallet, address }
}

export const sleep = async (val: number) => new Promise((res, _) => {
  setTimeout(() => {
    res(true);
  }, val)
})

