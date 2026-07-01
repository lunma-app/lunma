/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_Dialoglabel1Inputs */

const en_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma launcher`)
};

const es_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lanzador de Lunma`)
};

const pt_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma launcher`)
};

const fr_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lanceur Lunma`)
};

const de_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma Launcher`)
};

const ja_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma ランチャー`)
};

const ko_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma 런처`)
};

const zh_cn2_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma 启动器`)
};

const ru_launcher_overlay_dialoglabel1 = /** @type {(inputs: Launcher_Overlay_Dialoglabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Лаунчер Lunma`)
};

/**
* | output |
* | --- |
* | "Lunma launcher" |
*
* @param {Launcher_Overlay_Dialoglabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_dialoglabel1 = /** @type {((inputs?: Launcher_Overlay_Dialoglabel1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Dialoglabel1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_dialoglabel1(inputs)
	if (locale === "es") return es_launcher_overlay_dialoglabel1(inputs)
	if (locale === "pt") return pt_launcher_overlay_dialoglabel1(inputs)
	if (locale === "fr") return fr_launcher_overlay_dialoglabel1(inputs)
	if (locale === "de") return de_launcher_overlay_dialoglabel1(inputs)
	if (locale === "ja") return ja_launcher_overlay_dialoglabel1(inputs)
	if (locale === "ko") return ko_launcher_overlay_dialoglabel1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_dialoglabel1(inputs)
	return ru_launcher_overlay_dialoglabel1(inputs)
});
export { launcher_overlay_dialoglabel1 as "launcher_overlay_dialogLabel" }