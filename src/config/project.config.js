const isProduction = process.env.NODE_ENV === "production";

export const config = {
  DEV_SERVER_PORT: 8030,
  API_BASE_URL: isProduction ? "/api" : "http://localhost:8080",
};
