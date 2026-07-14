import { execSync } from "node:child_process";
import readline from "node:readline";
import fs from "node:fs";
import os from "node:os";

const trash = os.platform() === "win32" ? "NUL" : "/dev/null";

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    process.exitCode = 1;
  }
}

function buildLanguage(lc="") {
  const langInput = lc.toLowerCase().trim();
  let pageName = langInput === "en" ? "index" : langInput;
  
  const inputPath = `trans/${langInput}/pghrt_${langInput}`;
  
  run(`latexmk -pdf -outdir=pdfs -silent ${inputPath}`);
  run(`latexmk -c -outdir=export -silent ${inputPath}`);
  run(`latexmlc --destination=export/${pageName}.html --log=${trash} ${inputPath}`);
  run(`python src/soup.py ${langInput}`);
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  
  const languages = fs.readdirSync("trans/");
  
  console.log(`Currently supported languages: ${languages.join(", ")}`);
  const lc = (await ask("Please input the desired language code, or press ENTER to build all\n")).trim();
  rl.close();
  
  if (languages.includes(lc)) {
    buildLanguage(lc);
  } else if (lc === "") {
    for (const lang of languages) {
      buildLanguage(lang);
    }
  } else {
    console.log("Invalid input\n");
  }
}

main();