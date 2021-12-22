import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDeclaration } from "@meta-cred/sc-plugin";
import { allowCors } from "../utils/allowCors";


const handler = async (req: VercelRequest, res: VercelResponse) => {
  const declaration = getDeclaration()

  res.status(200).json(declaration);
}

export default allowCors(handler);
