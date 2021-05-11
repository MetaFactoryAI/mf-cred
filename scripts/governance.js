const fs = require("fs-extra")
const _ = require('lodash');


(async function() {
  const data = JSON.parse((await fs.readFile('data/governance.json')).toString());
  
  const voters = _(data).groupBy('address').mapValues(v => v.length).value();
  console.log(voters);
  
  fs.writeFile('./data/voters.json', JSON.stringify(voters));
  
})()
