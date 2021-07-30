const fs = require("fs-extra")
const _ = require('lodash');
const {  request } = require('graphql-request');

const query = `{
  contributions {
    weight
    votes {
      rating
    }
    title
    id
    date
    contributors {
      contribution_share
      user {
        eth_address
        name
      }
    }
  }
}
`;

const getRatingWeight = (rating) => {
  switch (rating) {
    case 'legendary':
      return 12;
    case 'epic':
      return 6;
    case 'rare':
      return 3;
    case 'common':
      return 1;
  }
}


(async function() {
  const {  contributions } = await request('https://metafactory.hasura.app/v1/graphql', query)
  
  const voted = _(contributions)
    .map(c => ({
      ...c,
      voteWeight: c.votes.reduce((total, v) => total += getRatingWeight(v.rating), 0),
    }))
    .sortBy('voteWeight')
    .value();
  
  console.log(data);
  
  
})()
