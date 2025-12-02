const nextConfig = {
    webpack: (config: { externals: any[]; }, { isServer }: any) => {
        if (isServer) {
            config.externals = [
                ...config.externals,
                '@apollo/client',
            ];
        }
        return config;
    },
    turbopack: {},
};

module.exports = nextConfig;
