import {
    IAgentRuntime,
    ITranscriptionService,
    IVideoService,
    Media,
    Service,
    ServiceType,
    stringToUuid,
    elizaLogger,
} from "@elizaos/core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { tmpdir } from "os";
import path from "path";
import youtubeDl from "youtube-dl-exec";

/**
 * Class representing a video service.
 * Extends the Service class and implements the IVideoService interface.
 * 
 * @property {ServiceType} serviceType - The type of service (VIDEO).
 * @property {string} cacheKey - The key for caching video content.
 * @property {string} dataDir - The directory for storing content cache.
 * @property {string[]} queue - Array to store video queue.
 * @property {boolean} processing - Flag to indicate if video processing is in progress.
 * 
 * @constructor
 */
export class VideoService extends Service implements IVideoService {
    static serviceType: ServiceType = ServiceType.VIDEO;
    private cacheKey = "content/video";
    private dataDir = "./content_cache";

    private queue: string[] = [];
    private processing: boolean = false;

/**
 * Constructor for the class.
 * Calls the parent constructor and ensures that the data directory exists.
 */
    constructor() {
        super();
        this.ensureDataDirectoryExists();
    }

/**
 * Returns an instance of the VideoService class.
 * @returns {IVideoService} An instance of the VideoService class
 */
    getInstance(): IVideoService {
        return VideoService.getInstance();
    }

/**
 * Asynchronously initializes the agent with the provided runtime object.
 * 
 * @param _runtime - The runtime object to be used for initialization.
 * @returns A promise that resolves once the initialization is complete.
 */
    async initialize(_runtime: IAgentRuntime): Promise<void> {}

/**
 * Ensures that the data directory exists. If it does not exist, it creates the directory.
 */
    private ensureDataDirectoryExists() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir);
        }
    }

/**
 * Checks if the given URL is a video URL by looking for specific video hosting platforms such as YouTube or Vimeo.
 * @param {string} url - The URL to check if it is a video URL.
 * @returns {boolean} Returns true if the URL is a video URL, otherwise false.
 */
    public isVideoUrl(url: string): boolean {
        return (
            url.includes("youtube.com") ||
            url.includes("youtu.be") ||
            url.includes("vimeo.com")
        );
    }

/**
* Downloads media from the specified URL.
* @param {string} url - The URL of the media to download.
* @returns {Promise<string>} The path to the downloaded media file.
* @throws {Error} If there is an error during the download process.
*/
    public async downloadMedia(url: string): Promise<string> {
        const videoId = this.getVideoId(url);
        const outputFile = path.join(this.dataDir, `${videoId}.mp4`);

        // if it already exists, return it
        if (fs.existsSync(outputFile)) {
            return outputFile;
        }

        try {
            await youtubeDl(url, {
                verbose: true,
                output: outputFile,
                writeInfoJson: true,
            });
            return outputFile;
        } catch (error) {
            elizaLogger.log("Error downloading media:", error);
            throw new Error("Failed to download media");
        }
    }

/**
 * Downloads a video using the given video info.
 * 
 * @param {Object} videoInfo - Information about the video to download.
 * @returns {Promise<string>} Returns a promise that resolves with the path to the downloaded video file.
 */
    public async downloadVideo(videoInfo: any): Promise<string> {
        const videoId = this.getVideoId(videoInfo.webpage_url);
        const outputFile = path.join(this.dataDir, `${videoId}.mp4`);

        // if it already exists, return it
        if (fs.existsSync(outputFile)) {
            return outputFile;
        }

        try {
            await youtubeDl(videoInfo.webpage_url, {
                verbose: true,
                output: outputFile,
                format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                writeInfoJson: true,
            });
            return outputFile;
        } catch (error) {
            elizaLogger.log("Error downloading video:", error);
            throw new Error("Failed to download video");
        }
    }

