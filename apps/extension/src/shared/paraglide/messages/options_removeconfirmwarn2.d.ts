export { options_removeconfirmwarn2 as "options_removeConfirmWarn" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Removeconfirmwarn2Inputs = {
    count: NonNullable<unknown>;
};
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Still used in {count} lens — those sections will show \"account removed\"." |
* | "other" | "Still used in {count} lenses — those sections will show \"account removed\"." |
*
* @param {Options_Removeconfirmwarn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_removeconfirmwarn2: ((inputs: Options_Removeconfirmwarn2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Removeconfirmwarn2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
