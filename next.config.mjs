const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubActions && repositoryName ? `/${repositoryName}` : "",
  assetPrefix: isGithubActions && repositoryName ? `/${repositoryName}/` : "",
};

export default nextConfig;
