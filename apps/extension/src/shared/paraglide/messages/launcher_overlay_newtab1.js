/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_Newtab1Inputs */

const en_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New tab`)
};

const es_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva pestaña`)
};

const pt_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Novo separador`)
};

const fr_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvel onglet`)
};

const de_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neuer Tab`)
};

const ja_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新しいタブ`)
};

const ko_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 탭`)
};

const zh_cn2_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新标签页`)
};

const ru_launcher_overlay_newtab1 = /** @type {(inputs: Launcher_Overlay_Newtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Новая вкладка`)
};

/**
* | output |
* | --- |
* | "New tab" |
*
* @param {Launcher_Overlay_Newtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_newtab1 = /** @type {((inputs?: Launcher_Overlay_Newtab1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Newtab1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_newtab1(inputs)
	if (locale === "es") return es_launcher_overlay_newtab1(inputs)
	if (locale === "pt") return pt_launcher_overlay_newtab1(inputs)
	if (locale === "fr") return fr_launcher_overlay_newtab1(inputs)
	if (locale === "de") return de_launcher_overlay_newtab1(inputs)
	if (locale === "ja") return ja_launcher_overlay_newtab1(inputs)
	if (locale === "ko") return ko_launcher_overlay_newtab1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_newtab1(inputs)
	return ru_launcher_overlay_newtab1(inputs)
});
export { launcher_overlay_newtab1 as "launcher_overlay_newTab" }