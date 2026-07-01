/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Openoptionsaria2Inputs */

const en_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open options`)
};

const es_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir opciones`)
};

const pt_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir opções`)
};

const fr_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir les options`)
};

const de_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einstellungen öffnen`)
};

const ja_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`オプションを開く`)
};

const ko_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`옵션 열기`)
};

const zh_cn2_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`打开选项`)
};

const ru_sidebar_openoptionsaria2 = /** @type {(inputs: Sidebar_Openoptionsaria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть настройки`)
};

/**
* | output |
* | --- |
* | "Open options" |
*
* @param {Sidebar_Openoptionsaria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_openoptionsaria2 = /** @type {((inputs?: Sidebar_Openoptionsaria2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Openoptionsaria2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_openoptionsaria2(inputs)
	if (locale === "es") return es_sidebar_openoptionsaria2(inputs)
	if (locale === "pt") return pt_sidebar_openoptionsaria2(inputs)
	if (locale === "fr") return fr_sidebar_openoptionsaria2(inputs)
	if (locale === "de") return de_sidebar_openoptionsaria2(inputs)
	if (locale === "ja") return ja_sidebar_openoptionsaria2(inputs)
	if (locale === "ko") return ko_sidebar_openoptionsaria2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_openoptionsaria2(inputs)
	return ru_sidebar_openoptionsaria2(inputs)
});
export { sidebar_openoptionsaria2 as "sidebar_openOptionsAria" }