// transform.ts
import {SsjsProjectBuilder} from "@globexit/websoft-types/lib/ssjs-transpiler";

const {src} = require('gulp');
const include = require('gulp-include');
const change = require('gulp-change');
const createProject = require('gulp-typescript').createProject;
import {SRC_PATH, IMPORT_REGEXP, TS_CONFIG_PATH, EXPORT_REGEXP, FUNC_EXPORT_REGEXP} from "./consts";

const eslint = require('gulp-eslint');

const {transformerConfigurator, importManager} = new SsjsProjectBuilder()
    .setTsConfigPath(TS_CONFIG_PATH)
    .build();

const dotenv = require('dotenv');
dotenv.config();

const removeImportsExports = (content: string) => content.replace(IMPORT_REGEXP, "").replace(EXPORT_REGEXP, "").replace(FUNC_EXPORT_REGEXP, "");
const replaceMultilinesForm = (content: string) => content.replace(/\\n/g, '\\\n').replace(/\\t/g, '\t');
const replaceUnicode = (content: string) => content.replace(/\\u([0-9a-fA-F]{4})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))

export const transformTS = (path) => {
    return src(path, {base: SRC_PATH})
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(change(importManager.addFuncImports))
        .pipe(change(importManager.replaceImports))
        .pipe(include({
            extensions: 'ts',
            hardFail: true,
            separateInputs: true,
            includePaths: [
                __dirname + "../../node_modules"
            ]
        }))
        .pipe(createProject(TS_CONFIG_PATH, {
            typescript: transformerConfigurator.ts,
            getCustomTransformers: () => ({
                before: transformerConfigurator.getTransformers()
            })
        })())
        .pipe(change(removeImportsExports))
        .pipe(change(replaceMultilinesForm))
        .pipe(change(replaceUnicode))
        .on("error", (error) => {console.log(`🛑 Transpilation error: ${error}`)})
        .on("end", () => {
            console.log(`☑️   ESLint check completed for "${Array.isArray(path) ? path.filter(item => !item.includes('!')) : path}"`);
            console.log(`-------------------------------------------------------------`);
            console.log(`✅ File "${Array.isArray(path) ? path.filter(item => !item.includes('!')) : path}" transpiled successfully [${new Date().toLocaleTimeString()}] 🕙\n`)
        });
};
