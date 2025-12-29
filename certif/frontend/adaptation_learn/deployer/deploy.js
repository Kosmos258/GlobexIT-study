import axios from "axios";
import chalk from "chalk";
import fs from "fs";
import glob from "glob";
import path from "path";
import { BUILD_PATH, DEPLOYER_HOST, DEPLOYER_LOGIN, DEPLOYER_PASSWORD, HOOK_CODE, PARENT_DIRECTORY, xAuthId } from "./consts.js";

const authorizationHeader = `Basic ${Buffer.from(
	`${DEPLOYER_LOGIN}:${DEPLOYER_PASSWORD}`
).toString("base64")}`;

const files = glob.sync(`${BUILD_PATH}/**/*`);

const fileObjects = files.filter((file) => {
  return fs.statSync(file).isFile();
}).map((file) => {
  const fileBuffer = fs.readFileSync(file);
  const fileName = path.basename(file);
  const fileFolder = path.dirname(file).replace(BUILD_PATH, '').replace(/\//g, '\\');

  return {
    content: fileBuffer.toString('base64'),
    name: fileName,
    folder: fileFolder,
  };
});

console.log(chalk.greenBright(`\n☑️  Files found ${fileObjects.length}`));

const time = new Date()

axios
	.post(
		`${DEPLOYER_HOST}/custom_web_template.html?object_code=${HOOK_CODE}`,
		{
			files: fileObjects,
			directory: PARENT_DIRECTORY
		},
		{
			headers: {
				Authorization: authorizationHeader,
				Cookie: `x-auth-id=${xAuthId}`,
				'Content-Type': 'application/json'
			},
		}
	)
	.then(({ data }) => {
		console.log(
			chalk.greenBright(`☑️  Files deployed [${Number(new Date() - time)}ms]\n`)
		);

		console.log(chalk.greenBright(`✅ Server response: ${data} `));
	})
	.catch(({ response }) => {
		console.log(
			chalk.redBright(
				`❌ Files deployed but server returns error [${Number(
					new Date() - time
				)}ms]:\n`
			)
		);
		console.error(chalk.redBright(response.data + "\n"));
	});
