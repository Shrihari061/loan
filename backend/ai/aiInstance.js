const { OpenAI } = require("openai");
const { config } = require("dotenv");
const { writeFileSync, createReadStream, readFileSync } = require("fs");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

config();

class AiInstance {
  aiClient;
  dbConnection;

  constructor() {
    this.dbConnection = new MongoClient(process.env.MONGO_URI);
    this.aiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  systemPrompt = () => {
    return readFileSync("./prompt_system.txt", "utf8");
  };

  userPrompt = ({
    BS_2024_25_FILENAME,
    BS_2023_24_FILENAME,
    PL_2024_25_FILENAME,
    PL_2023_24_FILENAME,
    CF_2024_25_FILENAME,
    CF_2023_24_FILENAME,
  }) => {
    return readFileSync("./prompt_user_template.txt", "utf8")
      .replace("{BS_2024_25_FILENAME}", BS_2024_25_FILENAME)
      .replace("{BS_2023_24_FILENAME}", BS_2023_24_FILENAME)
      .replace("{PL_2024_25_FILENAME}", PL_2024_25_FILENAME)
      .replace("{PL_2023_24_FILENAME}", PL_2023_24_FILENAME)
      .replace("{CF_2024_25_FILENAME}", CF_2024_25_FILENAME)
      .replace("{CF_2023_24_FILENAME}", CF_2023_24_FILENAME);
  };

  developerPrompt = () => {
    return readFileSync("./prompt_developer.txt", "utf8");
  };

  generatePromptCacheKey = () => {
    // Create a hash of the system and developer prompts to use as cache key
    const systemContent = this.systemPrompt();
    const developerContent = this.developerPrompt();
    const combinedPrompts = systemContent + developerContent;

    // Generate a hash of the combined prompts
    const hash = crypto
      .createHash("sha256")
      .update(combinedPrompts)
      .digest("hex");
    return `financial_extraction_${hash.substring(0, 16)}`;
  };

  extractData = async ({
    BS_2024_25_FILENAME,
    BS_2023_24_FILENAME,
    PL_2024_25_FILENAME,
    PL_2023_24_FILENAME,
    CF_2024_25_FILENAME,
    CF_2023_24_FILENAME,
  }) => {
    console.time("extractData");

    const filePathsSet = new Set([
      BS_2024_25_FILENAME,
      BS_2023_24_FILENAME,
      PL_2024_25_FILENAME,
      PL_2023_24_FILENAME,
      CF_2024_25_FILENAME,
      CF_2023_24_FILENAME,
    ]);
    const filePaths = Array.from(filePathsSet);

    const filePromises = filePaths.map((filePath) =>
      this.aiClient.files
        .create({
          file: createReadStream(filePath),
          purpose: "user_data",
        })
        .then((file) => ({
          filePath,
          fileId: file.id,
        }))
    );

    const fileResults = await Promise.all(filePromises);
    const files = Object.fromEntries(
      fileResults.map((result) => [result.filePath, result.fileId])
    );
    const payload = {
      model: "gpt-5-mini-2025-08-07",
      reasoning: {
        effort: "medium",
      },
      text: {
        verbosity: "low",
      },

      input: [
        {
          role: "system",
          content: this.systemPrompt(),
        },
        {
          role: "developer",
          content: this.developerPrompt(),
        },

        {
          role: "user",
          content: [
            ...fileResults.map((result) => ({
              type: "input_file",
              file_id: result.fileId,
            })),
            {
              type: "input_text",
              text: this.userPrompt({
                BS_2024_25_FILENAME: files[BS_2024_25_FILENAME].fileId,
                BS_2023_24_FILENAME: files[BS_2023_24_FILENAME].fileId,
                PL_2024_25_FILENAME: files[PL_2024_25_FILENAME].fileId,
                PL_2023_24_FILENAME: files[PL_2023_24_FILENAME].fileId,
                CF_2024_25_FILENAME: files[CF_2024_25_FILENAME].fileId,
                CF_2023_24_FILENAME: files[CF_2023_24_FILENAME].fileId,
              }),
            },
          ],
        },
      ],
    };
  

    // Generate prompt cache key
    const prompt_cache_key = this.generatePromptCacheKey();
    console.log(`Using prompt cache key: ${prompt_cache_key}`);

    const responseAllInOne = await this.aiClient.responses.create({
      ...payload,
      prompt_cache_key,
    });

    console.timeEnd("extractData");
    console.log({ responseAllInOne: responseAllInOne });
    writeFileSync(
      `${BS_2024_25_FILENAME}Response.json`,
      JSON.stringify(responseAllInOne)
    );
    writeFileSync(
      `${BS_2024_25_FILENAME}Output.json`,
      responseAllInOne.output_text
    );

    return responseAllInOne;
  };

  makeInference = async ({
    systemPrompt,
    developerPrompt,
    userPrompt,
    effort,
    verbosity,
  }) => {

    return this.aiClient.responses.create({
      model: "gpt-5-mini-2025-08-07",
      reasoning: {
        effort: effort || "medium",
      },
      text: {
        verbosity: verbosity || "low",
      },
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "developer",
          content: developerPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });
  };

  
}

export const aiInstance = new AiInstance();