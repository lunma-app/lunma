export { options_exportopml1 as "options_exportOpml" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Exportopml1Inputs = {};
/**
* | output |
* | --- |
* | "Export OPML" |
*
* @param {Options_Exportopml1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_exportopml1: ((inputs?: Options_Exportopml1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Exportopml1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
