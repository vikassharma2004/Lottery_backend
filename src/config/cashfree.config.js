import { Cashfree, CFEnvironment } from "cashfree-pg";
import { configDotenv } from "dotenv";
configDotenv({path:"../../.env"})


const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === "production"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX,

  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);
export default cashfree;

