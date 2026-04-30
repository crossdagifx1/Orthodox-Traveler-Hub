import { bootstrap } from "../lib/db/src/index";
import app from "../artifacts/api-server/src/app";

let bootstrapped = false;

export default async (req: any, res: any) => {
  if (!bootstrapped) {
    try {
      await bootstrap();
      bootstrapped = true;
    } catch (err) {
      console.error("Vercel bootstrap error:", err);
    }
  }
  // Ensure the Express app handles the request
  return (app as any)(req, res);
};
