export { options_restorearchivedlabel2 as "options_restoreArchivedLabel" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Restorearchivedlabel2Inputs = {
    title: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Restore {title}" |
*
* @param {Options_Restorearchivedlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_restorearchivedlabel2: ((inputs: Options_Restorearchivedlabel2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Restorearchivedlabel2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
