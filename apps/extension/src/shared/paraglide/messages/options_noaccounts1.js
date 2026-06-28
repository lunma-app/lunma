/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Noaccounts1Inputs */

const en_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No accounts yet.`)
};

const es_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay cuentas.`)
};

const pt_pt2_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda sem contas.`)
};

const fr_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun compte pour l'instant.`)
};

const de_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Konten.`)
};

const ja_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アカウントはまだありません。`)
};

const ko_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정이 없습니다.`)
};

const zh_cn2_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂无账户`)
};

const ru_options_noaccounts1 = /** @type {(inputs: Options_Noaccounts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Нет аккаунтов.`)
};

/**
* | output |
* | --- |
* | "No accounts yet." |
*
* @param {Options_Noaccounts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_noaccounts1 = /** @type {((inputs?: Options_Noaccounts1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Noaccounts1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_noaccounts1(inputs)
	if (locale === "es") return es_options_noaccounts1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_noaccounts1(inputs)
	if (locale === "fr") return fr_options_noaccounts1(inputs)
	if (locale === "de") return de_options_noaccounts1(inputs)
	if (locale === "ja") return ja_options_noaccounts1(inputs)
	if (locale === "ko") return ko_options_noaccounts1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_noaccounts1(inputs)
	return ru_options_noaccounts1(inputs)
});
export { options_noaccounts1 as "options_noAccounts" }