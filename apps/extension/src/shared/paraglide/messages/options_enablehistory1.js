/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Enablehistory1Inputs */

const en_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enable history results`)
};

const es_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activar resultados del historial`)
};

const pt_pt2_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ativar resultados do histórico`)
};

const fr_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activer les résultats d'historique`)
};

const de_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verlauf-Ergebnisse aktivieren`)
};

const ja_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`履歴の検索を有効にする`)
};

const ko_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기록 결과 활성화`)
};

const zh_cn2_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`启用历史记录结果`)
};

const ru_options_enablehistory1 = /** @type {(inputs: Options_Enablehistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Включить результаты из истории`)
};

/**
* | output |
* | --- |
* | "Enable history results" |
*
* @param {Options_Enablehistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_enablehistory1 = /** @type {((inputs?: Options_Enablehistory1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Enablehistory1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_enablehistory1(inputs)
	if (locale === "es") return es_options_enablehistory1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_enablehistory1(inputs)
	if (locale === "fr") return fr_options_enablehistory1(inputs)
	if (locale === "de") return de_options_enablehistory1(inputs)
	if (locale === "ja") return ja_options_enablehistory1(inputs)
	if (locale === "ko") return ko_options_enablehistory1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_enablehistory1(inputs)
	return ru_options_enablehistory1(inputs)
});
export { options_enablehistory1 as "options_enableHistory" }