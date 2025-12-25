# Памятка по библиотеке DPrint для автоформатирования кода

### [Ссылка на документацию](https://dprint.dev/config/)

## Пример файла конфигурации

```
{
  "lineWidth": 80,
  "typescript": {
    // This applies to both JavaScript & TypeScript
    "quoteStyle": "preferSingle",
    "binaryExpression.operatorPosition": "sameLine"
  },
  "json": {
    "indentWidth": 2
  },
  "excludes": [
    "**/*-lock.json"
  ],
  "plugins": [
    // You may specify any urls or file paths here that you wish.
    "https://plugins.dprint.dev/typescript-0.95.3.wasm",
    "https://plugins.dprint.dev/json-0.20.0.wasm",
    "https://plugins.dprint.dev/markdown-0.18.0.wasm"
  ]
}
```

## Plugins

Свойство plugins указывает, какие плагины использовать для форматирования. Это могут быть как URL-адреса, так и пути к файлу WebAssembly плагинов.

```json
{
  // ...omitted...
  "plugins": [
    // You may specify any urls or file paths here that you wish.
    "https://plugins.dprint.dev/typescript-0.95.3.wasm",
    "https://plugins.dprint.dev/json-0.20.0.wasm",
    "https://plugins.dprint.dev/markdown-0.18.0.wasm"
  ]
}
```

## Excludes

Свойство excludes указывает пути к файлам, которые необходимо игнорировать при форматировании.

Паттерны пишутся как глоббинги в [gitignore](https://git-scm.com/docs/gitignore#_pattern_format).

```json
{
  // ...omitted...
  "excludes": [
    "**/*-lock.json"
  ]
}
```

Файлы, добавленные в gitignore, игнорируются форматером по умолчанию, но это можно обойти с помощью специальной формы записи пути: 

```json
{
  "excludes": [
    // will format dist.js even though it's gitignored
    "!dist.js"
  ]
}
```

## Includes

Свойство includes можно использовать для форматирования только определенных файлов. Свойство не является обязательным .

```json
{
  // ...omitted...
  "includes": [
    "src/**/*.{ts,tsx,js,jsx,json}"
  ]
}
```

**Ниже будет подробно описан конфиг файл этого шаблона**

### Biome (js, ts, jsx, tsx, json)

| Параметр           | Значения                   | Описание                                                                      |
| ------------------ | -------------------------- | ----------------------------------------------------------------------------- |
| `indentWidth`      | `number`                   | Количество символов в отступе                                                 |
| `indentStyle`      | `"space"` / `"tab"`        | Тип отступа                                                                   |
| `lineWidth`        | `number`                   | Максимальное кол-во символов в одной строке                                   |
| `semicolons`       | `"always"` / `"asNeeded"`  | Точка с запятой в конце выражений.                                            |
| `json.indentWidth` | `number`                   | То же самое только для JSON файлов                                            |
| `json.indentStyle` | `"space"` / `"tab"`        | То же самое только для JSON файлов                                            |
| `css.enabled`      | `boolean`                  | Форматирование CSS файлов                                                     |
| `quoteStyle`       | `"double"` / `"single"`    | Кавычки в строках                                                             |
| `trailingCommas`   | `"all"`/`"es5"`/`"none"`   | Запятая после последнего перечисляемого элемента (например, свойство объекта) |
| `arrowParentheses` | `"always"` / `"asNeeded"`  | Скобки у параметров стрелочных функций                                        |
| `quoteProperties`  | `"asNeeded"` . `"always"`  | Названия свойств объектов в кавычках                                          |
| `lineEnding`       | `"lf"` / `"crlf"` / `"cr"` | Тип обозначения конца строки                                                  |
| `bracketSameLine`  | `boolean`                  | Разместить угловую скобку на той же строке что и последний атрибут            |
| `bracketSpacing`   | `boolean`                  | Пробелы между скобками. Ex: `const obj = { item: 'value' }`                   |



### Malva (CSS, Sass, SCSS)

| Параметр                           | Значения                                                               | Описание                                                               |
| ---------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `printWidth`                       | `number`                                                               | Максимальное кол-во символов в одной строке                            |
| `useTabs`                          | `boolean`                                                              | Табы в отступах                                                        |
| `indentWidth`                      | `number`                                                               | Количество символов в отступе                                          |
| `lineBreak`                        | `"lf"` / `"crlf"`                                                      | Тип обозначения конца строки                                           |
| `hexCase`                          | `"lower"` / `"upper"`/ `"ignore"`                                      | Форматирование hex кодов                                               |
| `quotes`                           | `"alwaysDouble"` / `"alwaysSingle"` /`"preferDouble"`/`"preferSingle"` | Тип кавычек                                                            |
| `operatorLinebreak`                | `"before"` / `"after"`                                                 | Новая строка ставится перед или после оператора выражений.             |
| `blockSelectorLinebreak`           | `"always"`/`"consistent"`/`"wrap"`                                     | Поведение разрыва строки после запятых в селекторе                     |
| `omitNumberLeadingZero`            | `boolean`                                                              | Опускаем 0 в дробных числах, которые начинаются с 0                    |
| `trailingComma`                    | `boolean`                                                              | Запятая после последнего перечисляемого элемента                       |
| `formatComments`                   | `boolean`                                                              | Форматирование комментариев                                            |
| `alignComments`                    | `boolean`                                                              | Выравнивание комментариев                                              |
| `linebreakInPseudoParens`          | `boolean`                                                              | Разрыв строки в скобках псевдоклассов                                  |
| `attrValueQuotes`                  | `"always"`/`"ignore"`                                                  | Контролирует нужно ли добавлять кавычки значениям атрибутов            |
| `preferSingleLine`                 | `boolean`                                                              | Запись в 1 строку там, где это возможно                                |
| `singleLineTopLevelDeclarations`   | `boolean`                                                              | Контролирует форматирование всех объявлений верхнего уровня в 1 строку |
| `selectorOverrideCommentDirective` | `string`                                                               | Директива для перезаписи форматирования селектора                      |
| `ignoreCommentDirective`           | `string`                                                               | Директива для игнорирования определенного выражения                    |
| `ignoreFileCommentDirective`       | `string`                                                               | Директива для игнорирования всего файла форматером                     |
