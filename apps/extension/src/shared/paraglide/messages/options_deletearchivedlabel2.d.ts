export { options_deletearchivedlabel2 as "options_deleteArchivedLabel" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Deletearchivedlabel2Inputs = {
    title: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Delete {title}" |
*
* @param {Options_Deletearchivedlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_deletearchivedlabel2: ((inputs: Options_Deletearchivedlabel2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Deletearchivedlabel2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
