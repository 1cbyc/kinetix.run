import Conf from "conf";

export interface Config {
  accessToken?: string;
  apiUrl?: string;
  currentProject?: string;
}

const schema = {
  accessToken: {
    type: "string" as const,
    default: undefined,
  },
  apiUrl: {
    type: "string" as const,
    default: process.env.KINETIX_API_URL || "http://localhost:3001",
  },
  currentProject: {
    type: "string" as const,
    default: undefined,
  },
};

export const config = new Conf<Config>({
  projectName: "kinetix",
  schema,
  defaults: {
    apiUrl: process.env.KINETIX_API_URL || "http://localhost:3001",
  },
});