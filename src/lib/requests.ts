export const uploadWallet = (oracleKey: string, address: string, apiKey: string) =>
  fetch('http://localhost:5000/api/v1/uploadOracleWallet/', {
    method: 'POST',
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      address,
      oracleKey
    })
  }).then(e => e.json()).then((e: { status: string }) => {
    if (e.status === 'ok') {
      console.log(e)
    } else {
      console.log(e)
    }
  })

export const getMasterAddress = (apiKey: string) =>
  fetch('http://localhost:5000/api/v1/account/', {
    method: 'GET',
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      'Authorization': `Bearer ${apiKey}`
    },
  }).then(e => e.json()).then((e) => {
    if (e.status === 'ok') {
      return e.account
    } else {
      console.log(e)
    }
  })

