export { options_importbackup1 as "options_importBackup" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Importbackup1Inputs = {};
/**
* | output |
* | --- |
* | "Import backup" |
*
* @param {Options_Importbackup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_importbackup1: ((inputs?: Options_Importbackup1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Importbackup1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
