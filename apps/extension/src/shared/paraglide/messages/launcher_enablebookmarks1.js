/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Enablebookmarks1Inputs */

const en_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enable bookmark results`)
};

const es_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activar resultados de marcadores`)
};

const pt_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ativar resultados de marcadores`)
};

const fr_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activer les résultats de marque-pages`)
};

const de_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lesezeichen-Ergebnisse aktivieren`)
};

const ja_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ブックマークの検索を有効にする`)
};

const ko_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`북마크 결과 활성화`)
};

const zh_cn2_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启用书签结果`)
};

const ru_launcher_enablebookmarks1 = /** @type {(inputs: Launcher_Enablebookmarks1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Включить результаты из закладок`)
};

/**
* | output |
* | --- |
* | "Enable bookmark results" |
*
* @param {Launcher_Enablebookmarks1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enablebookmarks1 = /** @type {((inputs?: Launcher_Enablebookmarks1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enablebookmarks1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_enablebookmarks1(inputs)
	if (locale === "es") return es_launcher_enablebookmarks1(inputs)
	if (locale === "pt") return pt_launcher_enablebookmarks1(inputs)
	if (locale === "fr") return fr_launcher_enablebookmarks1(inputs)
	if (locale === "de") return de_launcher_enablebookmarks1(inputs)
	if (locale === "ja") return ja_launcher_enablebookmarks1(inputs)
	if (locale === "ko") return ko_launcher_enablebookmarks1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_enablebookmarks1(inputs)
	return ru_launcher_enablebookmarks1(inputs)
});
export { launcher_enablebookmarks1 as "launcher_enableBookmarks" }