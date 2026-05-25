/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@openstoreshot/core", "@openstoreshot/store-fetch", "@openstoreshot/imagegen", "@openstoreshot/renderer"]
};

export default nextConfig;
