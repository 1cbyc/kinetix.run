import chalk from "chalk";
import { table } from "table";

export function success(message: string) {
  console.log(chalk.green("✓"), message);
}

export function error(message: string) {
  console.error(chalk.red("✗"), message);
}

export function info(message: string) {
  console.log(chalk.blue("ℹ"), message);
}

export function warn(message: string) {
  console.log(chalk.yellow("⚠"), message);
}

export function log(message: string) {
  console.log(message);
}

export function printTable(data: any[][], headers: string[]) {
  const output = table([headers, ...data], {
    border: {
      topBody: "─",
      topJoin: "┬",
      topLeft: "┌",
      topRight: "┐",
      bottomBody: "─",
      bottomJoin: "┴",
      bottomLeft: "└",
      bottomRight: "┘",
      bodyLeft: "│",
      bodyRight: "│",
      bodyJoin: "│",
      joinBody: "─",
      joinLeft: "├",
      joinRight: "┤",
      joinJoin: "┼",
    },
    columns: headers.map(() => ({ alignment: "left" })),
  });
  console.log(output);
}

export function printJson(data: any) {
  console.log(JSON.stringify(data, null, 2));
}