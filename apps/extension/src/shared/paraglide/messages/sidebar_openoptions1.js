/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Openoptions1Inputs */

const en_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Lunma options`)
};

const es_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir opciones de Lunma`)
};

const pt_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir opções do Lunma`)
};

const fr_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir les options Lunma`)
};

const de_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma-Einstellungen öffnen`)
};

const ja_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma オプションを開く`)
};

const ko_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma 옵션 열기`)
};

const zh_cn2_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`打开 Lunma 设置`)
};

const ru_sidebar_openoptions1 = /** @type {(inputs: Sidebar_Openoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть настройки Lunma`)
};

/**
* | output |
* | --- |
* | "Open Lunma options" |
*
* @param {Sidebar_Openoptions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_openoptions1 = /** @type {((inputs?: Sidebar_Openoptions1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Openoptions1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_openoptions1(inputs)
	if (locale === "es") return es_sidebar_openoptions1(inputs)
	if (locale === "pt") return pt_sidebar_openoptions1(inputs)
	if (locale === "fr") return fr_sidebar_openoptions1(inputs)
	if (locale === "de") return de_sidebar_openoptions1(inputs)
	if (locale === "ja") return ja_sidebar_openoptions1(inputs)
	if (locale === "ko") return ko_sidebar_openoptions1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_openoptions1(inputs)
	return ru_sidebar_openoptions1(inputs)
});
export { sidebar_openoptions1 as "sidebar_openOptions" }