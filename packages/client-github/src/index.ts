import { Octokit } from "@octokit/rest";
import { glob } from "glob";
import simpleGit, { SimpleGit } from "simple-git";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { createHash } from "crypto";
import {
    elizaLogger,
    AgentRuntime,
    Client,
    IAgentRuntime,
    knowledge,
    stringToUuid,
} from "@elizaos/core";
import { validateGithubConfig } from "./environment";

/**
 * Interface for configuring GitHub settings.
 * 
 * @param {string} owner - The owner of the GitHub repository.
 * @param {string} repo - The name of the GitHub repository.
 * @param {string} [branch] - The branch of the repository (optional).
 * @param {string} [path] - The path within the repository (optional).
 * @param {string} token - The authentication token for accessing the repository.
 */
export interface GitHubConfig {
    owner: string;
    repo: string;
    branch?: string;
    path?: string;
    token: string;
}

/**
 * GitHubClient class for interacting with GitHub repositories.
 * @class
 */
export class GitHubClient {
    private octokit: Octokit;
    private git: SimpleGit;
    private config: GitHubConfig;
    private runtime: AgentRuntime;
    private repoPath: string;

/**
 * Constructor for the GitHubService class.
 * @param {AgentRuntime} runtime - The agent runtime object.
 */
    constructor(runtime: AgentRuntime) {
        this.runtime = runtime;
        this.config = {
            owner: runtime.getSetting("GITHUB_OWNER") as string,
            repo: runtime.getSetting("GITHUB_REPO") as string,
            branch: runtime.getSetting("GITHUB_BRANCH") as string,
            path: runtime.getSetting("GITHUB_PATH") as string,
            token: runtime.getSetting("GITHUB_API_TOKEN") as string,
        };
        this.octokit = new Octokit({ auth: this.config.token });
        this.git = simpleGit();
        this.repoPath = path.join(
            process.cwd(),
            ".repos",
            this.config.owner,
            this.config.repo
        );
    }

/**
 * Asynchronously initializes the repository by creating the repos directory if it doesn't exist,
 * cloning or pulling the repository based on its existence, and checking out the specified branch if provided.
 */
    async initialize() {
        // Create repos directory if it doesn't exist
        await fs.mkdir(path.join(process.cwd(), ".repos", this.config.owner), {
            recursive: true,
        });

        // Clone or pull repository
        if (!existsSync(this.repoPath)) {
            await this.cloneRepository();
        } else {
            const git = simpleGit(this.repoPath);
            await git.pull();
        }

        // Checkout specified branch if provided
        if (this.config.branch) {
            const git = simpleGit(this.repoPath);
            await git.checkout(this.config.branch);
        }
    }

/**
 * Asynchronously clones the repository from the specified owner and repository name on GitHub.
 * 
 * @returns {Promise<void>} A promise that resolves when the repository is successfully cloned.
 * @throws {Error} If the cloning process fails after the maximum number of retries.
 */
    private async cloneRepository() {
        const repositoryUrl = `https://github.com/${this.config.owner}/${this.config.repo}.git`;
        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                await this.git.clone(repositoryUrl, this.repoPath);
                elizaLogger.log(
                    `Successfully cloned repository from ${repositoryUrl}`
                );
                return;
            } catch {
                elizaLogger.error(
                    `Failed to clone repository from ${repositoryUrl}. Retrying...`
                );
                retries++;
                if (retries === maxRetries) {
                    throw new Error(
                        `Unable to clone repository from ${repositoryUrl} after ${maxRetries} retries.`
                    );
                }
            }
        }
    }

