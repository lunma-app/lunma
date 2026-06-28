export { launcher_overlay_exitengine1 as "launcher_overlay_exitEngine" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Overlay_Exitengine1Inputs = {
    engine: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Exit {engine} search" |
*
* @param {Launcher_Overlay_Exitengine1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_overlay_exitengine1: ((inputs: Launcher_Overlay_Exitengine1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Overlay_Exitengine1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
