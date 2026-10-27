import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  runCodeAgainstTestCases,
  SUPPORTED_LANGUAGES,
  TestCase,
} from "../services/judge0.service";

const runCodeSchema = z.object({
  sourceCode: z.string().min(1, "Source code cannot be empty"),
  language: z.string().default("javascript"),
  stdin: z.string().optional(),
  expectedOutput: z.string().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string().default(""),
        expectedOutput: z.string().default(""),
      })
    )
    .optional(),
});

/**
 * Execute code via Judge0 API or local sandbox against test cases
 * POST /api/code/run
 */
export const runCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = runCodeSchema.parse(req.body);
    const { sourceCode, language, stdin, expectedOutput, testCases } = validated;

    // Convert test cases or fallback to stdin / expectedOutput pair
    let casesToRun: TestCase[] = [];
    if (testCases && testCases.length > 0) {
      casesToRun = testCases;
    } else if (stdin !== undefined || expectedOutput !== undefined) {
      casesToRun = [
        {
          input: stdin || "",
          expectedOutput: expectedOutput || "",
        },
      ];
    }

    const report = await runCodeAgainstTestCases(
      sourceCode,
      language,
      casesToRun,
      stdin
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: error.errors[0]?.message || "Invalid execution payload",
      });
      return;
    }
    next(error);
  }
};

/**
 * Get list of supported languages, Monaco syntax mappings, and starter boilerplate
 * GET /api/code/languages
 */
export const getSupportedLanguages = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      languages: SUPPORTED_LANGUAGES,
    },
  });
};
