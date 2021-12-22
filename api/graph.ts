import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createWeightedGraph } from "@meta-cred/sc-plugin";
import { Gql, Chain, } from '../zeus';
import { Rating } from "@meta-cred/sc-plugin/dist/types";
import { allowCors } from "../utils/allowCors";

const { GRAPHQL_API_URL, GRAPHQL_ADMIN_SECRET } = process.env;

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (!GRAPHQL_API_URL || !GRAPHQL_ADMIN_SECRET) throw new Error("Missing ENV Vars");

  const chain = Chain(GRAPHQL_API_URL, {
    headers: {
      'x-hasura-admin-secret': GRAPHQL_ADMIN_SECRET,
    }
  });

  const data = await chain('query')({
    contributions: [{}, {
      id: true,
      title: true,
      created_at: true,
      date: true,
      author: {
        name: true,
        eth_address: true
      },
      contributors: [{}, {
        user: {
          name: true,
          eth_address: true,
        },
        contribution_share: true,
      }],
      votes: [{ where: { rating: { _nin: ["abstain"] } } }, {
        user: {
          name: true,
          eth_address: true,
        },
        rating: true,
        created_at: true
      }]
    }]
  });

  // Filter out flagged contributions
  const contributions = data.contributions
    .filter(c => c.votes.length && !c.votes.find(v => v.rating === 'flag'))
    .map(c => ({
      ...c,
      votes: c.votes.map(v => ({ ...v, rating: v.rating as Rating }))
    }))


  const weightedGraph = createWeightedGraph(contributions);


  res.status(200).json(weightedGraph);
}


export default allowCors(handler);
