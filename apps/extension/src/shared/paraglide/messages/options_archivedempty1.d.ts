export { options_archivedempty1 as "options_archivedEmpty" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Archivedempty1Inputs = {};
/**
* | output |
* | --- |
* | "Nothing archived yet — idle temporary tabs land here so you can bring them back." |
*
* @param {Options_Archivedempty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_archivedempty1: ((inputs?: Options_Archivedempty1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Archivedempty1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
