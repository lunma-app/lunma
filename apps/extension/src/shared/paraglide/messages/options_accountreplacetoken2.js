/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Accountreplacetoken2Inputs */

const en_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace token`)
};

const es_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reemplazar token`)
};

const pt_pt2_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Substituir token`)
};

const fr_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacer le token`)
};

const de_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token ersetzen`)
};

const ja_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`トークンを置き換え`)
};

const ko_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`토큰 교체`)
};

const zh_cn2_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`替换令牌`)
};

const ru_options_accountreplacetoken2 = /** @type {(inputs: Options_Accountreplacetoken2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Заменить токен`)
};

/**
* | output |
* | --- |
* | "Replace token" |
*
* @param {Options_Accountreplacetoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountreplacetoken2 = /** @type {((inputs?: Options_Accountreplacetoken2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountreplacetoken2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_accountreplacetoken2(inputs)
	if (locale === "es") return es_options_accountreplacetoken2(inputs)
	if (locale === "pt-PT") return pt_pt2_options_accountreplacetoken2(inputs)
	if (locale === "fr") return fr_options_accountreplacetoken2(inputs)
	if (locale === "de") return de_options_accountreplacetoken2(inputs)
	if (locale === "ja") return ja_options_accountreplacetoken2(inputs)
	if (locale === "ko") return ko_options_accountreplacetoken2(inputs)
	if (locale === "zh-CN") return zh_cn2_options_accountreplacetoken2(inputs)
	return ru_options_accountreplacetoken2(inputs)
});
export { options_accountreplacetoken2 as "options_accountReplaceToken" }