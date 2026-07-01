export { sidebar_spacetooltipactivate2 as "sidebar_spaceTooltipActivate" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Spacetooltipactivate2Inputs = {
    name: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Activate {name}" |
*
* @param {Sidebar_Spacetooltipactivate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_spacetooltipactivate2: ((inputs: Sidebar_Spacetooltipactivate2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Spacetooltipactivate2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