/**
 * Asynchronously creates memories based on files found in the given directory path. 
 * 
 * @returns {Promise<void>} - A Promise that resolves once all memories are created.
 */
    async createMemoriesFromFiles() {
        console.log("Create memories");
        const searchPath = this.config.path
            ? path.join(this.repoPath, this.config.path, "**/*")
            : path.join(this.repoPath, "**/*");

        const files = await glob(searchPath, { nodir: true });

        for (const file of files) {
            const relativePath = path.relative(this.repoPath, file);
            const content = await fs.readFile(file, "utf-8");
            const contentHash = createHash("sha256")
                .update(content)
                .digest("hex");
            const knowledgeId = stringToUuid(
                `github-${this.config.owner}-${this.config.repo}-${relativePath}`
            );

            const existingDocument =
                await this.runtime.documentsManager.getMemoryById(knowledgeId);

            if (
                existingDocument &&
                existingDocument.content["hash"] == contentHash
            ) {
                continue;
            }

            console.log(
                "Processing knowledge for ",
                this.runtime.character.name,
                " - ",
                relativePath
            );

            await knowledge.set(this.runtime, {
                id: knowledgeId,
                content: {
                    text: content,
                    hash: contentHash,
                    source: "github",
                    attachments: [],
                    metadata: {
                        path: relativePath,
                        repo: this.config.repo,
                        owner: this.config.owner,
                    },
                },
            });
        }
    }

/**
* Creates a new pull request with the specified title, branch, files, and optional description.
* @param {string} title - The title of the pull request.
* @param {string} branch - The name of the new branch to be created.
* @param {Array<{ path: string, content: string }>} files - The array of file objects containing the path and content of each file.
* @param {string} [description] - Optional description for the pull request. If not provided, the title will be used.
* @returns {Promise<Object>} - A promise that resolves with the data of the created pull request.
*/
    async createPullRequest(
        title: string,
        branch: string,
        files: Array<{ path: string; content: string }>,
        description?: string
    ) {
        // Create new branch
        const git = simpleGit(this.repoPath);
        await git.checkout(["-b", branch]);

        // Write files
        for (const file of files) {
            const filePath = path.join(this.repoPath, file.path);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.content);
        }

        // Commit and push changes
        await git.add(".");
        await git.commit(title);
        await git.push("origin", branch);

        // Create PR
        const pr = await this.octokit.pulls.create({
            owner: this.config.owner,
            repo: this.config.repo,
            title,
            body: description || title,
            head: branch,
            base: this.config.branch || "main",
        });

        return pr.data;
    }

/**
 * Creates a new commit in the git repository with the given message and files.
 * @param {string} message - The message to associate with the commit.
 * @param {Array<{ path: string; content: string }>} files - Array of objects containing the path and content of files to add to the commit.
 * @returns {Promise<void>} - Promise that resolves once the commit has been created and pushed.
 */
    async createCommit(
        message: string,
        files: Array<{ path: string; content: string }>
    ) {
        const git = simpleGit(this.repoPath);

        // Write files
        for (const file of files) {
            const filePath = path.join(this.repoPath, file.path);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.content);
        }

        // Commit and push changes
        await git.add(".");
        await git.commit(message);
        await git.push();
    }
}

/**
 * Interface for interacting with GitHub as a client.
 * 
 * @type {Client}
 * @property {Function} start - Asynchronous function to start the client, validates GitHub config, initializes the client, creates memories from files, and returns the client.
 * @param {IAgentRuntime} runtime - The runtime environment for the agent.
 * @returns {Promise<Client>} - A Promise resolving to the initialized GitHub client.
 * @property {Function} stop - Asynchronous function to stop the client and log the action.
 * @param {IAgentRuntime} _runtime - The runtime environment for the agent (not used in this function).
 */
export const GitHubClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        await validateGithubConfig(runtime);
        elizaLogger.log("GitHubClientInterface start");

        const client = new GitHubClient(runtime as AgentRuntime);
        await client.initialize();
        await client.createMemoriesFromFiles();

        return client;
    },
    stop: async (_runtime: IAgentRuntime) => {
        elizaLogger.log("GitHubClientInterface stop");
    },
};

export default GitHubClientInterface;
