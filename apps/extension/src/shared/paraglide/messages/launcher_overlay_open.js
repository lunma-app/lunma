/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_OpenInputs */

const en_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open`)
};

const es_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir`)
};

const pt_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir`)
};

const fr_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir`)
};

const de_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Öffnen`)
};

const ja_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`開く`)
};

const ko_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`열기`)
};

const zh_cn2_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`打开`)
};

const ru_launcher_overlay_open = /** @type {(inputs: Launcher_Overlay_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть`)
};

/**
* | output |
* | --- |
* | "Open" |
*
* @param {Launcher_Overlay_OpenInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_overlay_open = /** @type {((inputs?: Launcher_Overlay_OpenInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_OpenInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_open(inputs)
	if (locale === "es") return es_launcher_overlay_open(inputs)
	if (locale === "pt") return pt_launcher_overlay_open(inputs)
	if (locale === "fr") return fr_launcher_overlay_open(inputs)
	if (locale === "de") return de_launcher_overlay_open(inputs)
	if (locale === "ja") return ja_launcher_overlay_open(inputs)
	if (locale === "ko") return ko_launcher_overlay_open(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_open(inputs)
	return ru_launcher_overlay_open(inputs)
});