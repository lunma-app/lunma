export { options_cleararchivedconfirm2 as "options_clearArchivedConfirm" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Cleararchivedconfirm2Inputs = {};
/**
* | output |
* | --- |
* | "Delete all archived records? This cannot be undone." |
*
* @param {Options_Cleararchivedconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_cleararchivedconfirm2: ((inputs?: Options_Cleararchivedconfirm2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Cleararchivedconfirm2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
