/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_Alreadyopen1Inputs */

const en_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`already open`)
};

const es_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ya abierta`)
};

const pt_pt2_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`já aberto`)
};

const fr_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`déjà ouvert`)
};

const de_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`bereits geöffnet`)
};

const ja_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すでに開いています`)
};

const ko_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미 열려 있음`)
};

const zh_cn2_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`已打开`)
};

const ru_launcher_overlay_alreadyopen1 = /** @type {(inputs: Launcher_Overlay_Alreadyopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`уже открыто`)
};

/**
* | output |
* | --- |
* | "already open" |
*
* @param {Launcher_Overlay_Alreadyopen1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_alreadyopen1 = /** @type {((inputs?: Launcher_Overlay_Alreadyopen1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Alreadyopen1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_alreadyopen1(inputs)
	if (locale === "es") return es_launcher_overlay_alreadyopen1(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_overlay_alreadyopen1(inputs)
	if (locale === "fr") return fr_launcher_overlay_alreadyopen1(inputs)
	if (locale === "de") return de_launcher_overlay_alreadyopen1(inputs)
	if (locale === "ja") return ja_launcher_overlay_alreadyopen1(inputs)
	if (locale === "ko") return ko_launcher_overlay_alreadyopen1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_alreadyopen1(inputs)
	return ru_launcher_overlay_alreadyopen1(inputs)
});
export { launcher_overlay_alreadyopen1 as "launcher_overlay_alreadyOpen" }