import { config, createSchema } from "@keystone-next/keystone/schema";
import { createAuth } from "@keystone-next/auth";
import {
  withItemData,
  statelessSessions,
} from "@keystone-next/keystone/session";
import "dotenv/config";

import { User } from "./schemas/User";
import { Product } from "./schemas/Product";
import { ProductImage } from "./schemas/ProductImage";
import { insertSeedData } from "./seed-data";

const databaseURL =
  process.env.DATABASE_URL || "mongodb://localhost/Sophie-Shopping";

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 30, // session period
  secret: process.env.COOKIE_SECRET,
};

const { withAuth } = createAuth({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "email", "password"],
    // TODO: Add in initial roles here
  },
  passwordResetLink: {
    sendToken(args) {},
  },
});

export default withAuth(
  config({
    server: {
      cors: {
        origin: [process.env.FRONTEND_URL],
        credentials: true,
      },
    },
    db: {
      adapter: "mongoose",
      url: databaseURL,
      async onConnect(keystone) {
        console.log("Connected to the DB and insert the fake data  !!!");
        if (process.argv.includes("--seed-data")) {
          await insertSeedData(keystone);
        }
      },
    },
    lists: createSchema({
      // Schema items input
      User: User,
      Product: Product,
      ProductImage: ProductImage,
    }),
    ui: {
      // Check the User's permission for login to keystone UI
      isAccessAllowed: ({ session }) => {
        console.log(session);
        return !!session?.data;
      },
    },
    session: withItemData(statelessSessions(sessionConfig), {
      User: "id, name, email", // GraphQL Query
    }),
  })
);