/**
 * Process a video with the given URL using the provided agent runtime.
 * 
 * @param {string} url - The URL of the video to process.
 * @param {IAgentRuntime} runtime - The agent runtime to use for processing.
 * @returns {Promise<Media>} A promise that resolves to the processed media.
 */
    public async processVideo(
        url: string,
        runtime: IAgentRuntime
    ): Promise<Media> {
        this.queue.push(url);
        this.processQueue(runtime);

        return new Promise((resolve, reject) => {
            const checkQueue = async () => {
                const index = this.queue.indexOf(url);
                if (index !== -1) {
                    setTimeout(checkQueue, 100);
                } else {
                    try {
                        const result = await this.processVideoFromUrl(
                            url,
                            runtime
                        );
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }
            };
            checkQueue();
        });
    }

/**
 * Process the queue of URLs asynchronously.
 * 
 * @param {any} runtime - The runtime information.
 * @returns {Promise<void>} A Promise that resolves when the queue has been processed.
 */
    private async processQueue(runtime): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const url = this.queue.shift()!;
            await this.processVideoFromUrl(url, runtime);
        }

        this.processing = false;
    }

/**
 * Processes a video from a given URL by extracting information such as video ID, title, source, description, and transcript.
 * If the video data is already cached, it returns the cached data; otherwise, it fetches the video info and transcript, caches the result, and returns the processed video data.
 *
 * @param {string} url - The URL of the video to process
 * @param {IAgentRuntime} runtime - The runtime context for the agent
 * @returns {Promise<Media>} A promise that resolves with the processed video data
 */
    private async processVideoFromUrl(
        url: string,
        runtime: IAgentRuntime
    ): Promise<Media> {
        const videoId =
            url.match(
                /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^\/&?]+)/ // eslint-disable-line
            )?.[1] || "";
        const videoUuid = this.getVideoId(videoId);
        const cacheKey = `${this.cacheKey}/${videoUuid}`;

        const cached = await runtime.cacheManager.get<Media>(cacheKey);

        if (cached) {
            elizaLogger.log("Returning cached video file");
            return cached;
        }

        elizaLogger.log("Cache miss, processing video");
        elizaLogger.log("Fetching video info");
        const videoInfo = await this.fetchVideoInfo(url);
        elizaLogger.log("Getting transcript");
        const transcript = await this.getTranscript(url, videoInfo, runtime);

        const result: Media = {
            id: videoUuid,
            url: url,
            title: videoInfo.title,
            source: videoInfo.channel,
            description: videoInfo.description,
            text: transcript,
        };

        await runtime.cacheManager.set(cacheKey, result);

        return result;
    }

/**
 * Get the video ID from the given URL
 * 
 * @param {string} url - The URL from which to extract the video ID
 * @returns {string} The video ID extracted from the URL
 */
    private getVideoId(url: string): string {
        return stringToUuid(url);
    }

/**
 * Asynchronously fetches video information based on the provided URL.
 * 
 * @param {string} url - The URL of the video to fetch information for.
 * @returns {Promise<any>} A Promise that resolves to video information object.
 * @throws {Error} If an error occurs during fetching.
 */
    async fetchVideoInfo(url: string): Promise<any> {
        if (url.endsWith(".mp4") || url.includes(".mp4?")) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    // If the URL is a direct link to an MP4 file, return a simplified video info object
                    return {
                        title: path.basename(url),
                        description: "",
                        channel: "",
                    };
                }
            } catch (error) {
                elizaLogger.log("Error downloading MP4 file:", error);
                // Fall back to using youtube-dl if direct download fails
            }
        }

        try {
            const result = await youtubeDl(url, {
                dumpJson: true,
                verbose: true,
                callHome: false,
                noCheckCertificates: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true,
                writeSub: true,
                writeAutoSub: true,
                subLang: "en",
                skipDownload: true,
            });
            return result;
        } catch (error) {
            elizaLogger.log("Error fetching video info:", error);
            throw new Error("Failed to fetch video information");
        }
    }

