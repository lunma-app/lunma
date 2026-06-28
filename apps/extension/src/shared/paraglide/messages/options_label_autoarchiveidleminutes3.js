/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Autoarchiveidleminutes3Inputs */

const en_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Idle minutes before archiving`)
};

const es_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minutos inactivo antes de archivar`)
};

const pt_pt2_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minutos de inatividade antes de arquivar`)
};

const fr_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minutes d'inactivité avant archivage`)
};

const de_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inaktive Minuten vor dem Archivieren`)
};

const ja_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アーカイブまでのアイドル時間（分）`)
};

const ko_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보관 전 유휴 시간(분)`)
};

const zh_cn2_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`归档前的闲置分钟数`)
};

const ru_options_label_autoarchiveidleminutes3 = /** @type {(inputs: Options_Label_Autoarchiveidleminutes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Минут простоя до архивирования`)
};

/**
* | output |
* | --- |
* | "Idle minutes before archiving" |
*
* @param {Options_Label_Autoarchiveidleminutes3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_autoarchiveidleminutes3 = /** @type {((inputs?: Options_Label_Autoarchiveidleminutes3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Autoarchiveidleminutes3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_autoarchiveidleminutes3(inputs)
	if (locale === "es") return es_options_label_autoarchiveidleminutes3(inputs)
	if (locale === "pt-PT") return pt_pt2_options_label_autoarchiveidleminutes3(inputs)
	if (locale === "fr") return fr_options_label_autoarchiveidleminutes3(inputs)
	if (locale === "de") return de_options_label_autoarchiveidleminutes3(inputs)
	if (locale === "ja") return ja_options_label_autoarchiveidleminutes3(inputs)
	if (locale === "ko") return ko_options_label_autoarchiveidleminutes3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_autoarchiveidleminutes3(inputs)
	return ru_options_label_autoarchiveidleminutes3(inputs)
});
export { options_label_autoarchiveidleminutes3 as "options_label_autoArchiveIdleMinutes" }