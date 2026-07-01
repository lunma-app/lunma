export { options_reachused1 as "options_reachUsed" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Reachused1Inputs = {
    count: NonNullable<unknown>;
};
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Used in {count} lens" |
* | "other" | "Used in {count} lenses" |
*
* @param {Options_Reachused1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_reachused1: ((inputs: Options_Reachused1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Reachused1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
