export { sidebar_spacetooltipedit2 as "sidebar_spaceTooltipEdit" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Spacetooltipedit2Inputs = {
    name: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "{name} · click to edit" |
*
* @param {Sidebar_Spacetooltipedit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_spacetooltipedit2: ((inputs: Sidebar_Spacetooltipedit2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Spacetooltipedit2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
