const sc = require('sourcecred').sourcecred;
const fs = require("fs-extra");
const Web3 = require('web3');
const web3Utils = require('web3-utils');
const _ = require('lodash');
const fetch = require('node-fetch');

const Ledger = sc.ledger.ledger.Ledger;
const G = sc.ledger.grain;

const web3 = new Web3(new Web3.providers.HttpProvider(
  'https://mainnet.infura.io/v3/43dd12c4245b4924b4a29cea5afa18ef:8545'));


const NodeAddress = sc.core.address.makeAddressModule({
  name: "NodeAddress",
  nonce: "N",
  otherNonces: new Map().set("E", "EdgeAddress"),
});

const numberToWei = (n) => web3.utils.toWei(parseFloat(n).toFixed(9), 'ether');


const MINT_TX_HASH = "https://etherscan.io/tx/0xd5f75e9d622272dc4d969d9ed6119c4b546eea46810037654838843db02e3f81";
const MINT_DATE = "July 30, 2021";
const ROBOT_TOKEN_ADDRESS = "0xfb5453340C03db5aDe474b27E68B6a9c6b2823Eb";

const LEDGER_PATH = 'data/ledger.json';
const LAST_MINTING_PATH = 'scripts/toMintMerkle.json';
const ETH_MAIN_NET_IDENTITY_ID = "kGGJH0fyxcpsRRWwDepL6A";

async function deductRobotAlreadyMinted(accounts, ledger) {
  const LAST_MINTING =  JSON.parse(await fs.readFile(LAST_MINTING_PATH));
  
  for (const address in LAST_MINTING) {
    
    const amount = LAST_MINTING[address];
  
    const account = accounts.find(a => a.ethAddress.toLowerCase() === address.toLowerCase());
    if (!account) {
      console.warn('Missing account for: ', address);
    }

    const robotsMinted = G.fromApproximateFloat(amount);
    const robotsBalance = G.fromString(account.balance);
    // console.log({ robotsBalance, robotsMinted, mint });
    // console.log({ address, amount, robotsMinted });
  
    let transferAmount = robotsMinted;
    // Only transfer up to max balance
    if (G.lt(robotsBalance, robotsMinted)) {
      console.log(`Extra ROBOT Balance for: ${account.ethAddress}: ${G.sub(robotsMinted, robotsBalance)}`);
      transferAmount = robotsBalance;
    }
    ledger.activate(account.identity.id);
    ledger.transferGrain({
      from: account.identity.id,
      to: ETH_MAIN_NET_IDENTITY_ID,
      amount: transferAmount,
      memo: `Minted ROBOT on chain to ${account.ethAddress} on ${MINT_DATE} (${MINT_TX_HASH})`,
    });
  }
}

(async function () {
  const ledgerJSON = (await fs.readFile(LEDGER_PATH)).toString();
  
  const ledger = Ledger.parse(ledgerJSON);
  const accounts = ledger.accounts();
  
  const accountsWithAddress = accounts.map(a => {
    if (a.identity.subtype === 'BOT') return null;
    
    const ethAliases = a.identity.aliases.filter(alias => {
      const parts = NodeAddress.toParts(alias.address);
      return parts.indexOf('ethereum') > 0;
    });
    
    if (!ethAliases.length) return null;
    
    let ethAddress = null;
    
    ethAliases.forEach(alias => {
      ethAddress = NodeAddress.toParts(alias.address)[2];
    });

    return {
      ...a,
      ethAddress: ethAddress,
    };
  }).filter(Boolean);
  
  await deductRobotAlreadyMinted(accountsWithAddress, ledger);
  await fs.writeFile(LEDGER_PATH, ledger.serialize())
  
  const newMintAmounts = {};
  let total = 0;
  accountsWithAddress.forEach(acc => {
    const amountToMint = G.format(acc.balance, 9, '').replace(/,/g, '');
    newMintAmounts[acc.ethAddress] = amountToMint;
    if (!web3Utils.isAddress(acc.ethAddress)) {
      console.log('INVALID ADD for acc: ', acc);
    }

    total += parseFloat(amountToMint);
    console.log({ total, amountToMint });
    
  });
  
  const merkleAmounts = {};
  
  for (const address in newMintAmounts) {
    if (newMintAmounts[address] > 0) merkleAmounts[address] = newMintAmounts[address]
  }
  
  const addresses = [];
  const amounts = [];
  
  console.log(Object.entries(merkleAmounts).map(([address, amount]) => {
    addresses.push(address);
    amounts.push(numberToWei(amount));

    return `${ROBOT_TOKEN_ADDRESS},${address},${amount.toString().replace(/,/g, '')}`
  }).join('\n'));
  console.log({ total });

  const addressString = `[${addresses.join(',')}]`
  const amountsString = `[${amounts.join(',')}]`
  
  // fs.writeFile('./scripts/opsDistroDisperse.txt', [addressString, amountsString].join('\n'));
  fs.writeFile('./scripts/toMintMerkle.json', JSON.stringify(merkleAmounts));
})();
