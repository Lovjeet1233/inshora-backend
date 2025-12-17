/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['oaidalleapiprodscus.blob.core.windows.net', 'platform.openai.com', 'scontent.fbom5-1.fna.fbcdn.net'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.openai.com',
      },
    ],
  },
};

export default nextConfig;
