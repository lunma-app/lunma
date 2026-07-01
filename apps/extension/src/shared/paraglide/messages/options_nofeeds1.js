/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Nofeeds1Inputs */

const en_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No feeds yet.`)
};

const es_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay feeds.`)
};

const pt_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda sem feeds.`)
};

const fr_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun flux pour l'instant.`)
};

const de_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Feeds.`)
};

const ja_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィードはまだありません。`)
};

const ko_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`피드가 없습니다.`)
};

const zh_cn2_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂无订阅源`)
};

const ru_options_nofeeds1 = /** @type {(inputs: Options_Nofeeds1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Нет лент.`)
};

/**
* | output |
* | --- |
* | "No feeds yet." |
*
* @param {Options_Nofeeds1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_nofeeds1 = /** @type {((inputs?: Options_Nofeeds1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Nofeeds1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_nofeeds1(inputs)
	if (locale === "es") return es_options_nofeeds1(inputs)
	if (locale === "pt") return pt_options_nofeeds1(inputs)
	if (locale === "fr") return fr_options_nofeeds1(inputs)
	if (locale === "de") return de_options_nofeeds1(inputs)
	if (locale === "ja") return ja_options_nofeeds1(inputs)
	if (locale === "ko") return ko_options_nofeeds1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_nofeeds1(inputs)
	return ru_options_nofeeds1(inputs)
});
export { options_nofeeds1 as "options_noFeeds" }