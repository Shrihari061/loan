const { OpenAI } = require("openai");
const { config } = require("dotenv");
const { writeFileSync, createReadStream, readFileSync } = require("fs");
const crypto = require("crypto");
const path = require("path");

config();

class AiInstance {
  aiClient;
  constructor() {
    this.aiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  systemPrompt = () => {
    return readFileSync(path.join(__dirname, "./prompt_system.txt"), "utf8");
  };

  userPrompt = ({
    BS_2024_25_FILENAME,
    BS_2023_24_FILENAME,
    PL_2024_25_FILENAME,
    PL_2023_24_FILENAME,
    CF_2024_25_FILENAME,
    CF_2023_24_FILENAME,
  }) => {
    return readFileSync(
      path.join(__dirname, "./prompt_user_template.txt"),
      "utf8"
    )
      .replace("{BS_2024_25_FILENAME}", BS_2024_25_FILENAME)
      .replace("{BS_2023_24_FILENAME}", BS_2023_24_FILENAME)
      .replace("{PL_2024_25_FILENAME}", PL_2024_25_FILENAME)
      .replace("{PL_2023_24_FILENAME}", PL_2023_24_FILENAME)
      .replace("{CF_2024_25_FILENAME}", CF_2024_25_FILENAME)
      .replace("{CF_2023_24_FILENAME}", CF_2023_24_FILENAME);
  };

  developerPrompt = () => {
    return readFileSync(path.join(__dirname, "./prompt_developer.txt"), "utf8");
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
    console.log("Making inference...");
    const response = await this.aiClient.responses.create({
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
    console.log("Inference completed");
    return response;
  };

  // Balance Sheet specific methods
  balanceSheetDeveloperPrompt = () => {
    return readFileSync(
      path.join(__dirname, "./prompt_developer_bs.txt"),
      "utf8"
    );
  };

  balanceSheetUserPrompt = ({ BS_2024_25_FILENAME, BS_2023_24_FILENAME }) => {
    return readFileSync(
      path.join(__dirname, "./prompt_user_template_bs.txt"),
      "utf8"
    )
      .replace("{BS_2024_25_FILENAME}", BS_2024_25_FILENAME)
      .replace("{BS_2023_24_FILENAME}", BS_2023_24_FILENAME);
  };

  extractBalanceSheet = async ({
    BS_2024_25_FILENAME,
    BS_2023_24_FILENAME,
  }) => {
    console.time("extractBalanceSheet");
    console.log("Extracting Balance Sheet data...");

    const filePaths = [BS_2024_25_FILENAME, BS_2023_24_FILENAME];
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
          content: this.balanceSheetDeveloperPrompt(),
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
              text: this.balanceSheetUserPrompt({
                BS_2024_25_FILENAME: files[BS_2024_25_FILENAME],
                BS_2023_24_FILENAME: files[BS_2023_24_FILENAME],
              }),
            },
          ],
        },
      ],
    };

    console.log(`Balance Sheet req`);

    const response = await this.aiClient.responses.create({
      ...payload,
    });

    console.timeEnd("extractBalanceSheet");
    console.log("Balance Sheet extraction completed");

    // Save response files
    writeFileSync(
      `${BS_2024_25_FILENAME}_BS_Response.json`,
      JSON.stringify(response)
    );
    writeFileSync(
      `${BS_2024_25_FILENAME}_BS_Output.json`,
      response.output_text
    );

    return response;
  };

  // Cash Flow specific methods
  cashFlowDeveloperPrompt = () => {
    return readFileSync(
      path.join(__dirname, "./prompt_developer_cf.txt"),
      "utf8"
    );
  };

  cashFlowUserPrompt = ({ CF_2024_25_FILENAME, CF_2023_24_FILENAME }) => {
    return readFileSync(
      path.join(__dirname, "./prompt_user_template_cf.txt"),
      "utf8"
    )
      .replace("{CF_2024_25_FILENAME}", CF_2024_25_FILENAME)
      .replace("{CF_2023_24_FILENAME}", CF_2023_24_FILENAME);
  };

  extractCashFlow = async ({ CF_2024_25_FILENAME, CF_2023_24_FILENAME }) => {
    console.time("extractCashFlow");
    console.log("Extracting Cash Flow data...");

    const filePaths = [CF_2024_25_FILENAME, CF_2023_24_FILENAME];
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
          content: this.cashFlowDeveloperPrompt(),
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
              text: this.cashFlowUserPrompt({
                CF_2024_25_FILENAME: files[CF_2024_25_FILENAME],
                CF_2023_24_FILENAME: files[CF_2023_24_FILENAME],
              }),
            },
          ],
        },
      ],
    };

    console.log(`Cash Flow req`);
    const response = await this.aiClient.responses.create({
      ...payload,
    });

    console.timeEnd("extractCashFlow");
    console.log("Cash Flow extraction completed");

    // Save response files
    writeFileSync(
      `${CF_2024_25_FILENAME}_CF_Response.json`,
      JSON.stringify(response)
    );
    writeFileSync(
      `${CF_2024_25_FILENAME}_CF_Output.json`,
      response.output_text
    );

    return response;
  };

  // Profit & Loss specific methods
  profitLossDeveloperPrompt = () => {
    return readFileSync(
      path.join(__dirname, "./prompt_developer_pl.txt"),
      "utf8"
    );
  };

  profitLossUserPrompt = ({ PL_2024_25_FILENAME, PL_2023_24_FILENAME }) => {
    return readFileSync(
      path.join(__dirname, "./prompt_user_template_pl.txt"),
      "utf8"
    )
      .replace("{PL_2024_25_FILENAME}", PL_2024_25_FILENAME)
      .replace("{PL_2023_24_FILENAME}", PL_2023_24_FILENAME);
  };

  extractProfitLoss = async ({ PL_2024_25_FILENAME, PL_2023_24_FILENAME }) => {
    console.time("extractProfitLoss");
    console.log("Extracting Profit & Loss data...");

    const filePaths = [PL_2024_25_FILENAME, PL_2023_24_FILENAME];
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
          content: this.profitLossDeveloperPrompt(),
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
              text: this.profitLossUserPrompt({
                PL_2024_25_FILENAME: files[PL_2024_25_FILENAME],
                PL_2023_24_FILENAME: files[PL_2023_24_FILENAME],
              }),
            },
          ],
        },
      ],
    };

    console.log(`Profit & Loss req`);

    const response = await this.aiClient.responses.create({
      ...payload,
    });

    console.timeEnd("extractProfitLoss");
    console.log("Profit & Loss extraction completed");

    // Save response files
    writeFileSync(
      `${PL_2024_25_FILENAME}_PL_Response.json`,
      JSON.stringify(response)
    );
    writeFileSync(
      `${PL_2024_25_FILENAME}_PL_Output.json`,
      response.output_text
    );

    return response;
  };

  // Method to extract all statements sequentially
  extractAllStatements = async ({
    BS_2024_25_FILENAME,
    BS_2023_24_FILENAME,
    PL_2024_25_FILENAME,
    PL_2023_24_FILENAME,
    CF_2024_25_FILENAME,
    CF_2023_24_FILENAME,
  }) => {
    console.log(
      "Starting sequential extraction of all financial statements..."
    );

    const results = {};

    try {
      // Extract Balance Sheet
      results.balanceSheet = await this.extractBalanceSheet({
        BS_2024_25_FILENAME,
        BS_2023_24_FILENAME,
      });

      // Extract Profit & Loss
      results.profitLoss = await this.extractProfitLoss({
        PL_2024_25_FILENAME,
        PL_2023_24_FILENAME,
      });

      // Extract Cash Flow
      results.cashFlow = await this.extractCashFlow({
        CF_2024_25_FILENAME,
        CF_2023_24_FILENAME,
      });

      console.log("All financial statements extracted successfully");
      return results;
    } catch (error) {
      console.error("Error during sequential extraction:", error);
      throw error;
    }
  };
}

const aiInstance = new AiInstance();

module.exports = { aiInstance };
