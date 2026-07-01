export { options_exportbackup1 as "options_exportBackup" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Exportbackup1Inputs = {};
/**
* | output |
* | --- |
* | "Export backup" |
*
* @param {Options_Exportbackup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_exportbackup1: ((inputs?: Options_Exportbackup1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Exportbackup1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
