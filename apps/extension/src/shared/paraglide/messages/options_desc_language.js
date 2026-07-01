/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_LanguageInputs */

const en_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which language Lunma's interface uses — System follows your browser.`)
};

const es_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Idioma de la interfaz de Lunma — Sistema sigue tu navegador.`)
};

const pt_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Idioma da interface do Lunma — Sistema segue o browser.`)
};

const fr_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La langue de l'interface Lunma — Système suit celle de votre navigateur.`)
};

const de_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Welche Sprache Lunmas Oberfläche verwendet — System folgt deinem Browser.`)
};

const ja_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma のインターフェース言語 — 「システム」はブラウザに従います。`)
};

const ko_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma 인터페이스에 사용할 언어 — 시스템은 브라우저 설정을 따릅니다.`)
};

const zh_cn2_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lunma 界面使用的语言 — 跟随系统时以浏览器为准`)
};

const ru_options_desc_language = /** @type {(inputs: Options_Desc_LanguageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Язык интерфейса Lunma — «Системный» следует браузеру.`)
};

/**
* | output |
* | --- |
* | "Which language Lunma's interface uses — System follows your browser." |
*
* @param {Options_Desc_LanguageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_language = /** @type {((inputs?: Options_Desc_LanguageInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_LanguageInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_desc_language(inputs)
	if (locale === "es") return es_options_desc_language(inputs)
	if (locale === "pt") return pt_options_desc_language(inputs)
	if (locale === "fr") return fr_options_desc_language(inputs)
	if (locale === "de") return de_options_desc_language(inputs)
	if (locale === "ja") return ja_options_desc_language(inputs)
	if (locale === "ko") return ko_options_desc_language(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_language(inputs)
	return ru_options_desc_language(inputs)
});