/**
 * Asynchronously retrieves the transcript of the video content based on the provided URL, video information, and runtime.
 *
 * @param {string} url - The URL of the video content.
 * @param {any} videoInfo - Information about the video content.
 * @param {IAgentRuntime} runtime - The runtime environment for the operation.
 * @returns {Promise<string>} The transcript of the video content.
 */
    private async getTranscript(
        url: string,
        videoInfo: any,
        runtime: IAgentRuntime
    ): Promise<string> {
        elizaLogger.log("Getting transcript");
        try {
            // Check for manual subtitles
            if (videoInfo.subtitles && videoInfo.subtitles.en) {
                elizaLogger.log("Manual subtitles found");
                const srtContent = await this.downloadSRT(
                    videoInfo.subtitles.en[0].url
                );
                return this.parseSRT(srtContent);
            }

            // Check for automatic captions
            if (
                videoInfo.automatic_captions &&
                videoInfo.automatic_captions.en
            ) {
                elizaLogger.log("Automatic captions found");
                const captionUrl = videoInfo.automatic_captions.en[0].url;
                const captionContent = await this.downloadCaption(captionUrl);
                return this.parseCaption(captionContent);
            }

            // Check if it's a music video
            if (
                videoInfo.categories &&
                videoInfo.categories.includes("Music")
            ) {
                elizaLogger.log("Music video detected, no lyrics available");
                return "No lyrics available.";
            }

            // Fall back to audio transcription
            elizaLogger.log(
                "No subtitles or captions found, falling back to audio transcription"
            );
            return this.transcribeAudio(url, runtime);
        } catch (error) {
            elizaLogger.log("Error in getTranscript:", error);
            throw error;
        }
    }

