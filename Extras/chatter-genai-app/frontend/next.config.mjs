/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    env: {
        SERVER_URL: process.env.SERVER_URL,
      }
};

export default nextConfig;
