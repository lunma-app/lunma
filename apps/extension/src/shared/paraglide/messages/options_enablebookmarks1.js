/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Enablebookmarks1Inputs */

const en_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enable bookmark results`)
};

const es_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activar resultados de marcadores`)
};

const pt_pt2_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ativar resultados de marcadores`)
};

const fr_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activer les résultats de marque-pages`)
};

const de_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lesezeichen-Ergebnisse aktivieren`)
};

const ja_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ブックマークの検索を有効にする`)
};

const ko_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`북마크 결과 활성화`)
};

const zh_cn2_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启用书签结果`)
};

const ru_options_enablebookmarks1 = /** @type {(inputs: Options_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Включить результаты из закладок`)
};

/**
* | output |
* | --- |
* | "Enable bookmark results" |
*
* @param {Options_Enablebookmarks1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_enablebookmarks1 = /** @type {((inputs?: Options_Enablebookmarks1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Enablebookmarks1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_enablebookmarks1(inputs)
	if (locale === "es") return es_options_enablebookmarks1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_enablebookmarks1(inputs)
	if (locale === "fr") return fr_options_enablebookmarks1(inputs)
	if (locale === "de") return de_options_enablebookmarks1(inputs)
	if (locale === "ja") return ja_options_enablebookmarks1(inputs)
	if (locale === "ko") return ko_options_enablebookmarks1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_enablebookmarks1(inputs)
	return ru_options_enablebookmarks1(inputs)
});
export { options_enablebookmarks1 as "options_enableBookmarks" }