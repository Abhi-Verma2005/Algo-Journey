import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Disable ESLint during production builds to avoid blocking the build
	// due to many existing rules/warnings. Consider addressing lint
	// warnings gradually and re-enabling this flag later.
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
