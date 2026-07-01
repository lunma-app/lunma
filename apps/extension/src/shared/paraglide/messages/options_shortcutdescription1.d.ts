export { options_shortcutdescription1 as "options_shortcutDescription" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Shortcutdescription1Inputs = {
    modifier: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "{modifier}L isn't currently bound. Your browser has to set the keyboard shortcut — open its shortcuts page to bind it." |
*
* @param {Options_Shortcutdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_shortcutdescription1: ((inputs: Options_Shortcutdescription1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Shortcutdescription1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