/**
 * Asynchronously downloads a caption from the given URL.
 * 
 * @param {string} url - The URL from which to download the caption.
 * @returns {Promise<string>} A promise that resolves to the downloaded caption.
 * @throws {Error} If the download fails, an error is thrown with the corresponding status text.
 */
    private async downloadCaption(url: string): Promise<string> {
        elizaLogger.log("Downloading caption from:", url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Failed to download caption: ${response.statusText}`
            );
        }
        return await response.text();
    }

/**
 * Parses the caption content provided and returns a string representation.
 * 
 * @param {string} captionContent - The JSON-formatted caption content to parse.
 * @returns {string} The parsed caption string.
 */
    private parseCaption(captionContent: string): string {
        elizaLogger.log("Parsing caption");
        try {
            const jsonContent = JSON.parse(captionContent);
            if (jsonContent.events) {
                return jsonContent.events
                    .filter((event) => event.segs)
                    .map((event) => event.segs.map((seg) => seg.utf8).join(""))
                    .join("")
                    .replace("\n", " ");
            } else {
                elizaLogger.log("Unexpected caption format:", jsonContent);
                return "Error: Unable to parse captions";
            }
        } catch (error) {
            elizaLogger.log("Error parsing caption:", error);
            return "Error: Unable to parse captions";
        }
    }

/**
 * Parse the content of a SRT (SubRip) file to extract the text content.
 * 
 * @param {string} srtContent - The content of the SRT file to be parsed.
 * @returns {string} The extracted text content from the SRT file.
 */
    private parseSRT(srtContent: string): string {
        // Simple SRT parser (replace with a more robust solution if needed)
        return srtContent
            .split("\n\n")
            .map((block) => block.split("\n").slice(2).join(" "))
            .join(" ");
    }

/**
 * Asynchronously fetches and downloads the content of a SRT file from the specified URL.
 * 
 * @param {string} url - The URL of the SRT file to be downloaded.
 * @returns {Promise<string>} A promise that resolves with the text content of the downloaded SRT file.
 */
    private async downloadSRT(url: string): Promise<string> {
        elizaLogger.log("downloadSRT");
        const response = await fetch(url);
        return await response.text();
    }

/**
 * Asynchronously transcribe audio from a given URL using a transcription service provided by the runtime.
 * If the audio file is not found locally, it will either convert an existing MP4 file to MP3 or download the audio file.
 *
 * @param {string} url - The URL of the audio file to transcribe
 * @param {IAgentRuntime} runtime - The runtime instance providing the transcription service
 * @returns {Promise<string>} A promise that resolves with the transcription result or "Transcription failed" if unsuccessful
 */
    async transcribeAudio(
        url: string,
        runtime: IAgentRuntime
    ): Promise<string> {
        elizaLogger.log("Preparing audio for transcription...");
        const mp4FilePath = path.join(
            this.dataDir,
            `${this.getVideoId(url)}.mp4`
        );

        const mp3FilePath = path.join(
            this.dataDir,
            `${this.getVideoId(url)}.mp3`
        );

        if (!fs.existsSync(mp3FilePath)) {
            if (fs.existsSync(mp4FilePath)) {
                elizaLogger.log("MP4 file found. Converting to MP3...");
                await this.convertMp4ToMp3(mp4FilePath, mp3FilePath);
            } else {
                elizaLogger.log("Downloading audio...");
                await this.downloadAudio(url, mp3FilePath);
            }
        }

        elizaLogger.log(`Audio prepared at ${mp3FilePath}`);

        const audioBuffer = fs.readFileSync(mp3FilePath);
        elizaLogger.log(`Audio file size: ${audioBuffer.length} bytes`);

        elizaLogger.log("Starting transcription...");
        const startTime = Date.now();
        const transcriptionService = runtime.getService<ITranscriptionService>(
            ServiceType.TRANSCRIPTION
        );

        if (!transcriptionService) {
            throw new Error("Transcription service not found");
        }

        const uintBuffer = new Uint8Array(audioBuffer).buffer;
        const transcript = await transcriptionService.transcribe(uintBuffer);

        const endTime = Date.now();
        elizaLogger.log(
            `Transcription completed in ${(endTime - startTime) / 1000} seconds`
        );

        // Don't delete the MP3 file as it might be needed for future use
        return transcript || "Transcription failed";
    }

/**
 * Converts an MP4 video file to an MP3 audio file.
 * @param {string} inputPath - The path to the input MP4 file.
 * @param {string} outputPath - The path to save the output MP3 file.
 * @returns {Promise<void>} A Promise that resolves when the conversion is complete, or rejects with an error.
 */
    private async convertMp4ToMp3(
        inputPath: string,
        outputPath: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .output(outputPath)
                .noVideo()
                .audioCodec("libmp3lame")
                .on("end", () => {
                    elizaLogger.log("Conversion to MP3 complete");
                    resolve();
                })
                .on("error", (err) => {
                    elizaLogger.log("Error converting to MP3:", err);
                    reject(err);
                })
                .run();
        });
    }

/**
 * Downloads audio from a given URL and saves it to the specified output file.
 * If no output file is provided, it will default to saving the audio file in the data directory with the video ID as the filename.
 * 
 * @param {string} url - The URL of the audio file to download.
 * @param {string} outputFile - Optional. The path where the downloaded audio file will be saved.
 * @returns {Promise<string>} The path of the downloaded audio file.
 */
    private async downloadAudio(
        url: string,
        outputFile: string
    ): Promise<string> {
        elizaLogger.log("Downloading audio");
        outputFile =
            outputFile ??
            path.join(this.dataDir, `${this.getVideoId(url)}.mp3`);

        try {
            if (url.endsWith(".mp4") || url.includes(".mp4?")) {
                elizaLogger.log(
                    "Direct MP4 file detected, downloading and converting to MP3"
                );
                const tempMp4File = path.join(
                    tmpdir(),
                    `${this.getVideoId(url)}.mp4`
                );
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(tempMp4File, buffer);

                await new Promise<void>((resolve, reject) => {
                    ffmpeg(tempMp4File)
                        .output(outputFile)
                        .noVideo()
                        .audioCodec("libmp3lame")
                        .on("end", () => {
                            fs.unlinkSync(tempMp4File);
                            resolve();
                        })
                        .on("error", (err) => {
                            reject(err);
                        })
                        .run();
                });
            } else {
                elizaLogger.log(
                    "YouTube video detected, downloading audio with youtube-dl"
                );
                await youtubeDl(url, {
                    verbose: true,
                    extractAudio: true,
                    audioFormat: "mp3",
                    output: outputFile,
                    writeInfoJson: true,
                });
            }
            return outputFile;
        } catch (error) {
            elizaLogger.log("Error downloading audio:", error);
            throw new Error("Failed to download audio");
        }
    }
}
