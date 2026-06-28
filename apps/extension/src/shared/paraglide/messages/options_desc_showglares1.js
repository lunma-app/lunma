/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Showglares1Inputs */

const en_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soft aurora glare behind the app.`)
};

const es_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aurora suave detrás de la app.`)
};

const pt_pt2_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brilho suave de aurora por trás da aplicação.`)
};

const fr_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Douce aurore derrière l'application.`)
};

const de_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sanftes Aurora-Leuchten hinter der App.`)
};

const ja_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アプリの背後に柔らかなオーロラ。`)
};

const ko_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`앱 뒤에 부드러운 오로라 광채.`)
};

const zh_cn2_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`应用背后柔和的极光光晕`)
};

const ru_options_desc_showglares1 = /** @type {(inputs: Options_Desc_Showglares1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Мягкое свечение авроры позади приложения.`)
};

/**
* | output |
* | --- |
* | "Soft aurora glare behind the app." |
*
* @param {Options_Desc_Showglares1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_showglares1 = /** @type {((inputs?: Options_Desc_Showglares1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Showglares1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_showglares1(inputs)
	if (locale === "es") return es_options_desc_showglares1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_desc_showglares1(inputs)
	if (locale === "fr") return fr_options_desc_showglares1(inputs)
	if (locale === "de") return de_options_desc_showglares1(inputs)
	if (locale === "ja") return ja_options_desc_showglares1(inputs)
	if (locale === "ko") return ko_options_desc_showglares1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_showglares1(inputs)
	return ru_options_desc_showglares1(inputs)
});
export { options_desc_showglares1 as "options_desc_showGlares" }