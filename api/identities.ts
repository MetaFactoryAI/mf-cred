import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createIdentityProposals } from "@meta-cred/sc-plugin";
import {  Chain, } from '../zeus';
import { allowCors } from "../utils/allowCors";

const { GRAPHQL_API_URL, GRAPHQL_ADMIN_SECRET } = process.env;

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (!GRAPHQL_API_URL || !GRAPHQL_ADMIN_SECRET) throw new Error("Missing ENV Vars");

  const chain = Chain(GRAPHQL_API_URL, {
    headers: {
      'x-hasura-admin-secret': GRAPHQL_ADMIN_SECRET,
    }
  });

  const { users } = await chain('query')({
    users: [{}, {
      id: true,
      name: true,
      eth_address: true,
    }]
  });

  const proposals = createIdentityProposals(users);


  res.status(200).json(proposals);
}


export default allowCors(handler);
