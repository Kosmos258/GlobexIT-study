import { task } from "gulp";
import { build } from "./gulp/tasks/build.task";
import { dev } from "./gulp/tasks/dev.task";
import { deploy } from "./gulp/tasks/deploy.task";
import { ping } from "./gulp/tasks/ping.task";

//Отслеживание файлов
task("dev", dev);

//Билд
task("build", build);

//Деплой папки билд
task("deploy", deploy);

//Проверка доступности сервера
task("ping", ping);
