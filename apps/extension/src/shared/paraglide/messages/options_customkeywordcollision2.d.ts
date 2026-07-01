export { options_customkeywordcollision2 as "options_customKeywordCollision" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Customkeywordcollision2Inputs = {
    keyword: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "{keyword} is a built-in keyword — the built-in wins." |
*
* @param {Options_Customkeywordcollision2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_customkeywordcollision2: ((inputs: Options_Customkeywordcollision2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Customkeywordcollision2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
