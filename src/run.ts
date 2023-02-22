import { Oracle } from './lib/';
import { beginCell } from 'ton'
import { getTonToUsdPrice } from './lib/helpers'

const params = {
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lIjoiVHVlIEphbiAzMSAyMDIzIDE5OjEyOjU0IEdNVCswMTAwIChDZW50cmFsIEV1cm9wZWFuIFN0YW5kYXJkIFRpbWUpIiwid2FsbGV0IjoiRVFCVUw5YU00SUthQmVyWXY4aFpQMXFMZ1JuRVBuVjJEWXN3TzBhR3N5d1pIc1ZXIiwiaWF0IjoxNjc1MTg4Nzc0fQ.0FXGN_YgMqF79WWXDDP-8hLDMZj_eOpPv2rgWCpj-gc",
  oracleKey: 'Rpqm2YlZWja8JXMQ'
}

const runOracle = async () => {
  const oracle = new Oracle(params)
  await oracle.useWallet('/Users/sepezho/Work/raven/lib/test-lib/wallet.json')
  const masterAddress = await oracle.getMasterAddress()
  setInterval(async () => {
    const result = await oracle.sendUpdate(masterAddress as string, beginCell().storeUint(await getTonToUsdPrice(), 32).endCell())
    console.log(result)
  }, 20000)
}

runOracle()
